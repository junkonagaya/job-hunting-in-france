export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy for JobHunt France</h1>
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Effective Date:</strong> March 29, 2026 | <strong>Last Updated:</strong> March 29, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            JobHunt France ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension and web dashboard collect, use, and safeguard your personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">Account Information</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Email address</strong>: Used for account creation and authentication</li>
            <li><strong>Password</strong>: Stored securely using industry-standard encryption</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Job Data</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Job titles, company names, and locations</strong>: Information you choose to save from job listing websites</li>
            <li><strong>Job descriptions</strong>: Limited to first 5,000 characters of content you save</li>
            <li><strong>Source URLs</strong>: Links to the original job postings you saved</li>
            <li><strong>Save timestamps</strong>: When you saved each job listing</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Usage Information</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Authentication tokens</strong>: Securely stored to keep you logged in</li>
            <li><strong>Extension interactions</strong>: Which websites you use the extension on (LinkedIn, Welcome to the Jungle)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">We use your information to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Provide and maintain the JobHunt France service</li>
            <li>Allow you to save and organize job listings</li>
            <li>Authenticate your account securely</li>
            <li>Improve our extension and dashboard features</li>
            <li>Respond to your support requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Store Your Information</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>All data is stored securely on Supabase infrastructure</li>
            <li>Passwords are hashed and never stored in plain text</li>
            <li>Authentication uses secure token-based sessions</li>
            <li>Data is transmitted over encrypted HTTPS connections</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">We use the following third-party services:</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">Supabase</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our backend infrastructure provider that stores your account and job data. Supabase complies with GDPR and industry-standard security practices.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">LinkedIn and Welcome to the Jungle</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our extension operates on these job board websites to extract job information you choose to save. We do not share any data with these platforms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Your account and saved jobs are retained until you delete them</li>
            <li>You can delete individual job listings at any time</li>
            <li>You can delete your entire account and all associated data at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">You have the right to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data</li>
            <li>Export your job data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            To exercise these rights, please contact us at <a href="mailto:junkonagaya@yahoo.com" className="text-primary hover:underline">junkonagaya@yahoo.com</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">We do not:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Sell your personal information to third parties</li>
            <li>Share your data with advertisers</li>
            <li>Use your data for purposes unrelated to the core job-tracking functionality</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security audits</li>
            <li>Limited access to personal data</li>
            <li>Secure authentication mechanisms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            JobHunt France is not intended for users under 16 years of age. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p className="text-muted-foreground">
            <strong>Email:</strong> <a href="mailto:junkonagaya@yahoo.com" className="text-primary hover:underline">junkonagaya@yahoo.com</a><br />
            <strong>Website:</strong> <a href="https://job-hunting-in-france.lovable.app" className="text-primary hover:underline">https://job-hunting-in-france.lovable.app</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Compliance</h2>
          <p className="text-muted-foreground leading-relaxed">This Privacy Policy complies with:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>General Data Protection Regulation (GDPR)</li>
            <li>California Consumer Privacy Act (CCPA)</li>
            <li>Chrome Web Store Developer Program Policies</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
