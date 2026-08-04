import { useState } from 'react';

const STORAGE_KEY = 'taska_onboarding';

const tours = [
  {
    id: 'welcome',
    title: 'Welcome to Taska!',
    content: 'Let\'s take a quick tour to help you get started.',
    position: 'center',
    buttons: [{ label: 'Get Started', action: 'next' }],
  },
  {
    id: 'pos',
    title: 'Point of Sale',
    content: 'Use POS to process sales quickly. Search products by name or barcode.',
    position: 'bottom',
    target: '[data-tour="pos"]',
    buttons: [{ label: 'Skip', action: 'skip' }, { label: 'Next', action: 'next' }],
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    content: 'Track all your products here. Add new products or update stock levels.',
    position: 'right',
    target: '[data-tour="inventory"]',
    buttons: [{ label: 'Skip', action: 'skip' }, { label: 'Next', action: 'next' }],
  },
  {
    id: 'customers',
    title: 'Customer Database',
    content: 'Build your customer list. Track purchases and offer loyalty rewards.',
    position: 'right',
    target: '[data-tour="customers"]',
    buttons: [{ label: 'Skip', action: 'skip' }, { label: 'Next', action: 'next' }],
  },
  {
    id: 'reports',
    title: 'Business Reports',
    content: 'View sales reports, profit summaries, and business insights.',
    position: 'top',
    target: '[data-tour="reports"]',
    buttons: [{ label: 'Skip', action: 'skip' }, { label: 'Finish', action: 'complete' }],
  },
];

function getStoredOnboardingStatus() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(STORAGE_KEY));
}

export function useOnboarding() {
  const [step, setStep] = useState(-1);
  const [completed, setCompleted] = useState(getStoredOnboardingStatus);

  const start = () => setStep(0);
  const next = () => setStep((currentStep) => currentStep + 1);
  const complete = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setStep(-1);
    setCompleted(true);
  };
  const skip = () => complete();

  return { step, tour: tours[step] || null, totalSteps: tours.length, start, next, skip, complete, completed };
}
