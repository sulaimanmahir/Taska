import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import SettingsAuditLogPanel from '../components/SettingsAuditLogPanel';
import SettingsBranchesPanel from '../components/SettingsBranchesPanel';
import SettingsModulesPanel from '../components/SettingsModulesPanel';
import SettingsTeamPanel from '../components/SettingsTeamPanel';
import { FinanceFormError } from '../components/FinanceFormFeedback';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageHeader, ResponsiveCardGrid, SectionShell } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  buildSettingsBusinessFields,
  buildSettingsMetrics,
  buildSettingsProfileFields,
  getSettingsTabContent,
  settingsTabs,
} from '../lib/settings';
import {
  buildBusinessSettingsDefaults,
  buildProfileSettingsDefaults,
  businessSettingsSchema,
  getSettingsSubmitError,
  profileSettingsSchema,
} from '../lib/settingsForms';
import { useAuthStore } from '../stores/authStore';

function ReadonlyField({ label, value, helper }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-900">{value || 'Not provided yet'}</p>
        {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      </div>
    </div>
  );
}

function SettingsField({ label, helper, error, children, required = false, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      {children}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function getSettingsInputClassName(hasError) {
  return `input ${hasError ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]' : ''}`.trim();
}

export default function Settings() {
  const {
    user,
    business,
    businesses,
    updateProfile,
    updateCurrentBusiness,
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileError, setProfileError] = useState('');
  const [businessError, setBusinessError] = useState('');
  const { toast, setToast, clearToast } = useToast();

  const linkedBusinesses = businesses?.length ?? 0;
  const metrics = buildSettingsMetrics({ user, business, linkedBusinesses });
  const profileFields = buildSettingsProfileFields(user);
  const businessFields = buildSettingsBusinessFields(business);
  const activeTabContent = getSettingsTabContent(activeTab, { linkedBusinesses });
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: {
      errors: profileErrors,
      isDirty: isProfileDirty,
      isSubmitting: isProfileSubmitting,
    },
  } = useForm({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: buildProfileSettingsDefaults(user),
  });
  const {
    register: registerBusiness,
    handleSubmit: handleBusinessSubmit,
    reset: resetBusiness,
    formState: {
      errors: businessErrors,
      isDirty: isBusinessDirty,
      isSubmitting: isBusinessSubmitting,
    },
  } = useForm({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: buildBusinessSettingsDefaults(business),
  });

  useEffect(() => {
    resetProfile(buildProfileSettingsDefaults(user));
  }, [resetProfile, user]);

  useEffect(() => {
    resetBusiness(buildBusinessSettingsDefaults(business));
  }, [business, resetBusiness]);

  const submitProfile = handleProfileSubmit(async (values) => {
    setProfileError('');
    clearToast();

    try {
      await updateProfile(values);
      setToast({
        tone: 'success',
        message: 'Profile details updated successfully.',
      });
    } catch (error) {
      const message = getSettingsSubmitError(error, 'We could not save your profile right now.');
      setProfileError(message);
      setToast({
        tone: 'error',
        message,
      });
    }
  });

  const submitBusiness = handleBusinessSubmit(async (values) => {
    setBusinessError('');
    clearToast();

    try {
      await updateCurrentBusiness(values);
      setToast({
        tone: 'success',
        message: 'Business settings updated successfully.',
      });
    } catch (error) {
      const message = getSettingsSubmitError(error, 'We could not save your business settings right now.');
      setBusinessError(message);
      setToast({
        tone: 'error',
        message,
      });
    }
  });

  return (
    <div className="space-y-5">
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        groupAriaLabel="Settings feedback"
      />
      <SectionShell>
        <PageHeader
          eyebrow="Workspace Control"
          title="Settings"
          description="Update your account identity, keep the active workspace profile current, and manage the team and branch structure behind this workspace."
          actions={(
            <>
            <Button as={Link} to="/business-select" variant="secondary">Switch workspace</Button>
            <Button as={Link} to="/businesses/new">Create another business</Button>
            </>
          )}
        />
      </SectionShell>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-3">
        {metrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <div className="flex flex-wrap gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm">
        {settingsTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader
              title="Account profile"
              subtitle="Update the identity attached to this Taska login"
            />
            <FinanceFormError message={profileError} />
            <form className="space-y-5" onSubmit={submitProfile} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <SettingsField
                  label="Full name"
                  helper="This name appears in workspace context, activity surfaces, and support records."
                  error={profileErrors.name?.message}
                  required
                >
                  <input
                    {...registerProfile('name')}
                    className={getSettingsInputClassName(Boolean(profileErrors.name))}
                    autoComplete="name"
                  />
                </SettingsField>

                <SettingsField
                  label="Email address"
                  helper="This remains your primary sign-in identity across linked businesses."
                  error={profileErrors.email?.message}
                  required
                >
                  <input
                    {...registerProfile('email')}
                    type="email"
                    className={getSettingsInputClassName(Boolean(profileErrors.email))}
                    autoComplete="email"
                  />
                </SettingsField>

                <SettingsField
                  label="Phone number"
                  helper="Optional, but useful for support and account recovery."
                  error={profileErrors.phone?.message}
                  className="md:col-span-2"
                >
                  <input
                    {...registerProfile('phone')}
                    type="tel"
                    className={getSettingsInputClassName(Boolean(profileErrors.phone))}
                    autoComplete="tel"
                  />
                </SettingsField>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Role assignment and workspace membership stay managed by business access controls.
                </p>
                <Button type="submit" disabled={!isProfileDirty || isProfileSubmitting}>
                  {isProfileSubmitting ? 'Saving profile...' : 'Save profile'}
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className={activeTabContent?.asideToneClassName}>
              <CardHeader
                title={activeTabContent?.asideTitle}
                subtitle={activeTabContent?.asideSubtitle}
              />
              <div className="space-y-3 text-sm text-violet-900">
                {activeTabContent?.asideParagraphs.map((paragraph, index) => (
                  <p key={paragraph} className={activeTabContent.asideParagraphToneClassNames[index]}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Live session snapshot"
                subtitle="What Taska is using right now for this authenticated session"
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                {profileFields.map((field) => (
                  <ReadonlyField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    helper={field.helper}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'business' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader
              title="Active business profile"
              subtitle="Keep the live workspace contact and location details current"
            />
            {business ? (
              <>
                <FinanceFormError message={businessError} />
                <form className="space-y-5" onSubmit={submitBusiness} noValidate>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-4 text-sm text-sky-950">
                    <p className="font-semibold">Business type stays locked here</p>
                    <p className="mt-1">
                      This workspace is configured as <span className="font-semibold">{business.business_type_label || business.business_type}</span>. Changing business type affects modules, reporting expectations, and AI context, so it needs a guided migration instead of an inline edit.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <SettingsField
                      label="Business name"
                      helper="This is the active tenant name shown across dashboards, invoices, and reports."
                      error={businessErrors.name?.message}
                      required
                    >
                      <input
                        {...registerBusiness('name')}
                        className={getSettingsInputClassName(Boolean(businessErrors.name))}
                        autoComplete="organization"
                      />
                    </SettingsField>

                    <SettingsField
                      label="Business email"
                      helper="Optional contact email for this workspace."
                      error={businessErrors.email?.message}
                    >
                      <input
                        {...registerBusiness('email')}
                        type="email"
                        className={getSettingsInputClassName(Boolean(businessErrors.email))}
                        autoComplete="email"
                      />
                    </SettingsField>

                    <SettingsField
                      label="Phone"
                      helper="Operational contact line for customers, vendors, and support."
                      error={businessErrors.phone?.message}
                    >
                      <input
                        {...registerBusiness('phone')}
                        type="tel"
                        className={getSettingsInputClassName(Boolean(businessErrors.phone))}
                        autoComplete="tel"
                      />
                    </SettingsField>

                    <SettingsField
                      label="City"
                      helper="Used in location summaries and multi-branch reporting context."
                      error={businessErrors.city?.message}
                    >
                      <input
                        {...registerBusiness('city')}
                        className={getSettingsInputClassName(Boolean(businessErrors.city))}
                        autoComplete="address-level2"
                      />
                    </SettingsField>

                    <SettingsField
                      label="State"
                      helper="Helps with region-aware reporting and support context."
                      error={businessErrors.state?.message}
                    >
                      <input
                        {...registerBusiness('state')}
                        className={getSettingsInputClassName(Boolean(businessErrors.state))}
                        autoComplete="address-level1"
                      />
                    </SettingsField>

                    <SettingsField
                      label="Country"
                      helper="Useful for compliance, support, and rollout context."
                      error={businessErrors.country?.message}
                    >
                      <input
                        {...registerBusiness('country')}
                        className={getSettingsInputClassName(Boolean(businessErrors.country))}
                        autoComplete="country-name"
                      />
                    </SettingsField>

                    <SettingsField
                      label="Address"
                      helper="Street address or main operating location for this workspace."
                      error={businessErrors.address?.message}
                      className="md:col-span-2"
                    >
                      <textarea
                        {...registerBusiness('address')}
                        className={getSettingsInputClassName(Boolean(businessErrors.address))}
                        rows={3}
                        autoComplete="street-address"
                      />
                    </SettingsField>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      These details update only the currently active workspace and preserve strict tenant isolation.
                    </p>
                    <Button type="submit" disabled={!isBusinessDirty || isBusinessSubmitting}>
                      {isBusinessSubmitting ? 'Saving business...' : 'Save business'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                <p className="font-semibold text-slate-900">No active business selected</p>
                <p className="text-sm text-slate-600">
                  Pick a workspace first so Taska knows which tenant profile to update.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button as={Link} to="/business-select" variant="secondary">Open business switcher</Button>
                  <Button as={Link} to="/businesses/new">Create another business</Button>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="border-sky-200 bg-sky-50/60">
              <CardHeader
                title={activeTabContent?.multiBusinessTitle}
                subtitle={activeTabContent?.multiBusinessSubtitle}
              />
              <p className="text-sm text-sky-900">
                {activeTabContent?.multiBusinessCopy}
              </p>
            </Card>

            <Card>
              <CardHeader
                title="Workspace snapshot"
                subtitle="Current business context feeding settings, reporting, and navigation"
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                {businessFields.map((field) => (
                  <div key={field.label} className={field.fullWidth ? 'md:col-span-2 xl:col-span-1' : ''}>
                    <ReadonlyField
                      label={field.label}
                      value={field.value}
                      helper={field.helper}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                title={activeTabContent?.actionsTitle}
                subtitle={activeTabContent?.actionsSubtitle}
              />
              <div className="flex flex-col gap-3">
                <Button as={Link} to="/business-select" variant="secondary" size="lg">Open business switcher</Button>
                <Button as={Link} to="/businesses/new" size="lg">Create another business</Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <SettingsTeamPanel content={activeTabContent} />
      ) : null}

      {activeTab === 'branches' ? (
        <SettingsBranchesPanel content={activeTabContent} />
      ) : null}

      {activeTab === 'modules' ? (
        <SettingsModulesPanel content={activeTabContent} />
      ) : null}

      {activeTab === 'activity' ? (
        <SettingsAuditLogPanel content={activeTabContent} />
      ) : null}
    </div>
  );
}
