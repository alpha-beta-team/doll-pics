import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router-dom';
import { SiteDataProvider, useSiteData } from '../../../src/contexts/SiteDataContext';

history.replaceState({}, '', new URLSearchParams(location.search).get('route') || '/');

export function Probe() {
  const data = useSiteData();
  return <><nav>{['/', '/about', '/stories', '/contact', '/packages'].map(path => <Link key={path} to={path}>{path}</Link>)}</nav><output data-testid="site-data">{JSON.stringify(data)}</output></>;
}
export function Harness() {
  const [mounted, setMounted] = useState(true);
  return <BrowserRouter><button onClick={() => setMounted(value => !value)}>Toggle provider</button>{mounted && <SiteDataProvider><Probe /></SiteDataProvider>}</BrowserRouter>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Harness /></StrictMode>);
