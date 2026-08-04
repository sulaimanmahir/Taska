import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Expenses.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('expenses page keeps query-backed loading for expenses, categories, summary, and reports', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/expenses'/);
  assert.match(source, /api\.get\('\/expense-categories'/);
  assert.match(source, /api\.get\('\/expenses\/summary'/);
  assert.match(source, /api\.get\('\/reports\/expenses'/);
});

test('expenses page exposes a shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /expenseQueries = \[expensesQuery, categoriesQuery, todaySummaryQuery, weekReportQuery, monthReportQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the expense workspace right now\. Please try again\./);
});
