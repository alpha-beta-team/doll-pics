import { LegalPage } from './LegalPage';

export function Privacy() {
  return (
    <LegalPage path="/privacy">
      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Who we are
        </h2>
        <p className="mt-3">
          This Privacy Policy describes how Doll Pictures by Ramya Vignesh
          (&quot;DOLL PICTURES&quot;, &quot;we&quot;, &quot;us&quot;) collects and
          uses information when you visit{' '}
          <a href="https://dollpictures.in" className="text-gold-400 hover:text-gold-300">
            dollpictures.in
          </a>
          , enquire about our photography services, or otherwise communicate with
          us. We are based in Erode, Tamil Nadu, India.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Information we collect
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-ink-100">Enquiry details</strong>{' '}
            — name, email, phone number, shoot type, and message when you submit
            our booking or contact forms.
          </li>
          <li>
            <strong className="font-medium text-ink-100">Communication data</strong>{' '}
            — information you share by email, phone, or WhatsApp.
          </li>
          <li>
            <strong className="font-medium text-ink-100">Technical data</strong>{' '}
            — standard server and analytics logs such as IP address, browser type,
            device, and pages visited, if analytics or hosting tools are enabled.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          How we use information
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Respond to enquiries and schedule consultations or shoots</li>
          <li>Provide photography and related services you request</li>
          <li>Improve our website and client experience</li>
          <li>Comply with legal obligations where applicable</li>
        </ul>
        <p className="mt-3">
          We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Sharing
        </h2>
        <p className="mt-3">
          We may share information with trusted service providers who help us
          operate the website, host data, or deliver communications (for example
          hosting, email, or form processing), only as needed to provide our
          services. We may also disclose information if required by law.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Cookies and similar technologies
        </h2>
        <p className="mt-3">
          Our site may use essential cookies or similar technologies required for
          basic functionality. If we use optional analytics cookies, they help us
          understand how the site is used. You can control cookies through your
          browser settings.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Data retention
        </h2>
        <p className="mt-3">
          We keep enquiry and client records only as long as needed for the
          purposes above, including ongoing projects, legitimate business needs,
          and legal requirements.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Your choices
        </h2>
        <p className="mt-3">
          You may request access to, correction of, or deletion of personal
          information we hold about you, subject to applicable law. Contact us
          using the details on this site.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-light text-ink-50">
          Updates
        </h2>
        <p className="mt-3">
          We may update this policy from time to time. The &quot;Last updated&quot;
          date at the top of this page will change when we do. Continued use of
          the site after changes means you accept the updated policy.
        </p>
      </section>
    </LegalPage>
  );
}
