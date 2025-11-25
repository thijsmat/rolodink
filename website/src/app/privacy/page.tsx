import { SiteFooter } from "@/components/site-footer";
import { pageSEO } from "@/lib/seo";

export const metadata = {
  title: pageSEO.privacy.title,
  description: pageSEO.privacy.description,
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <main className="flex-1 pt-16">
        <section className="container py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-grey mb-16">
              Last updated: {lastUpdated}
            </p>

            <div
              className="prose prose-lg max-w-none 
                         text-grey 
                         prose-headings:font-playfair prose-headings:font-semibold prose-headings:text-azure 
                         prose-a:text-link-blue prose-a:underline-offset-4 hover:prose-a:text-link-blue/80
                         prose-strong:text-azure"
            >
              <h2>1. Introduction</h2>
              <p>
                Welcome to Rolodink. We respect your privacy and are committed to
                protecting your personal data. This Privacy Policy explains how we
                collect, use, store, and safeguard information when you use our
                website and LinkedIn CRM extension (collectively, the
                &ldquo;Service&rdquo;).
              </p>

              <h2>2. What Data Do We Collect?</h2>
              <p>We collect the following types of information:</p>
              <ul>
                <li>
                  <strong>Account Information:</strong> When you sign in, we store
                  the basic details required to create and authenticate your
                  account, such as your name, email address, profile picture, and
                  LinkedIn user identifier (when you choose LinkedIn Sign In).
                </li>
                <li>
                  <strong>User-Provided Content:</strong> Notes, tags, and other
                  information you manually add to LinkedIn profiles through the
                  Service. This information remains private to you.
                </li>
                <li>
                  <strong>Analytics Data:</strong> We use Plausible Analytics to
                  gather anonymized usage statistics to improve our website. This
                  occurs without cookies and without collecting personally
                  identifiable information.
                </li>
              </ul>

              <h3>LinkedIn Data Collection</h3>
              <p>
                <strong>Manual Data Entry Only</strong>
              </p>
              <p>
                Rolodink does not automatically scrape or collect LinkedIn profile
                data. Users manually choose which LinkedIn connections to add to
                their personal CRM. When you click &ldquo;Add to CRM&rdquo; on a
                LinkedIn profile, only the information you explicitly select is
                stored in your private, encrypted Rolodink account.
              </p>
              <p>
                <strong>Your Control</strong>
              </p>
              <ul>
                <li>You decide which contacts to save</li>
                <li>You choose what information to store</li>
                <li>You can delete any saved data at any time</li>
                <li>All data is private and visible only to you</li>
              </ul>
              <p>
                <strong>LinkedIn Sign In (OAuth)</strong>
              </p>
              <p>
                We use LinkedIn Sign In solely for authentication purposes. When
                you sign in with LinkedIn, we only access and store:
              </p>
              <ul>
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your profile picture</li>
                <li>A unique LinkedIn user identifier</li>
              </ul>
              <p>
                This information is used exclusively for account creation and
                authentication. We request your explicit consent before accessing
                any LinkedIn data through the OAuth flow.
              </p>
              <p>
                <strong>No Bulk Scraping</strong>
              </p>
              <ul>
                <li>We do not automatically collect LinkedIn profile data without your action</li>
                <li>We do not bulk scrape LinkedIn profiles</li>
                <li>We do not access LinkedIn data beyond what you manually save</li>
                <li>We do not share LinkedIn data with third parties</li>
              </ul>

              <h2>3. How We Use Your Data</h2>
              <p>
                Your data is used solely to deliver the Service. Notes and other
                user-provided data are visible only to you when you are signed in.
                We will never sell, rent, or share your data with third parties
                for marketing purposes.
              </p>
              <p>
                <strong>LinkedIn Authentication</strong>
              </p>
              <ul>
                <li>
                  LinkedIn Sign In data (name, email, photo) is used only for:
                  <ul>
                    <li>Creating and managing your Rolodink account</li>
                    <li>Personalizing your experience</li>
                    <li>Authenticating your identity</li>
                  </ul>
                </li>
                <li>We do not use this data for marketing or share it with third parties.</li>
              </ul>
              <p>
                <strong>Saved Contact Information</strong>
              </p>
              <ul>
                <li>
                  Contact notes and information you manually save are stored
                  encrypted in our secure Supabase database.
                </li>
                <li>This data is accessible only by you.</li>
                <li>It is not shared with LinkedIn or any third parties.</li>
                <li>
                  It is used solely for your personal CRM and networking
                  management.
                </li>
              </ul>

              <h2>4. Data Storage and Security</h2>
              <p>
                Your data is securely stored on servers located within the
                European Union. We implement appropriate technical and
                organizational measures to protect your information against loss,
                theft, and unauthorized access.
              </p>

              <h2>5. Your Rights</h2>
              <p>You have control over your personal data. You can:</p>
              <ul>
                <li>View and update your account information</li>
                <li>
                  Manage your notes and contact information directly within the
                  Service
                </li>
                <li>
                  Request a complete deletion of your account and associated data
                </li>
              </ul>
              <p>
                <strong>Right to Data Deletion</strong>
              </p>
              <p>You can delete any saved LinkedIn contact data at any time:</p>
              <ul>
                <li>Individual contacts can be removed from your CRM</li>
                <li>
                  Your entire account and all associated data can be deleted upon
                  request
                </li>
                <li>
                  If you sign in with LinkedIn, unlinking your LinkedIn account
                  will not affect your saved notes
                </li>
              </ul>
              <p>
                <strong>Data Portability</strong>
              </p>
              <p>
                You can export all saved contact notes and information at any time
                in standard formats (CSV, JSON).
              </p>

              <h2>6. Third-Party Services</h2>
              <h3>LinkedIn Integration</h3>
              <p>
                Rolodink integrates with LinkedIn for authentication purposes
                only. Our use of LinkedIn Sign In is governed by:
              </p>
              <ul>
                <li>
                  <a href="https://www.linkedin.com/legal/privacy-policy">
                    LinkedIn Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/legal/user-agreement">
                    LinkedIn User Agreement
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/legal/l/api-terms-of-use">
                    LinkedIn API Terms of Use
                  </a>
                </li>
              </ul>
              <p>
                We comply with all LinkedIn API Terms of Use and do not engage in
                unauthorized scraping or data collection.
              </p>
              <h3>Supabase (Data Storage)</h3>
              <ul>
                <li>Your data is stored using Supabase, a secure cloud database provider.</li>
                <li>All data is encrypted at rest and in transit.</li>
                <li>
                  <a href="https://supabase.com/privacy">Supabase Privacy Policy</a>
                </li>
                <li>Data is stored on EU servers and is GDPR compliant.</li>
              </ul>

              <h2>7. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will post
                the revised policy on this page and update the &ldquo;Last
                updated&rdquo; date at the top of the page.
              </p>

              <h2>8. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our data practices, contact us:</p>
              <ul>
                <li>
                  Email:{" "}
                  <a href="mailto:privacy@rolodink.app">privacy@rolodink.app</a>
                </li>
                <li>
                  Website:{" "}
                  <a href="https://rolodink.app" target="_blank" rel="noreferrer">
                    https://rolodink.app
                  </a>
                </li>
              </ul>
              <p>
                For data deletion requests or to exercise your privacy rights,
                email:{" "}
                <a href="mailto:privacy@rolodink.app">privacy@rolodink.app</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}