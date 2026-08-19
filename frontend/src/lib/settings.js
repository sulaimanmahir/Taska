export const settingsTabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'business', label: 'Business' },
  { key: 'users', label: 'Users & Roles' },
  { key: 'branches', label: 'Branches' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'modules', label: 'Modules' },
  { key: 'activity', label: 'Activity' },
];

export function buildSettingsMetrics({ user = null, business = null, linkedBusinesses = 0 } = {}) {
  return [
    {
      label: 'Active Workspace',
      value: business?.name || 'No business selected',
      helper: 'This is the tenant currently powering your dashboard and workflows',
      tone: 'violet',
    },
    {
      label: 'Linked Businesses',
      value: linkedBusinesses.toLocaleString(),
      helper: linkedBusinesses === 1
        ? 'One workspace is connected to this login'
        : 'Multiple workspaces can share one secure login',
      tone: 'sky',
    },
    {
      label: 'Signed-in Identity',
      value: user?.name || 'Unknown user',
      helper: user?.email || 'Profile email not available yet',
      tone: 'emerald',
    },
  ];
}

export function buildSettingsProfileFields(user = {}) {
  return [
    { label: 'Full name', value: user?.name },
    { label: 'Email address', value: user?.email },
    {
      label: 'Phone number',
      value: user?.phone,
      helper: 'Optional. Used for support follow-up, recovery, and cleaner account handoff.',
    },
    {
      label: 'Current business ID',
      value: user?.current_business_id,
      helper: 'Useful for support and tenant troubleshooting.',
    },
  ];
}

export function buildSettingsBusinessFields(business = {}) {
  return [
    {
      label: 'Business type',
      value: business?.business_type_label || business?.business_type,
      helper: 'This controls industry-aware workflows, navigation, and AI behavior.',
    },
    { label: 'Business email', value: business?.email },
    { label: 'Phone', value: business?.phone },
    { label: 'Currency', value: business?.currency },
    {
      label: 'Location',
      value: business?.location || business?.address,
      fullWidth: true,
    },
  ];
}

export function getSettingsTabContent(tab, { linkedBusinesses = 0 } = {}) {
  if (tab === 'profile') {
    return {
      asideToneClassName: 'border-violet-200 bg-violet-50/60',
      asideTitle: 'Profile updates are live',
      asideSubtitle: 'Changes now save directly into your authenticated Taska identity',
      asideParagraphs: [
        'Name, email, and phone changes now persist immediately and refresh the active session, so one login stays aligned across linked workspaces.',
        'Role assignment, current business selection, and branch-aware permissions still come from workspace access controls and remain read-only here.',
      ],
      asideParagraphToneClassNames: ['', 'text-violet-700'],
    };
  }

  if (tab === 'business') {
    return {
      multiBusinessTitle: 'Multi-business ready',
      multiBusinessSubtitle: 'One login can securely manage multiple businesses',
      multiBusinessCopy: `Your account currently has ${linkedBusinesses} linked business${linkedBusinesses === 1 ? '' : 'es'}. Use workspace switching when you want to move between brands, branches, or operating models without signing out.`,
      actionsTitle: 'Next business actions',
      actionsSubtitle: 'Useful paths that are already live',
    };
  }

  if (tab === 'users') {
    return {
      intro:
        'Manage who can operate in the current workspace, which branch they belong to, and how much module access each role opens up.',
      calloutTitle: 'Access model',
      calloutCopy:
        'Roles are business-scoped, branch-aware, and intentionally separate from personal profile settings so multi-tenant access stays clean and explainable.',
      roadmapTitle: 'Still ahead',
      roadmapSubtitle: 'High-value access controls that build on this foundation',
      roadmapItems: [
        'Email-based invite acceptance instead of owner-set initial passwords',
        'Branch-level approval rules for sensitive finance and stock actions',
      ],
      roadmapClassName: 'border-amber-200 bg-amber-50/60',
      roadmapTextClassName: 'text-amber-900',
    };
  }

  if (tab === 'branches') {
    return {
      intro:
        'Create operating locations, choose which branch is primary, and pause branches that no longer need active team coverage.',
      calloutTitle: 'Branch operating model',
      calloutCopy:
        'Branches remain business-scoped, primary location changes stay explicit, and inactive branches are blocked until active member assignments are cleared.',
      roadmapTitle: 'Still ahead',
      roadmapSubtitle: 'Higher-order location controls that build on this foundation',
      roadmapItems: [
        'Automatic branch-aware inventory routing (sales currently always use the one business-wide default warehouse - see the Warehouses tab to assign warehouses to branches in the meantime)',
        'Location-specific approval rules for stock and finance actions',
        'AI-led branch comparison alerts for performance, demand, and staffing',
      ],
      roadmapClassName: 'border-emerald-200 bg-emerald-50/60',
      roadmapTextClassName: 'text-emerald-900',
    };
  }

  if (tab === 'warehouses') {
    return {
      intro:
        'Register warehouses and tie each one to a branch, so stock has a clear home as the business grows beyond a single location.',
      calloutTitle: 'What warehouse assignment does today',
      calloutCopy:
        'Assigning a warehouse to a branch here makes the relationship visible and manageable, but sales and purchases still resolve stock through the single business-wide default warehouse rather than automatically picking the warehouse for the current branch - see the Branches tab for that still-ahead item.',
    };
  }

  if (tab === 'modules') {
    return {
      calloutTitle: 'Feature modules',
      calloutSubtitle: 'Turn optional workflows on or off without changing your business type',
      calloutCopy:
        'Modules are feature toggles within your current business type - they control which optional workflows (like loyalty, refunds, or barcode labels) show up in navigation, not which industry your workspace is set up as.',
    };
  }

  if (tab === 'activity') {
    return {
      intro:
        'A record of who added or changed team member access, and who created or updated branches - the changes that affect what other people can do in this workspace.',
      calloutTitle: 'Why this exists',
      calloutCopy:
        'Only the fields that actually changed are recorded, not a full snapshot, so the log stays readable as the team grows.',
    };
  }

  return null;
}
