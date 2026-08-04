import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { AuthShell, BrandIntro, BrandTopbar, ContentGrid, FormPanel, PageHeader, PublicInsetPanel } from '../components/PageShell';
import api from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailFromQuery = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginHref = useMemo(() => {
    const params = new URLSearchParams();

    if (email) {
      params.set('email', email);
    }

    const query = params.toString();

    return query ? `/login?${query}` : '/login';
  }, [email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setStatus(data.message ?? 'Password reset successfully. You can now sign in with your new password.');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors).flat()[0];
        setError(firstError || 'Unable to reset your password right now.');
      } else {
        setError(err.response?.data?.message || 'Unable to reset your password right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="ambient-orb left-[9%] top-10 h-56 w-56 bg-violet-500/18" />
      <div className="ambient-orb alt bottom-8 right-[10%] h-72 w-72 bg-cyan-400/12" />

      <div className="page-shell page-shell-auth page-stack">
        <BrandTopbar
          className="mb-5"
          brand={(
            <BrandIntro contentClassName="mt-4">
              <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
                Secure your account with a new password, then head straight back into your active Taska workspace.
              </p>
            </BrandIntro>
          )}
          actions={<ThemeToggle />}
        />

        <ContentGrid columns="split" className="items-start gap-6">
          <section className="public-card-strong rounded-[1.8rem] p-6 sm:p-7 lg:p-8">
            <PageHeader
              eyebrow="Choose a new password"
              title="Finish your account recovery"
              description="Use a strong password you have not used elsewhere so your business data, branches, and reports stay protected."
            />

            <div className="mt-6 space-y-4">
              <PublicInsetPanel className="rounded-[1.2rem] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Reset link status</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {token
                    ? 'Your reset token is present, so you can complete the password update below.'
                    : 'This page needs a valid reset link from your email before the password can be changed.'}
                </p>
              </PublicInsetPanel>
              <PublicInsetPanel className="rounded-[1.2rem] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Recommended password</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  Choose at least 8 characters and avoid reusing an old password from another service.
                </p>
              </PublicInsetPanel>
            </div>
          </section>

          <FormPanel as="form" onSubmit={handleSubmit} className="public-card mx-auto w-full max-w-xl rounded-[1.6rem] p-6 sm:p-7">
            <PageHeader
              eyebrow="Reset password"
              title="Create your new password"
              description="Confirm the email on the reset link, then save a new password to continue."
              className="mb-6"
            />

            {!token ? (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This reset link is incomplete. Request a fresh password reset email to continue.
              </div>
            ) : null}

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

            <div className="space-y-4">
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

              <label className="block">
                <span className="input-label">New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  className="input"
                  minLength={8}
                  required
                />
              </label>

              <label className="block">
                <span className="input-label">Confirm new password</span>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  placeholder="Re-enter your password"
                  className="input"
                  minLength={8}
                  required
                />
              </label>
            </div>

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting || !token} className="mt-6">
              {isSubmitting ? 'Saving new password...' : 'Reset password'}
            </Button>

            <div className="mt-5 flex flex-col gap-3 text-sm">
              <Link to={loginHref} className="font-semibold text-violet-600 hover:text-violet-700">
                Return to sign in
              </Link>
              <Link to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password'} className="text-[var(--color-text-muted)] hover:text-violet-600">
                Request a fresh reset link
              </Link>
            </div>
          </FormPanel>
        </ContentGrid>
      </div>
    </AuthShell>
  );
}
