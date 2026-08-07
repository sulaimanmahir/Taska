import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Settings.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Settings keeps its shared settings tabs and helper wiring intact', () => {
  assert.match(source, /settingsTabs\.map\(\(tab\) => \(/);
  assert.match(source, /const activeTabContent = getSettingsTabContent\(activeTab, \{ linkedBusinesses \}\);/);
  assert.match(source, /activeTab === 'profile'/);
  assert.match(source, /activeTab === 'business'/);
  assert.match(source, /activeTab === 'users'/);
  assert.match(source, /activeTab === 'branches'/);
  assert.match(source, /activeTab === 'modules'/);
});

test('Settings keeps profile and business updates on the auth store mutation contract', () => {
  assert.match(source, /await updateProfile\(values\)/);
  assert.match(source, /await updateCurrentBusiness\(values\)/);
  assert.match(source, /getSettingsSubmitError\(error, 'We could not save your profile right now\.'\)/);
  assert.match(source, /getSettingsSubmitError\(error, 'We could not save your business settings right now\.'\)/);
});

test('Settings preserves workspace-switch and creation actions at the page boundary', () => {
  assert.match(source, /to="\/business-select"/);
  assert.match(source, /to="\/businesses\/new"/);
  assert.match(source, /<SettingsTeamPanel content=\{activeTabContent\} \/>/);
  assert.match(source, /<SettingsBranchesPanel content=\{activeTabContent\} \/>/);
  assert.match(source, /<SettingsModulesPanel content=\{activeTabContent\} \/>/);
});
