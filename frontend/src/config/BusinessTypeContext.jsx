import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getBusinessTypeConfig } from './businessTypes';
import { BusinessTypeContext } from './taskaBusinessTypeContext';
import { getMergedNavigationForBusinessTypes } from './navigationPresets';
import { getLabelsForBusinessType } from './labelDictionary';

export function BusinessTypeProvider({ children }) {
  const { business } = useAuthStore();

  const businessType = business?.business_type || 'general';
  const activeBusinessTypes = business?.active_business_types?.length
    ? business.active_business_types
    : [businessType];
  const activeBusinessTypesKey = activeBusinessTypes.join(',');

  const config = useMemo(() => {
    // type config and labels stay keyed off the single primary business_type
    // (open question in MULTI_MODULE_ARCHITECTURE.md - not yet decided how a
    // multi-vertical business should blend these). Navigation is the one
    // piece that already merges across every active vertical.
    const typeConfig = getBusinessTypeConfig(businessType);
    const navigation = getMergedNavigationForBusinessTypes(activeBusinessTypes);
    const labels = getLabelsForBusinessType(businessType);

    return {
      type: businessType,
      activeTypes: activeBusinessTypes,
      hasActiveType: (type) => activeBusinessTypes.includes(type),
      ...typeConfig,
      navigation,
      labels,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessType, activeBusinessTypesKey]);

  return (
    <BusinessTypeContext.Provider value={config}>
      {children}
    </BusinessTypeContext.Provider>
  );
}
