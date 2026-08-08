import { useEffect, useState } from 'react';
import { AlertTriangle, MessageCircle, X } from 'lucide-react';
import { whatsappUrl } from '../contact';
import {
  manualWhatsAppMessage,
  manualWhatsAppTemplates,
  type ManualWhatsAppContext,
  type WhatsAppTemplateId,
} from './whatsappTemplates';

export function WhatsAppComposer({ context, initialTemplate = 'enquiry_follow_up', onClose, onOpened }: { context: ManualWhatsAppContext; initialTemplate?: WhatsAppTemplateId; onClose: () => void; onOpened?: () => void | Promise<void> }) {
  const startingTemplate = context.optedOut ? 'custom' : initialTemplate;
  const [template, setTemplate] = useState<WhatsAppTemplateId>(startingTemplate);
  const [message, setMessage] = useState(() => manualWhatsAppMessage(startingTemplate, context));
  useEffect(() => setMessage(manualWhatsAppMessage(template, context)), [context, template]);
  const select = (id: WhatsAppTemplateId) => {
    if (context.optedOut && id !== 'custom') return;
    setTemplate(id);
  };
  const open = () => {
    window.open(whatsappUrl(context.phone, message), '_blank', 'noopener,noreferrer');
    void onOpened?.();
    onClose();
  };
  return <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="whatsapp-composer-title">
    <div className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
      <header className="flex items-center justify-between border-b border-slate-200 p-4"><div><h2 id="whatsapp-composer-title" className="font-semibold text-slate-900">Message {context.customerName}</h2><p className="text-sm text-slate-500">Review and edit before WhatsApp opens.</p></div><button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></header>
      <div className="space-y-4 overflow-y-auto p-4">
        {context.optedOut && <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" /><span>This customer opted out. Prefilled templates are disabled; only open a custom chat when appropriate.</span></div>}
        {!context.optedOut && <p className={`rounded-xl px-3 py-2 text-sm font-medium ${context.consentRecorded ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{context.consentRecorded ? 'WhatsApp consent is recorded.' : 'WhatsApp consent is not recorded.'}</p>}
        <div className="flex flex-wrap gap-2">{manualWhatsAppTemplates.map(option => <button key={option.id} type="button" disabled={Boolean(context.optedOut && option.id !== 'custom')} onClick={() => select(option.id)} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold disabled:opacity-40 ${template === option.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-600'}`}>{option.label}</button>)}</div>
        <label className="block text-sm font-medium text-slate-700">Message<textarea autoFocus rows={8} value={message} onChange={event => setMessage(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-base leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Write a WhatsApp message" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-700">Cancel</button><button type="button" onClick={open} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white"><MessageCircle className="h-5 w-5" />Open WhatsApp</button></div>
    </div>
  </div>;
}
