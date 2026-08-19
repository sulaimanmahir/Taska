import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { AuthShell, BrandIntro, BrandTopbar, ContentGrid, FormPanel, PageHeader, PublicInsetPanel } from '../components/PageShell';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const acceptInvite = useAuthStore((state) => state.acceptInvite);

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadInvite = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/team-invites/${token}`);
        if (isActive) {
          setInvite(data);
        }
      } catch (err) {
        if (isActive) {
          setLoadError(err.response?.data?.message || 'This invite link is no longer valid.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadInvite();

    return () => {
      isActive = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await acceptInvite(token, password, passwordConfirmation);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors).flat()[0];
        setError(firstError || 'Unable to accept this invite right now.');
      } else {
        setError(err.response?.data?.message || 'Unable to accept this invite right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(token) && !loading && !loadError;

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
                Accept your workspace invite and choose a password to get straight into Taska.
              </p>
            </BrandIntro>
          )}
        />

        <ContentGrid columns="split" className="items-start gap-6">
          <section className="public-card-strong rounded-[1.8rem] p-6 sm:p-7 lg:p-8">
            <PageHeader
              eyebrow="You're invited"
              title="Join your team's workspace"
              description="This invite is scoped to one business - once you accept it, you can switch to any other workspace you already belong to from inside Taska."
            />

            <div className="mt-6 space-y-4">
              <PublicInsetPanel className="rounded-[1.2rem] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Invite status</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {loading
                    ? 'Checking your invite link...'
                    : loadError
                      ? loadError
                      : invite
                        ? `${invite.name}, you're invited to join ${invite.business_name} as ${invite.role_name}.`
                        : 'This page needs a valid invite link from your email before you can continue.'}
                </p>
              </PublicInsetPanel>
            </div>
          </section>

          <FormPanel as="form" onSubmit={handleSubmit} className="public-card mx-auto w-full max-w-xl rounded-[1.6rem] p-6 sm:p-7">
            <PageHeader
              eyebrow="Accept invite"
              title="Choose your password"
              description="Set the password you'll use to sign in to this workspace from now on."
              className="mb-6"
            />

            {loadError ? (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {loadError}
              </div>
            ) : null}

            {error ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            <div className="space-y-4">
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
                  disabled={!canSubmit}
                />
              </label>

              <label className="block">
                <span className="input-label">Confirm password</span>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  placeholder="Re-enter your password"
                  className="input"
                  minLength={8}
                  required
                  disabled={!canSubmit}
                />
              </label>
            </div>

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting || !canSubmit} className="mt-6">
              {isSubmitting ? 'Joining workspace...' : 'Accept invite and continue'}
            </Button>
          </FormPanel>
        </ContentGrid>
      </div>
    </AuthShell>
  );
}
