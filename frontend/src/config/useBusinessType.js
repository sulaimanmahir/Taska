import { useContext } from 'react';
import { getBusinessTypeConfig } from './businessTypes';
import { getLabelsForBusinessType } from './labelDictionary';
import { getNavigationForBusinessType } from './navigationPresets';
import { BusinessTypeContext } from './taskaBusinessTypeContext';

export function useBusinessType() {
  const context = useContext(BusinessTypeContext);

  if (!context) {
    return {
      type: 'general',
      ...getBusinessTypeConfig('general'),
      navigation: getNavigationForBusinessType('general'),
      labels: getLabelsForBusinessType('general'),
    };
  }

  return context;
}
