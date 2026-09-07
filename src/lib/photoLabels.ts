type PhotoLabelInput = {
  title?: string;
  altText?: string;
  categoryIds?: Array<{ name: string; slug: string } | string>;
};

export function isCameraFilename(value: string): boolean {
  return /^(?:_?(?:DSC[NF]?|IMG|PXL|DSCF|DSCN|SAM|DCIM|PIC|PHOTO|IMAGE)[_ -]?\d[\d_. -]*|[AP]\d{6,})(?:\.(?:jpe?g|png|webp|avif|heic|tiff?|cr2|cr3|nef|arw|dng))?$/i.test(value.trim());
}

export function photoLabels(photo: PhotoLabelInput, categoryName?: string) {
  const category = photo.categoryIds?.find((item): item is { name: string; slug: string } => typeof item === 'object' && item !== null);
  const name = (category?.name || categoryName)?.trim();
  const fallback = name && name.toLowerCase() !== 'photography'
    ? `${name} photography` : 'Photography by Doll Pictures';
  const authored = (value?: string) => value?.trim() && !isCameraFilename(value) ? value.trim() : undefined;
  const title = authored(photo.title) || fallback;
  return { title, alt: authored(photo.altText) || title };
}
