import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cssPath = path.resolve(process.cwd(), 'src/index.css');
const source = fs.readFileSync(cssPath, 'utf8');

test('the base reset and custom component classes stay inside explicit Tailwind layers', () => {
  // Regression guard for a real, previously-shipped bug: the `* { padding: 0 }`
  // reset (and every custom class like .input, .metric-chip, etc.) used to be
  // unlayered CSS. Unlayered CSS beats ANY layered rule regardless of
  // specificity, and Tailwind utility classes always live in @layer utilities -
  // so the reset was silently canceling Tailwind padding utilities (px-4, py-3,
  // pl-11, ...) on every plain <input>/<textarea> that didn't have a rescuing
  // custom class. Wrapping the reset in @layer base and the custom classes in
  // @layer components restores the intended base < components < utilities
  // priority, letting Tailwind utilities always win as expected.
  assert.match(source, /@layer base \{/);
  assert.match(source, /@layer components \{/);

  // The reset must be inside @layer base, not left unlayered.
  const baseLayerStart = source.indexOf('@layer base {');
  const componentsLayerStart = source.indexOf('@layer components {');
  const resetRuleIndex = source.indexOf('* {\n  box-sizing: border-box;');

  assert.ok(baseLayerStart >= 0 && componentsLayerStart >= 0, 'both layers must exist');
  assert.ok(
    resetRuleIndex > baseLayerStart && resetRuleIndex < componentsLayerStart,
    'the * reset must sit inside @layer base, before @layer components starts',
  );

  // .input (and everything else treated as a component class) must sit inside
  // @layer components, not before it / outside any layer.
  const inputRuleIndex = source.indexOf('.input {');
  assert.ok(inputRuleIndex > componentsLayerStart, '.input must sit inside @layer components');
});
