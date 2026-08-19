import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import Button from './Button';
import Card, { CardHeader } from './Card';
import { FinanceFormError } from './FinanceFormFeedback';
import OpsMetricCard from './OpsMetricCard';
import { ResponsiveCardGrid } from './PageShell';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getSettingsSubmitError } from '../lib/settingsForms';
import {
  buildSettingsTeamCreateDefaults,
  buildSettingsTeamMemberDrafts,
  buildSettingsTeamMetrics,
  formatSettingsTeamModuleSummary,
  hasSettingsTeamDraftChanges,
  sortSettingsTeamMembers,
} from '../lib/settingsTeam';

const EMPTY_TEAM_STATE = {
  business: null,
  summary: {
    member_count: 0,
    active_member_count: 0,
    suspended_member_count: 0,
    branch_coverage_count: 0,
  },
  roles: [],
  branches: [],
  members: [],
};

function buildTeamState(payload = {}) {
  return {
    business: payload.business ?? null,
    summary: payload.summary ?? EMPTY_TEAM_STATE.summary,
    roles: payload.roles ?? [],
    branches: payload.branches ?? [],
    members: sortSettingsTeamMembers(payload.members ?? []),
  };
}

export default function SettingsTeamPanel({ content }) {
  const [teamState, setTeamState] = useState(EMPTY_TEAM_STATE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createForm, setCreateForm] = useState(buildSettingsTeamCreateDefaults());
  const [createError, setCreateError] = useState('');
  const [memberDrafts, setMemberDrafts] = useState({});
  const [creating, setCreating] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [resendingMemberId, setResendingMemberId] = useState(null);
  const { toast, setToast, clearToast } = useToast();

  const metrics = useMemo(
    () => buildSettingsTeamMetrics({
      summary: teamState.summary,
      roles: teamState.roles,
      branches: teamState.branches,
    }),
    [teamState.branches, teamState.roles, teamState.summary],
  );

  const roleMemberCounts = useMemo(() => {
    const counts = new Map();

    teamState.members.forEach((member) => {
      counts.set(member.role_slug, (counts.get(member.role_slug) ?? 0) + 1);
    });

    return counts;
  }, [teamState.members]);

  const syncTeamState = (payload, { resetCreateForm = false } = {}) => {
    const nextState = buildTeamState(payload);
    setTeamState(nextState);
    setMemberDrafts(buildSettingsTeamMemberDrafts(nextState.members));

    if (resetCreateForm) {
      setCreateForm(buildSettingsTeamCreateDefaults(nextState.roles, nextState.branches));
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadTeam = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const { data } = await api.get('/auth/team');

        if (!isActive) {
          return;
        }

        syncTeamState(data, { resetCreateForm: true });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setTeamState(EMPTY_TEAM_STATE);
        setMemberDrafts({});
        setLoadError(getSettingsSubmitError(error, 'We could not load team access controls right now.'));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadTeam();

    return () => {
      isActive = false;
    };
  }, []);

  const handleCreateChange = (key, value) => {
    setCreateForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleCreateMember = async (event) => {
    event.preventDefault();
    setCreateError('');
    clearToast();

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.role_slug || !createForm.branch_id) {
      setCreateError('Name, email, role, and branch are required before you can add a workspace member.');
      return;
    }

    setCreating(true);

    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        role_slug: createForm.role_slug,
        branch_id: Number(createForm.branch_id),
      };
      const { data } = await api.post('/auth/team', payload);
      syncTeamState(data, { resetCreateForm: true });
      setToast({
        tone: 'success',
        message: data.message || 'Workspace member added successfully.',
      });
    } catch (error) {
      const message = getSettingsSubmitError(error, 'We could not add that workspace member right now.');
      setCreateError(message);
      setToast({
        tone: 'error',
        message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDraftChange = (memberId, key, value) => {
    setMemberDrafts((current) => ({
      ...current,
      [memberId]: {
        ...current[memberId],
        [key]: value,
      },
    }));
  };

  const handleSaveMember = async (member) => {
    const draft = memberDrafts[member.id];

    if (!draft || !hasSettingsTeamDraftChanges(member, draft)) {
      return;
    }

    clearToast();
    setSavingMemberId(member.id);

    try {
      const { data } = await api.patch(`/auth/team/${member.id}`, {
        role_slug: draft.role_slug,
        branch_id: Number(draft.branch_id),
        status: draft.status,
      });

      syncTeamState(data);
      setToast({
        tone: 'success',
        message: data.message || 'Workspace access updated successfully.',
      });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getSettingsSubmitError(error, 'We could not update that workspace member right now.'),
      });
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleResendInvite = async (member) => {
    clearToast();
    setResendingMemberId(member.id);

    try {
      const { data } = await api.post(`/auth/team/${member.id}/resend-invite`);
      syncTeamState(data);
      setToast({
        tone: 'success',
        message: data.message || 'Invite resent successfully.',
      });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getSettingsSubmitError(error, 'We could not resend that invite right now.'),
      });
    } finally {
      setResendingMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        groupAriaLabel="Team access feedback"
      />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader
            title="Team access is unavailable"
            subtitle="This settings section only works for active business owners right now"
          />
          <div className="space-y-4 text-sm text-rose-900">
            <p>{loadError}</p>
            <p>
              If you expected access here, confirm that your current workspace role is still an active
              <span className="font-semibold"> Business Owner</span>.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <ResponsiveCardGrid variant="metrics">
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Card>
              <CardHeader
                title="Add workspace member"
                subtitle="Create a new login or attach an existing Taska user to this business"
              />
              <FinanceFormError message={createError} />
              <form className="space-y-4" onSubmit={handleCreateMember}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Full name</span>
                    <input
                      className="input"
                      value={createForm.name}
                      onChange={(event) => handleCreateChange('name', event.target.value)}
                      autoComplete="name"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Email address</span>
                    <input
                      className="input"
                      type="email"
                      value={createForm.email}
                      onChange={(event) => handleCreateChange('email', event.target.value)}
                      autoComplete="email"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Phone number</span>
                    <input
                      className="input"
                      type="tel"
                      value={createForm.phone}
                      onChange={(event) => handleCreateChange('phone', event.target.value)}
                      autoComplete="tel"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Role</span>
                    <select
                      className="input"
                      value={createForm.role_slug}
                      onChange={(event) => handleCreateChange('role_slug', event.target.value)}
                    >
                      <option value="">Select role</option>
                      {teamState.roles.map((role) => (
                        <option key={role.id} value={role.slug}>{role.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Branch</span>
                    <select
                      className="input"
                      value={createForm.branch_id}
                      onChange={(event) => handleCreateChange('branch_id', event.target.value)}
                    >
                      <option value="">Select branch</option>
                      {teamState.branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </label>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">How member creation works</p>
                  <p className="mt-1">
                    If the email already belongs to an existing Taska user, this will attach that login to the current workspace immediately. If it is a brand-new email, Taska sends them an invite email so they can accept and choose their own password - they won&apos;t be able to sign in until they do.
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Roles stay business-scoped, and branch assignment controls where the member operates first.
                  </p>
                  <Button type="submit" disabled={creating || teamState.roles.length === 0 || teamState.branches.length === 0}>
                    {creating ? 'Adding member...' : 'Add member'}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Role coverage"
                  subtitle="Permission scope by business role in this workspace"
                />
                <div className="space-y-3">
                  {teamState.roles.map((role) => (
                    <div key={role.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{role.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{role.description}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          {roleMemberCounts.get(role.slug) ?? 0} member{(roleMemberCounts.get(role.slug) ?? 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {formatSettingsTeamModuleSummary(role.permission_modules)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={content?.roadmapClassName}>
                <CardHeader
                  title={content?.roadmapTitle || 'Still ahead'}
                  subtitle={content?.roadmapSubtitle || 'What expands next in access control'}
                />
                <ul className={`space-y-2 text-sm ${content?.roadmapTextClassName || 'text-amber-900'}`}>
                  {(content?.roadmapItems ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader
              title="Workspace members"
              subtitle="Review branch assignment, role coverage, and whether access is active or suspended"
            />
            <div className="space-y-4">
              {teamState.members.map((member) => {
                const draft = memberDrafts[member.id];
                const isSaving = savingMemberId === member.id;
                const hasChanges = hasSettingsTeamDraftChanges(member, draft);

                return (
                  <div key={member.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                          {member.is_current_user ? (
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                              You
                            </span>
                          ) : null}
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            member.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {member.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600">
                          <p>{member.email}</p>
                          <p>{member.phone || 'No phone number saved yet'}</p>
                          <p>
                            {member.role_name} in {member.branch_name || 'No branch assigned yet'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Module coverage</p>
                          <p className="mt-1">{formatSettingsTeamModuleSummary(member.permission_modules)}</p>
                        </div>
                      </div>

                      <div className="grid w-full gap-3 md:grid-cols-3 lg:max-w-2xl">
                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>Role</span>
                          <select
                            className="input"
                            value={draft?.role_slug ?? ''}
                            onChange={(event) => handleDraftChange(member.id, 'role_slug', event.target.value)}
                            disabled={member.is_current_user}
                          >
                            {teamState.roles.map((role) => (
                              <option key={role.id} value={role.slug}>{role.name}</option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>Branch</span>
                          <select
                            className="input"
                            value={draft?.branch_id ?? ''}
                            onChange={(event) => handleDraftChange(member.id, 'branch_id', event.target.value)}
                          >
                            {teamState.branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>Status</span>
                          <select
                            className="input"
                            value={draft?.status ?? 'active'}
                            onChange={(event) => handleDraftChange(member.id, 'status', event.target.value)}
                            disabled={member.is_current_user || member.status === 'invited'}
                          >
                            {member.status === 'invited' ? <option value="invited">Invited</option> : null}
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </label>

                        <div className="md:col-span-3 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-500">
                            {member.status === 'invited'
                              ? 'This invite hasn’t been accepted yet - status becomes Active automatically once they set a password.'
                              : member.is_current_user
                                ? 'Use another active business owner account if you need to change your own role or workspace status.'
                                : member.is_last_active_admin
                                  ? 'This person is the last active business owner, so owner access cannot be removed until another owner is active.'
                                  : 'Changes here update only this workspace and keep other businesses on the login untouched.'}
                          </p>
                          <div className="flex gap-3">
                            {member.status === 'invited' ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void handleResendInvite(member)}
                                disabled={resendingMemberId === member.id}
                              >
                                {resendingMemberId === member.id ? 'Resending...' : 'Resend invite'}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              onClick={() => void handleSaveMember(member)}
                              disabled={isSaving || !hasChanges}
                            >
                              {isSaving ? 'Saving access...' : 'Save access'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
