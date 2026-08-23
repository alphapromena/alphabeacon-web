import { Link } from 'react-router'
import { LEGAL, WE } from '@/features/marketing/concept/lib/legal'
import { TERMS_HREF } from '@/features/marketing/concept/site'
import { LegalPage, Tbc, type LegalSection } from './LegalPage'

/**
 * Privacy policy for the public website.
 *
 * Scope is deliberately narrow: this covers people who visit the website and
 * people who send a demo request. It says nothing about how a customer
 * deployment handles data, because that product is being built separately and
 * anything written here about it would be invented.
 *
 * Three rules held throughout:
 * - no named providers until one is actually connected and approved;
 * - no compliance claims, certifications or audit statements;
 * - no invented specifics — retention periods, response deadlines, security
 *   architecture, storage locations.
 */
const SECTIONS: LegalSection[] = [
  {
    id: 'scope',
    title: 'What this policy covers',
    body: (
      <>
        <p>
          This policy explains how {WE} handles personal information collected through this website,
          including the demo request form.
        </p>
        <p>
          It does not cover the Malaky product itself. How information is handled inside a customer
          deployment is governed by the written agreement with that customer, and is described in
          separate documentation rather than here.
        </p>
      </>
    ),
  },
  {
    id: 'information',
    title: 'Information we collect',
    body: (
      <>
        <p>
          <strong>Information you give us.</strong> If you send a demo request, the form may ask
          for:
        </p>
        <ul>
          <li>Your name</li>
          <li>Your work email address</li>
          <li>Your company</li>
          <li>Your company website</li>
          <li>Your role or title</li>
          <li>Your country or primary market</li>
          <li>The areas you would like Malaky to help with</li>
          <li>Anything else you choose to tell us in the optional notes field</li>
        </ul>
        <p>
          You choose what to send. If you would rather not complete the form, you can contact us
          directly using the details in <a href="#contact">Contacting us</a>.
        </p>
        <p>
          <strong>Information involved in delivering the website.</strong> Serving a website
          necessarily involves processing limited technical information required to deliver a page
          to your device. Where that happens it is limited to what is needed to operate the site.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: (
      <>
        <p>We use the information you send through the website to:</p>
        <ul>
          <li>Respond to your demo request</li>
          <li>Understand your business and what you are interested in</li>
          <li>Prepare a relevant demo and conversation</li>
          <li>Communicate with you about your request</li>
        </ul>
        <p>
          We do not sell personal information, and we do not use the details you send through this
          website to advertise to you elsewhere.
        </p>
      </>
    ),
  },
  {
    id: 'providers',
    title: 'Service providers',
    body: (
      <>
        <p>
          We may use service providers to operate the website and to respond to requests. When
          production providers are selected, this policy will be updated as required.
        </p>
        <p>
          We may also share information where we are required to do so by law, or where it is
          necessary to establish, exercise or defend legal claims.
        </p>
        <p>
          Where information is transferred between countries, we do so in accordance with applicable
          requirements.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <p>
        We retain personal information only for as long as reasonably necessary for the purposes
        described in this policy and as required by applicable law.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We take reasonable administrative, technical and organizational measures to protect personal
        information.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>
          Depending on where you are located and the law that applies to you, you may have rights in
          relation to your personal information, such as:
        </p>
        <ul>
          <li>Access to the information we hold about you</li>
          <li>Correction of information that is inaccurate or incomplete</li>
          <li>Deletion of information in certain circumstances</li>
          <li>Restriction of, or objection to, certain processing</li>
          <li>Withdrawal of consent, where our processing is based on your consent</li>
          <li>Other rights provided by the law that applies to you</li>
        </ul>
        <p>
          To make a request, contact us using the details in <a href="#contact">Contacting us</a>.
          We may need to verify your identity before we act on a request, and some rights are
          subject to conditions or exceptions under applicable law.
        </p>
        <p>
          {WE} handles personal information in accordance with applicable privacy and
          data-protection requirements.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    body: (
      <>
        <p>
          Technical storage may be used where it is necessary to operate the website and deliver
          what you have asked for.
        </p>
        <p>
          Analytics or similar technologies may be introduced in future. Where that happens, this
          policy — and any controls required for those technologies — will be updated before they
          are deployed.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        Malaky is a service for businesses. This website is not directed at children, and we do not
        knowingly collect personal information from them through it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy as the website and the business develop. The effective date at the
        top of this page shows when the current version took effect.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contacting us',
    body: (
      <>
        <p>For privacy questions or requests about this website, contact:</p>
        <ul>
          <li>
            <strong>Entity:</strong> <Tbc value={LEGAL.entity} label="legal entity name" />
          </li>
          <li>
            <strong>Registered address:</strong>{' '}
            <Tbc value={LEGAL.address} label="registered address" />
          </li>
          <li>
            <strong>Privacy contact:</strong>{' '}
            <Tbc value={LEGAL.privacyEmail} label="privacy contact email" />
          </li>
        </ul>
        <p>
          You can also read our <Link to={TERMS_HREF}>Website Terms of Use</Link>.
        </p>
      </>
    ),
  },
]

export function PrivacyPolicy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      summary={
        <p>
          This policy covers the Malaky public website — what we collect when you visit it or send a
          demo request, what we do with it, and the choices you have. It is written in plain English
          on purpose.
        </p>
      }
      sections={SECTIONS}
      related={{ label: 'Website Terms of Use', href: TERMS_HREF }}
    />
  )
}
