import type { ReactNode } from 'react'
import { Link } from 'react-router'

/**
 * Public legal documents (production pass, 2026-08-11). Deliberately
 * short, plain-language, and honest about what the product does — nothing
 * here claims more than the app implements. Both documents are flagged in
 * open-items for counsel review before launch marketing spends money;
 * the contact mailbox is flagged there too.
 */

function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-medium hover:underline">
            ← Malaky
          </Link>
          <Link to="/" className="flex items-center">
            <img src="/brand/malaky-logo-charcoal.png" alt="Malaky" className="h-7 w-auto dark:hidden" />
            <img src="/brand/malaky-logo-white.png" alt="" aria-hidden className="hidden h-7 w-auto dark:block" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-8 flex flex-col gap-6 text-sm/relaxed [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:max-w-[70ch] [&_ul]:flex [&_ul]:max-w-[70ch] [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  )
}

export function PrivacyScreen() {
  return (
    <LegalPage title="Privacy Policy" updated="August 11, 2026">
      <p>
        Malaky is operated by Alpha Pro MENA (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy
        explains what we collect when you use Malaky and what we do with it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account information: your name, email address, and organization details.</li>
        <li>
          Content you provide: your brand information, sources, drafts, and the decisions you make
          on them.
        </li>
        <li>
          Connection data: when you connect a social account, the tokens and metadata needed to
          publish on your behalf.
        </li>
        <li>Basic usage and diagnostic information needed to run and secure the service.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        To provide Malaky: preparing your marketing, holding it for your approval, publishing what
        you approve, and reporting the results back to you. Your content belongs to your
        organization. It is never shared with other workspaces, sold, or used to train models for
        anyone else.
      </p>
      <h2>Where it lives</h2>
      <p>
        Your data is stored with our cloud infrastructure providers and retained while your
        account is active. When you delete your account, we delete your organization&rsquo;s
        content within a reasonable period, except where the law requires retention.
      </p>
      <h2>Your choices</h2>
      <p>
        You can access, correct, export, or delete your organization&rsquo;s information from
        inside the product or by contacting us. Disconnecting a channel revokes Malaky&rsquo;s
        access to it.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy: <a className="underline" href="mailto:support@malaky.ai">support@malaky.ai</a>.
      </p>
    </LegalPage>
  )
}

export function TermsScreen() {
  return (
    <LegalPage title="Terms of Service" updated="August 11, 2026">
      <p>
        These terms govern your use of Malaky, a service of Alpha Pro MENA. By creating an
        account you agree to them.
      </p>
      <h2>What Malaky does</h2>
      <p>
        Malaky prepares marketing content for your organization and holds it for review. Nothing
        is published to a connected channel without an approval from a member of your workspace
        with the right to give it.
      </p>
      <h2>Your content and responsibilities</h2>
      <p>
        You keep ownership of the content you provide and the content you approve. You are
        responsible for what you approve and publish — including its accuracy and its compliance
        with the rules of the channels it is published to. Don&rsquo;t use Malaky to publish
        unlawful, misleading, or infringing material.
      </p>
      <h2>Accounts and access</h2>
      <p>
        Keep your credentials secure and your account information accurate. You may cancel at any
        time; you keep access until the end of any period you have already paid for.
      </p>
      <h2>Service and liability</h2>
      <p>
        Malaky is provided &ldquo;as is&rdquo;. We work to keep it available and correct, but we
        do not guarantee uninterrupted service, and to the extent permitted by law our liability
        is limited to the amounts you have paid us in the twelve months before a claim.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these terms; material changes will be announced in the product or by email
        before they take effect.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: <a className="underline" href="mailto:support@malaky.ai">support@malaky.ai</a>.
      </p>
    </LegalPage>
  )
}
