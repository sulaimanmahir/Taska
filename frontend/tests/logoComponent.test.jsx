import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';

import Logo from '../src/components/Logo.jsx';

test('full logo exposes an accessible label when it is not decorative', () => {
  const markup = renderToStaticMarkup(
    <Logo variant="full" label="Taska Workspace" showSignature signatureText="by Result Seekers" />
  );

  assert.match(markup, /role="img"/);
  assert.match(markup, /aria-label="Taska Workspace"/);
  assert.doesNotMatch(markup, /aria-hidden="true"/);
});

test('wordmark logo falls back to the default label for accessibility', () => {
  const markup = renderToStaticMarkup(<Logo variant="wordmark" label="   " />);

  assert.match(markup, /role="img"/);
  assert.match(markup, /aria-label="Taska"/);
});

test('decorative lockups stay hidden from assistive technology', () => {
  const markup = renderToStaticMarkup(<Logo variant="full" decorative />);

  assert.match(markup, /aria-hidden="true"/);
  assert.doesNotMatch(markup, /aria-label=/);
});
