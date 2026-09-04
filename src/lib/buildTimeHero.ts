export function dismissBuildTimeHero(targetDocument: Document = document) {
  targetDocument.getElementById('home-hero-poster')?.remove();
  targetDocument.getElementById('home-hero-poster-style')?.remove();
  targetDocument
    .querySelectorAll('link[data-home-hero-source]')
    .forEach((link) => link.remove());
}
