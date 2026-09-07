import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router-dom';
import { ServicePreviewImage } from '../../../src/components/ServicePreviewImage';
import { SiteDataProvider, useSiteData } from '../../../src/contexts/SiteDataContext';
import '../../../src/index.css';
function Harness() {
  const defaults = useSiteData();
  const [src, setSrc] = useState('/images/services/newborn.jpg');
  const [category, setCategory] = useState('wedding');
  return <><button onClick={() => setSrc('/broken-image.jpg')}>Fail image</button><button onClick={() => setSrc('/og-share.jpg')}>Repair image</button><button onClick={() => { setSrc(''); setCategory('newborn'); }}>Use category photo</button>
    <SiteDataProvider key={category} initialLoaded={['siteContent', 'categories']} initialData={{ ...defaults, loading: false, galleryImages: [{ src: '/og-share.jpg', alt: 'Newborn portrait', webpSrcSet: '/og-share.jpg 400w, /og-share.jpg 800w', categorySlugs: [category] }], featuredWork: [] }}>
      <Preview src={src} category={category} />
    </SiteDataProvider></>;
}
function Preview({ src, category }: { src: string; category: string }) {
  // Remount the provider only when fixture category data changes.
  return <Link to="/newborn-baby-photography-erode" data-testid="card" style={{ display: 'block', height: 320, width: 288 }}><ServicePreviewImage servicePath="/newborn-baby-photography-erode" label="Newborn" src={src} alt="" className="h-full w-full object-cover" /><span>Newborn service</span><span hidden>{category}</span></Link>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Harness /></BrowserRouter>);
