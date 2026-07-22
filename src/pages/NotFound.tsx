import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/sections/Footer';
import { applyPageSeo } from '../lib/seo';

export function NotFound() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyPageSeo({
      path: pathname,
      title: 'Page Not Found — Doll Pictures',
      description:
        'This page could not be found. Return to Doll Pictures for cinematic wedding and portrait photography in Erode.',
      noindex: true,
      heading: 'Page not found',
      body: 'The page you are looking for does not exist or has been moved.',
    });
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative flex min-h-[70vh] items-center px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label mb-4">404</p>
          <h1 className="font-display text-5xl font-light leading-tight text-ink-50 md:text-7xl">
            Page not
            <span className="italic text-gradient-gold"> found.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink-200/70">
            The page you are looking for does not exist or has been moved.
            Head back home to explore our work.
          </p>
          <Link
            to="/"
            data-cursor="hover"
            className="btn-primary mt-10 inline-flex"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
