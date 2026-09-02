import type { ImgHTMLAttributes } from 'react';
import {
  isTransformableMediaUrl,
  mediaSrcSet,
  mediaUrl,
} from '../lib/images';

export type ResponsiveImageProps = {
  src: string;
  alt: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
  sizes?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding'];
  fetchPriority?: ImgHTMLAttributes<HTMLImageElement>['fetchPriority'];
  style?: ImgHTMLAttributes<HTMLImageElement>['style'];
  onLoad?: ImgHTMLAttributes<HTMLImageElement>['onLoad'];
  onError?: ImgHTMLAttributes<HTMLImageElement>['onError'];
};

export function ResponsiveImage({
  src,
  alt,
  avifSrcSet,
  webpSrcSet,
  sizes = '100vw',
  className,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  style,
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const responsiveMedia =
    !avifSrcSet && !webpSrcSet && isTransformableMediaUrl(src);
  const resolvedWebpSrcSet = responsiveMedia
    ? mediaSrcSet(src, [320, 480, 640, 720, 960, 1200, 1600], 'webp')
    : webpSrcSet;
  const resolvedSrc = responsiveMedia
    ? mediaUrl(src, Math.min(Math.max(width ?? 1200, 480), 1600))
    : src;
  const img = (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={avifSrcSet || resolvedWebpSrcSet ? sizes : undefined}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
    />
  );

  if (!avifSrcSet && !resolvedWebpSrcSet) {
    return img;
  }

  return (
    <picture className="contents">
      {avifSrcSet ? (
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      ) : null}
      {resolvedWebpSrcSet ? (
        <source type="image/webp" srcSet={resolvedWebpSrcSet} sizes={sizes} />
      ) : null}
      {img}
    </picture>
  );
}
