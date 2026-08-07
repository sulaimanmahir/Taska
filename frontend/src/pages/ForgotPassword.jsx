import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { AuthShell, BrandIntro, BrandTopbar, ContentGrid, FormPanel, PageHeader, PublicInsetPanel } from '../components/PageShell';
import api from '../lib/api';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setStatus(data.message ?? 'If an account exists for that email, Taska has sent a password reset link.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send the reset link right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="ambient-orb left-[10%] top-10 h-52 w-52 bg-violet-500/18" />
      <div className="ambient-orb alt bottom-10 right-[10%] h-72 w-72 bg-sky-400/14" />

      <div className="page-shell page-shell-auth page-stack">
        <BrandTopbar
          className="mb-5"
          brand={(
            <BrandIntro contentClassName="mt-4">
              <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
                Recover access without losing your active businesses, branch context, or workspace history.
              </p>
            </BrandIntro>
          )}
        />

        <ContentGrid columns="split" className="items-start gap-6">
          <section className="public-card-strong rounded-[1.8rem] p-6 sm:p-7 lg:p-8">
            <PageHeader
              eyebrow="Account recovery"
              title="Reset your password with confidence"
              description="We will send a secure link to your email so you can choose a new password and get back into Taska quickly."
            />

            <div className="mt-6 space-y-4">
              <PublicInsetPanel className="rounded-[1.2rem] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  Open the email, follow the secure reset link, and create a fresh password for your workspace account.
                </p>
              </PublicInsetPanel>
              <PublicInsetPanel className="rounded-[1.2rem] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Good to know</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  For privacy, we show the same success response whether or not the email exists in the system.
                </p>
              </PublicInsetPanel>
            </div>
          </section>

          <FormPanel as="form" onSubmit={handleSubmit} className="public-card mx-auto w-full max-w-xl rounded-[1.6rem] p-6 sm:p-7">
            <PageHeader
              eyebrow="Send reset link"
              title="Forgot your password?"
              description="Enter the email address tied to your account and we’ll send a secure reset link."
              className="mb-6"
            />

            {status ? (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            ) : null}

            {error ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            <label className="block">
              <span className="input-label">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="input"
                required
              />
            </label>

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting} className="mt-6">
              {isSubmitting ? 'Sending reset link...' : 'Email reset link'}
            </Button>

            <div className="mt-5 flex flex-col gap-3 text-sm">
              <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">
                Back to sign in
              </Link>
              <Link to="/register" className="text-[var(--color-text-muted)] hover:text-violet-600">
                Need a new workspace instead? Create an account
              </Link>
            </div>
          </FormPanel>
        </ContentGrid>
      </div>
    </AuthShell>
  );
}
