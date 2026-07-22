import { Link } from 'react-router-dom';
import { LegalPage } from './LegalPage';

export function Terms() {
  return (
    <LegalPage path="/terms">
      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Agreement
        </h2>
        <p className="mt-3">
          By using the Doll Pictures website (
          <a href="https://dollpictures.in" className="text-gold-400 hover:text-gold-300">
            dollpictures.in
          </a>
          ) or engaging our photography services, you agree to these Terms of
          Service. If you do not agree, please do not use the site or book
          services.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Services
        </h2>
        <p className="mt-3">
          Doll Pictures by Ramya Vignesh provides wedding, portrait, commercial, and related
          photography services based in Erode, Tamil Nadu. Package details,
          pricing, and deliverables are described on our site or confirmed in
          writing for your booking. A separate booking agreement or invoice may
          apply for specific shoots.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Website use
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Use the site only for lawful purposes</li>
          <li>
            Do not attempt to disrupt, scrape abusively, or misuse forms or
            admin areas
          </li>
          <li>
            Content on this site (text, images, branding) is owned by Doll
            Pictures by Ramya Vignesh or its licensors and may not be copied
            for commercial use without permission
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Bookings and payments
        </h2>
        <p className="mt-3">
          Enquiries submitted through the site are requests, not confirmed
          bookings, until we accept them and you complete any required deposit
          or agreement. Cancellation, rescheduling, and payment terms will be
          stated in your booking confirmation or contract.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Image rights
        </h2>
        <p className="mt-3">
          Unless otherwise agreed in writing, Doll Pictures by Ramya Vignesh retains copyright in
          photographs we create. Clients receive usage rights as described in
          their package or contract (for example personal use and sharing). We
          may use selected images for portfolio and marketing unless you request
          otherwise in writing before or at the time of booking.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Disclaimer
        </h2>
        <p className="mt-3">
          The website is provided &quot;as is.&quot; We aim for accuracy but do
          not guarantee uninterrupted access or that all content is error-free.
          To the fullest extent permitted by law, we are not liable for
          indirect or consequential losses arising from use of the site.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Privacy
        </h2>
        <p className="mt-3">
          How we handle personal information is described in our{' '}
          <Link to="/privacy" className="text-gold-400 hover:text-gold-300">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Governing law
        </h2>
        <p className="mt-3">
          These terms are governed by the laws of India. Courts in Tamil Nadu
          shall have jurisdiction, subject to applicable law.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Changes
        </h2>
        <p className="mt-3">
          We may update these terms periodically. The &quot;Last updated&quot;
          date on this page reflects the latest revision. Continued use of the
          site after changes constitutes acceptance of the updated terms.
        </p>
      </section>
    </LegalPage>
  );
}
