import type { ImgHTMLAttributes } from 'react';

export type ResponsiveImageProps = {
  src: string;
  alt: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
  sizes?: string;
  className?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding'];
  fetchPriority?: ImgHTMLAttributes<HTMLImageElement>['fetchPriority'];
  style?: ImgHTMLAttributes<HTMLImageElement>['style'];
};

export function ResponsiveImage({
  src,
  alt,
  avifSrcSet,
  webpSrcSet,
  sizes = '100vw',
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  style,
}: ResponsiveImageProps) {
  const img = (
    <img
      src={src}
      alt={alt}
      sizes={avifSrcSet || webpSrcSet ? sizes : undefined}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      style={style}
    />
  );

  if (!avifSrcSet && !webpSrcSet) {
    return img;
  }

  return (
    <picture className="contents">
      {avifSrcSet ? (
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      ) : null}
      {webpSrcSet ? (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      ) : null}
      {img}
    </picture>
  );
}
