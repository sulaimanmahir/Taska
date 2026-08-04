import { useEffect, useState } from 'react';

export function useActiveFinanceSection({
  sections = [],
  initialLabel,
  overrideLabel = null,
  offset = 140,
}) {
  const fallbackLabel = initialLabel ?? sections[0]?.label ?? null;
  const [activeLabel, setActiveLabel] = useState(overrideLabel ?? fallbackLabel);

  useEffect(() => {
    if (overrideLabel) {
      return undefined;
    }

    const updateActiveSection = () => {
      const ranked = sections
        .map((section) => {
          const element = section.ref.current;

          if (!element) {
            return null;
          }

          const rect = element.getBoundingClientRect();

          return {
            label: section.label,
            distance: Math.abs(rect.top - offset),
          };
        })
        .filter(Boolean)
        .sort((left, right) => left.distance - right.distance);

      if (ranked[0]?.label) {
        setActiveLabel(ranked[0].label);
      }
    };

    queueMicrotask(updateActiveSection);
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [offset, overrideLabel, sections]);

  return overrideLabel ?? activeLabel ?? fallbackLabel;
}
