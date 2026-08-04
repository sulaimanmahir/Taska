import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { BrandIntro, BrandTopbar, PublicCard, PublicFeaturePanel, PublicInsetPanel, PublicShell, PublicStage } from '../components/PageShell';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 md:flex-row md:items-center md:justify-between">
      <p>{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start text-rose-700 hover:bg-rose-100"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}

export default function Pricing() {
  const { subscription } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { toast, setToast, clearToast } = useToast();

  const plansQuery = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const response = await api.get('/billing/plans');
      return response.data?.data ?? [];
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, cycle }) => api.post('/billing/subscribe', {
      plan_id: planId,
      billing_cycle: cycle,
    }),
    onSuccess: (response) => {
      if (response.data?.success) {
        window.location.reload();
        return;
      }

      setToast({
        tone: 'success',
        message: 'Subscription request submitted.',
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not start that subscription right now.'),
      });
    },
  });

  const handleSubscribe = async (planId) => {
    clearToast();
    await subscribeMutation.mutateAsync({
      planId,
      cycle: billingCycle,
    });
  };

  const formatPrice = (price) => formatCurrencyNGN(price);
  const plans = plansQuery.data || [];

  if (plansQuery.isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <PublicCard className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-brand)]" />
          Loading subscription plans...
        </PublicCard>
      </div>
    );
  }

  return (
    <PublicShell className="py-6 lg:py-8">
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        groupAriaLabel="Pricing feedback"
      />
      <div className="ambient-orb left-[8%] top-10 h-56 w-56 bg-violet-500/20" />
      <div className="ambient-orb alt bottom-12 right-[8%] h-72 w-72 bg-sky-400/12" />

      <PublicStage>
        <PublicFeaturePanel>
          <BrandTopbar
            className="gap-6"
            brand={(
              <BrandIntro className="max-w-3xl">
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Every Business Starts Free
                </div>
                <h1 className="mt-4 text-[clamp(2.05rem,1.05vw+1.55rem,2.65rem)] font-extrabold text-[var(--color-text)]">Grow at the pace of your business</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                  Start with a clean free setup, then unlock more staff capacity, AI depth, and operational control when your business is ready.
                </p>
              </BrandIntro>
            )}
            actions={(
              <>
                <ThemeToggle />
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="md"
                >
                  Start free
                </Button>
              </>
            )}
          />

          <PublicInsetPanel className="mt-7 rounded-[1.3rem] p-2.5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => setBillingCycle('monthly')}
                variant={billingCycle === 'monthly' ? 'secondary' : 'ghost'}
                className={`px-5 ${
                  billingCycle === 'monthly'
                    ? 'text-violet-700 shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                Monthly
              </Button>
              <Button
                onClick={() => setBillingCycle('yearly')}
                variant={billingCycle === 'yearly' ? 'secondary' : 'ghost'}
                className={`px-5 ${
                  billingCycle === 'yearly'
                    ? 'text-violet-700 shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                Yearly <span className="ml-2 text-xs font-bold text-emerald-600">Save 20%</span>
              </Button>
            </div>
          </PublicInsetPanel>

          <QueryErrorPanel
            message={plansQuery.isError ? getErrorMessage(plansQuery.error, 'We could not load subscription plans right now. Please try again.') : ''}
            onRetry={() => {
              void plansQuery.refetch();
            }}
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
              const currentPlan = subscription?.plan?.slug === plan.slug;
              const isFree = plan.slug === 'free';
              const isSubmitting = subscribeMutation.isPending && subscribeMutation.variables?.planId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-[1.4rem] border p-5 transition-all duration-300 ${
                    plan.is_featured
                      ? 'border-violet-300 bg-violet-50 shadow-[0_16px_34px_rgba(124,58,237,0.12)]'
                      : 'public-card'
                  }`}
                >
                  {plan.is_featured ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-brand)] px-4 py-1 text-xs font-bold text-white shadow-md">
                      Most Popular
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-[var(--color-text)]">{plan.name}</h3>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">{plan.description}</p>

                    <div className="mt-6">
                      <span className="text-4xl font-black text-[var(--color-text)]">
                        {isFree ? 'Free' : formatPrice(price)}
                      </span>
                      {!isFree ? (
                        <span className="text-[var(--color-text-muted)]">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      ) : null}
                    </div>

                    <Button
                      onClick={() => {
                        void handleSubscribe(plan.id);
                      }}
                      disabled={isSubmitting || currentPlan || isFree}
                      fullWidth
                      size="lg"
                      variant={plan.is_featured ? 'primary' : 'secondary'}
                      className={`mt-6 ${
                        currentPlan
                          ? 'bg-slate-100 text-slate-400 hover:bg-slate-100'
                          : plan.is_featured
                            ? ''
                            : 'bg-[var(--color-bg-subtle)] text-[var(--color-text)] hover:bg-[var(--panel-strong)]'
                      }`}
                    >
                      {isSubmitting ? 'Processing...' : currentPlan ? 'Current Plan' : 'Get Started'}
                    </Button>

                    <div className="mt-6 space-y-3">
                      {plan.features?.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                            feature.value === 'false'
                              ? 'bg-slate-100 text-slate-300'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {feature.value === 'false' ? 'x' : 'OK'}
                          </span>
                          <span className={feature.value === 'false' ? 'text-[var(--color-text-faint)]' : 'text-[var(--color-text-soft)]'}>
                            {feature.value_type === 'integer' ? `${feature.value} ` : ''}
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PublicFeaturePanel>
      </PublicStage>
    </PublicShell>
  );
}
