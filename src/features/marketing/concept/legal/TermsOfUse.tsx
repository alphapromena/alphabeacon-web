import { Link } from 'react-router'
import { LEGAL, WE } from '@/features/marketing/concept/lib/legal'
import { PRIVACY_HREF } from '@/features/marketing/concept/site'
import { LegalPage, Tbc, type LegalSection } from './LegalPage'

/**
 * Terms of use for the public website.
 *
 * These govern visiting the website. They are not customer terms: no
 * subscription, no service levels, no data processing commitments. Where the
 * website shows a price or a demonstration, these terms say plainly that the
 * commercial relationship is created by a separate written agreement and that
 * the demonstrations illustrate intended behaviour.
 *
 * Governing law is not chosen here. If the jurisdiction is unset in
 * concept/lib/legal.ts the section says so rather than naming a country
 * nobody has agreed to.
 */
const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of these terms',
    body: (
      <>
        <p>
          These terms apply to your use of the Malaky website. By using the website, you agree to
          them. If you do not agree, please do not use the website.
        </p>
        <p>
          These terms cover the website only. They do not create a subscription to any Malaky
          product — see <a href="#commercial">Commercial agreements</a>.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'Using the website',
    body: (
      <p>
        You may use the website to learn about {WE}, to read what we publish, and to contact us. You
        are responsible for the accuracy of anything you send us through it.
      </p>
    ),
  },
  {
    id: 'demonstrations',
    title: 'Concept and product demonstrations',
    body: (
      <>
        <p>
          Parts of this website demonstrate how Malaky is intended to work. Interactive previews,
          sample campaigns, calendars, approval flows and other examples illustrate intended product
          behaviour and do not necessarily represent production functionality.
        </p>
        <p>
          Examples shown may use illustrative company and campaign context rather than live data,
          and are labelled on the page where that is the case. Product behaviour, scope and
          availability may change.
        </p>
      </>
    ),
  },
  {
    id: 'demo-requests',
    title: 'Demo requests',
    body: (
      <>
        <p>Sending a demo request through this website:</p>
        <ul>
          <li>does not create an account</li>
          <li>does not create a customer relationship</li>
          <li>does not create a binding product subscription</li>
          <li>does not guarantee that we will accept you as a customer</li>
        </ul>
        <p>
          We may decline or not respond to a request. How we handle the information you send is
          described in our <Link to={PRIVACY_HREF}>Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'commercial',
    title: 'Commercial agreements',
    body: (
      <>
        <p>
          Any Malaky subscription or deployment will be governed by a separate written customer
          agreement or order form between you and {WE}. Nothing on this website forms part of that
          agreement unless it is incorporated into it.
        </p>
        <p>
          Pricing shown on this website is informational, is subject to the commercial scope agreed
          with you, and may change.
        </p>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: (
      <>
        <p>
          The design, text, graphics, software demonstrations and other materials owned by {WE} on
          this website are protected by intellectual property rights and remain ours.
        </p>
        <p>
          Company names, logos, trademarks and campaign material belonging to other organisations —
          including the real-company examples shown on this website with brand permission — remain
          the property of their respective owners. We claim no rights in them.
        </p>
        <p>
          You may not copy, reproduce or reuse material from this website except as permitted by law
          or with our written permission.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>access any part of the website you are not authorised to access</li>
          <li>disrupt or interfere with the website or its availability</li>
          <li>introduce malicious code</li>
          <li>attempt to bypass or test security measures</li>
          <li>
            use automated means to access or collect content from the website where doing so is
            unlawful or not authorised
          </li>
          <li>misuse intellectual property published on the website</li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party services and links',
    body: (
      <p>
        The website may link to or rely on services operated by others. We do not control those
        services and are not responsible for their content or practices. Their own terms and
        policies apply when you use them.
      </p>
    ),
  },
  {
    id: 'no-warranty',
    title: 'No warranty regarding previews',
    body: (
      <p>
        The website and the previews on it are provided as they are, for information. We do not
        warrant that the website will be uninterrupted or error-free, or that a preview reflects the
        behaviour of a production deployment. Preview functionality is illustrative and may change
        or be withdrawn.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <p>
        To the extent permitted by applicable law, {WE} is not liable for indirect or consequential
        loss, or for loss of profit, revenue, data or business, arising from your use of this
        website. Nothing in these terms excludes or limits liability that cannot be excluded or
        limited under applicable law.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the website and the business develop. The effective date at the
        top of this page shows when the current version took effect.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: (
      <>
        <p>
          These terms are governed by the law of{' '}
          <Tbc value={LEGAL.jurisdiction} label="governing jurisdiction" />, and the courts of that
          jurisdiction have exclusive jurisdiction over disputes relating to them, except where
          applicable law gives you the right to bring proceedings elsewhere.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contacting us',
    body: (
      <>
        <p>For questions about these terms, contact:</p>
        <ul>
          <li>
            <strong>Entity:</strong> <Tbc value={LEGAL.entity} label="legal entity name" />
          </li>
          <li>
            <strong>Registered address:</strong>{' '}
            <Tbc value={LEGAL.address} label="registered address" />
          </li>
          <li>
            <strong>Legal contact:</strong>{' '}
            <Tbc value={LEGAL.legalEmail} label="legal contact email" />
          </li>
        </ul>
      </>
    ),
  },
]

export function TermsOfUse() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Website Terms of Use"
      summary={
        <p>
          These terms cover using the Malaky website — including what the demonstrations on it do
          and do not represent, and what sending a demo request does and does not create.
        </p>
      }
      sections={SECTIONS}
      related={{ label: 'Privacy Policy', href: PRIVACY_HREF }}
    />
  )
}
