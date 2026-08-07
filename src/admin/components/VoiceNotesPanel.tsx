import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Mic, Pause, Play, RefreshCw, Square, Trash2, Upload, X } from 'lucide-react';
import { api } from '../api/client';
import type { VoiceNoteSummary } from '../types';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

type Target = { recordType: 'enquiry' | 'booking'; recordId: string };
const MAX_SECONDS = 120;

export function VoiceNotesPanel({ recordType, recordId }: Target) {
  const confirm = useConfirmDialog();
  const [notes, setNotes] = useState<VoiceNoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState<{ id: string; url: string } | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number>();

  const load = useCallback(async () => {
    setError('');
    try { setNotes(await api.listVoiceNotes({ recordType, recordId })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load voice notes.'); }
    finally { setLoading(false); }
  }, [recordId, recordType]);

  const releaseRecorder = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = undefined;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => {
    releaseRecorder();
    if (preview) URL.revokeObjectURL(preview.url);
    if (playing) URL.revokeObjectURL(playing.url);
  }, [playing, preview, releaseRecorder]);

  const closeRecorder = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseRecorder();
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setElapsed(0);
    setRecorderOpen(false);
    setError('');
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported in this browser.');
      return;
    }
    try {
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const duration = Math.max(1, Math.min(MAX_SECONDS, (Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' });
        if (blob.size) setPreview({ blob, url: URL.createObjectURL(blob), duration });
        else setError('No audio was captured. Please try again.');
        releaseRecorder();
      };
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      recorder.start(500);
      timerRef.current = window.setInterval(() => {
        const seconds = Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAtRef.current) / 1000));
        setElapsed(seconds);
        if (seconds >= MAX_SECONDS && recorder.state === 'recording') recorder.stop();
      }, 250);
    } catch (err) {
      releaseRecorder();
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setError(denied ? 'Microphone access was denied. Allow microphone access and try again.' : 'Could not start the microphone.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const upload = async () => {
    if (!preview || uploading) return;
    setUploading(true);
    setError('');
    try {
      const saved = await api.createVoiceNote({ recordType, recordId }, preview.blob, preview.duration);
      setNotes(current => [saved, ...current]);
      closeRecorder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Your recording is still available to retry.');
      setUploading(false);
    }
  };

  const play = async (note: VoiceNoteSummary) => {
    if (playing?.id === note.id) {
      URL.revokeObjectURL(playing.url);
      setPlaying(null);
      return;
    }
    setLoadingAudioId(note.id);
    setError('');
    try {
      const blob = await api.getVoiceNoteContent(note.id);
      if (playing) URL.revokeObjectURL(playing.url);
      setPlaying({ id: note.id, url: URL.createObjectURL(blob) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not play this voice note.'); }
    finally { setLoadingAudioId(''); }
  };

  const remove = async (note: VoiceNoteSummary) => {
    const accepted = await confirm({ title: 'Delete voice note?', description: 'This permanently removes the recording for all internal users.', confirmLabel: 'Delete recording', variant: 'danger' });
    if (!accepted) return;
    setError('');
    try {
      await api.deleteVoiceNote(note.id);
      if (playing?.id === note.id) { URL.revokeObjectURL(playing.url); setPlaying(null); }
      setNotes(current => current.filter(row => row.id !== note.id));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete the voice note.'); }
  };

  const supported = typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Voice notes</h2><p className="mt-1 text-sm text-slate-500">Private recordings for internal context.</p></div><button type="button" disabled={!supported} onClick={() => setRecorderOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white disabled:bg-slate-300"><Mic className="h-4 w-4" />Record</button></div>
    {!supported && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Voice recording is not supported in this browser.</p>}
    {error && !recorderOpen && <div className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}<button type="button" onClick={() => void load()} className="ml-auto"><RefreshCw className="h-4 w-4" /></button></div>}
    {loading ? <div className="flex h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div> : <div className="mt-4 divide-y divide-slate-100">{notes.map(note => <div key={note.id} className="py-3"><div className="flex items-center gap-3"><button type="button" onClick={() => void play(note)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700" aria-label={playing?.id === note.id ? 'Stop voice note' : 'Play voice note'}>{loadingAudioId === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : playing?.id === note.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><div className="min-w-0 flex-1"><p className="font-medium text-slate-800">{formatDuration(note.durationSeconds)} voice note</p><p className="truncate text-xs text-slate-500">{note.createdBy.name} · {new Date(note.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })} · {formatSize(note.sizeBytes)}</p></div><button type="button" onClick={() => void remove(note)} className="flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" aria-label="Delete voice note"><Trash2 className="h-4 w-4" /></button></div>{playing?.id === note.id && <audio controls autoPlay src={playing.url} className="mt-3 w-full" onEnded={() => { URL.revokeObjectURL(playing.url); setPlaying(null); }} />}</div>)}{!notes.length && <p className="py-6 text-center text-sm text-slate-500">No voice notes yet.</p>}</div>}
    {recorderOpen && <div className="fixed inset-0 z-[88] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="voice-recorder-title"><div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"><div className="flex items-center justify-between"><div><h3 id="voice-recorder-title" className="font-semibold text-slate-900">Quick voice note</h3><p className="text-sm text-slate-500">Maximum 2 minutes.</p></div><button type="button" onClick={closeRecorder} className="flex h-11 w-11 items-center justify-center" aria-label="Close"><X className="h-5 w-5" /></button></div>{error && <div className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}<div className="mt-6 text-center">{recording ? <><div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-100 text-red-600"><Mic className="h-8 w-8" /></div><p className="mt-4 text-3xl font-semibold tabular-nums text-slate-900">{formatDuration(elapsed)}</p><button type="button" onClick={stopRecording} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-red-600 px-5 font-semibold text-white"><Square className="h-4 w-4 fill-current" />Stop recording</button></> : preview ? <><audio controls src={preview.url} className="w-full" /><p className="mt-2 text-sm text-slate-500">{formatDuration(preview.duration)} · {formatSize(preview.blob.size)}</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={uploading} onClick={() => void startRecording()} className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-700">Re-record</button><button type="button" disabled={uploading} onClick={() => void upload()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? 'Uploading…' : 'Upload note'}</button></div></> : <><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Mic className="h-8 w-8" /></div><button type="button" onClick={() => void startRecording()} className="mt-5 h-12 rounded-xl bg-blue-600 px-6 font-semibold text-white">Start recording</button></>}</div><div className="pb-[env(safe-area-inset-bottom)]" /></div></div>}
  </section>;
}

function preferredMimeType() {
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type)) || '';
}
function formatDuration(value: number) { const seconds = Math.max(0, Math.round(value)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function formatSize(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`; }
