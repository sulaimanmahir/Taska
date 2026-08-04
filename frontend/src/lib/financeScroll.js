export function scrollToFinanceRef(ref, options = { behavior: 'smooth', block: 'start' }) {
  ref?.current?.scrollIntoView(options);
}
