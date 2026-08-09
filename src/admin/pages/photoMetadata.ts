export type MetadataGenerationStatus =
  | 'waiting_for_category'
  | 'generation_available'
  | 'queued'
  | 'preparing_model'
  | 'downloading_model'
  | 'loading_model'
  | 'generating'
  | 'generated'
  | 'fallback'
  | 'manually_edited';

export interface LocalMetadataGenerationCapability {
  automatic: boolean;
  reasons: string[];
}

interface BrowserCapabilitySource {
  onLine?: boolean;
  gpu?: unknown;
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

export interface GeneratedPhotoMetadata {
  title: string;
  altText: string;
  warning?: string;
}

const TITLE_LIMIT = 70;
const ALT_TEXT_LIMIT = 180;

export function getLocalMetadataGenerationCapability(
  source?: BrowserCapabilitySource,
): LocalMetadataGenerationCapability {
  const browser = source ?? (typeof navigator === 'undefined'
    ? undefined
    : navigator as Navigator & BrowserCapabilitySource);
  if (!browser) return { automatic: false, reasons: ['browser capability information is unavailable'] };

  const reasons: string[] = [];
  if (browser.onLine === false) reasons.push('the browser is offline');
  if (browser.connection?.saveData) reasons.push('Data Saver is enabled');
  if (['slow-2g', '2g'].includes(browser.connection?.effectiveType ?? '')) {
    reasons.push('the current connection is slow');
  }
  if (typeof browser.deviceMemory === 'number' && browser.deviceMemory < 4) {
    reasons.push('this device reports limited memory');
  }
  if (!browser.gpu) reasons.push('WebGPU is unavailable');

  return { automatic: reasons.length === 0, reasons };
}

function limitAtWord(value: string, maximum: number): string {
  if (value.length <= maximum) return value;
  const contentLimit = Math.max(1, maximum - 1);
  const shortened = value.slice(0, contentLimit + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > contentLimit * 0.6 ? lastSpace : contentLimit).trim()}…`;
}

function sentenceCase(value: string): string {
  const clean = value.trim().replace(/^[,.;:\s]+|[,;:\s]+$/g, '');
  if (!clean) return '';
  const sentence = `${clean[0].toUpperCase()}${clean.slice(1)}`;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function titleCase(value: string): string {
  const minorWords = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'the', 'to', 'with']);
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLocaleLowerCase();
      if (index > 0 && minorWords.has(lower)) return lower;
      return `${lower.charAt(0).toLocaleUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

function normalizeCaption(caption: string): string {
  return caption
    .replace(/^(?:this is |there is |the image (?:shows|depicts) |(?:an?|the) (?:image|photo|picture) of )/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function captionNeedsConservativeMetadata(caption: string): boolean {
  return [
    /\b(?:cut|cutting|slice|slicing)\b.{0,40}\b(?:neck|throat|head|face|body)\b/i,
    /\b(?:neck|throat|head|face|body)\b.{0,40}\b(?:cut|cutting|slice|slicing)\b/i,
    /\b(?:cut|cutting|slice|slicing)\s+(?:(?:a|the)\s+)?(?:person|man|woman|child|baby)(?:'s)?\b/i,
    /\b(?:attack|attacking|blood|choke|choking|gun|injure|injuring|kill|killing|knife|shoot|shooting|stab|stabbing|strangle|strangling|weapon)\b/i,
  ].some(pattern => pattern.test(caption));
}

function getConservativePeopleDescription(caption: string): { title: string; alt: string } | null {
  const hasBride = /\bbride\b/i.test(caption);
  const hasGroom = /\bgroom\b/i.test(caption);
  if (hasBride && hasGroom) return { title: 'Bride and Groom', alt: 'A bride and groom' };

  const hasWoman = hasBride || /\b(?:woman|women)\b/i.test(caption);
  const hasMan = hasGroom || /\b(?:man|men)\b/i.test(caption);
  if (hasWoman && hasMan) return { title: 'Man and Woman', alt: 'A man and woman' };
  if (/\bcouple\b/i.test(caption)) return { title: 'Couple', alt: 'A couple' };
  if (/\b(?:baby|infant|newborn)\b/i.test(caption)) return { title: 'Baby', alt: 'A baby' };
  if (/\b(?:child|children|boy|girl|kid)\b/i.test(caption)) return { title: 'Child', alt: 'A child' };
  if (hasWoman) return { title: 'Woman', alt: 'A woman' };
  if (hasMan) return { title: 'Man', alt: 'A man' };
  if (/\b(?:person|people)\b/i.test(caption)) return { title: 'People', alt: 'People' };
  return null;
}

function buildConservativeGeneratedMetadata(
  caption: string,
  categoryName: string,
  filename: string,
): GeneratedPhotoMetadata {
  const people = getConservativePeopleDescription(caption);
  if (!people) {
    return {
      ...buildFallbackPhotoMetadata(categoryName, filename),
      warning: 'The local model produced an unreliable description, so safe general details were added. Please review them before publishing.',
    };
  }

  const category = categoryName.trim().replace(/\bphotography\b/gi, '').trim() || 'Portfolio';
  return {
    title: limitAtWord(`${people.title} — ${titleCase(category)} Portrait`, TITLE_LIMIT),
    altText: limitAtWord(
      sentenceCase(`${people.alt} together during a ${category.toLocaleLowerCase()} photography session`),
      ALT_TEXT_LIMIT,
    ),
    warning: 'The local model produced an unreliable action description, so conservative details were used. Please review them before publishing.',
  };
}

export function cleanPhotoFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, '');
  const normalized = withoutExtension
    .replace(/^chatgpt[\s_-]*image.*$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(?:img|image|photo|dsc)[\s_-]*\d+\b/gi, '')
    .replace(/\b(?:doll[\s_-]*pictures?|erode)\b/gi, '')
    .replace(/\b\d{3,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return titleCase(normalized);
}

export function buildGeneratedPhotoMetadata(
  caption: string,
  categoryName: string,
  filename: string,
): GeneratedPhotoMetadata {
  const normalizedCaption = normalizeCaption(caption);
  if (!normalizedCaption) return buildFallbackPhotoMetadata(categoryName, filename);
  if (captionNeedsConservativeMetadata(normalizedCaption)) {
    return buildConservativeGeneratedMetadata(normalizedCaption, categoryName, filename);
  }

  const captionWithoutPunctuation = normalizedCaption.replace(/[.!?]+$/, '');
  const titleCaption = captionWithoutPunctuation.replace(/^(?:a|an|the)\s+/i, '');
  const captionWords = titleCaption.split(/\s+/).slice(0, 10).join(' ');
  const normalizedCategory = categoryName.trim();
  const categoryAlreadyPresent = normalizedCategory
    ? captionWithoutPunctuation.toLocaleLowerCase().includes(normalizedCategory.toLocaleLowerCase())
    : true;
  const titleCandidate = categoryAlreadyPresent
    ? titleCase(captionWords)
    : `${titleCase(captionWords)} — ${titleCase(normalizedCategory)}`;

  const contextualCaption = categoryAlreadyPresent || !normalizedCategory
    ? captionWithoutPunctuation
    : `${captionWithoutPunctuation} during a ${normalizedCategory.toLocaleLowerCase()} photography session`;

  return {
    title: limitAtWord(titleCandidate, TITLE_LIMIT),
    altText: limitAtWord(sentenceCase(contextualCaption), ALT_TEXT_LIMIT),
  };
}

export function buildFallbackPhotoMetadata(
  categoryName: string,
  filename: string,
): GeneratedPhotoMetadata {
  const category = titleCase(categoryName.trim() || 'Portfolio');
  const cleanedFilename = cleanPhotoFilename(filename);
  const filenameLooksUseful = cleanedFilename.length >= 4 && !/^(?:image|photo|picture)$/i.test(cleanedFilename);
  const title = filenameLooksUseful
    ? limitAtWord(cleanedFilename, TITLE_LIMIT)
    : limitAtWord(`${category} Portfolio Photo`, TITLE_LIMIT);
  return {
    title,
    altText: limitAtWord(`${category} photography by Doll Pictures.`, ALT_TEXT_LIMIT),
  };
}
