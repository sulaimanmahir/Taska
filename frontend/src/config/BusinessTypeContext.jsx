import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getBusinessTypeConfig } from './businessTypes';
import { BusinessTypeContext } from './taskaBusinessTypeContext';
import { getNavigationForBusinessType } from './navigationPresets';
import { getLabelsForBusinessType } from './labelDictionary';

export function BusinessTypeProvider({ children }) {
  const { business } = useAuthStore();
  
  const businessType = business?.business_type || 'general';
  
  const config = useMemo(() => {
    const typeConfig = getBusinessTypeConfig(businessType);
    const navigation = getNavigationForBusinessType(businessType);
    const labels = getLabelsForBusinessType(businessType);
    
    return {
      type: businessType,
      ...typeConfig,
      navigation,
      labels,
    };
  }, [businessType]);
  
  return (
    <BusinessTypeContext.Provider value={config}>
      {children}
    </BusinessTypeContext.Provider>
  );
}
