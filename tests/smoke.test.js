const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const indexContent = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('index.html contains BoraNexus branding', () => {
  assert.match(indexContent, /BoraNexus/i);
});

test('index.html contains critical app features', () => {
  assert.match(indexContent, /Criar sala/i);
  assert.match(indexContent, /Entrar em sala/i);
  assert.match(indexContent, /Chat/i);
  assert.match(indexContent, /RPG Brasil Oculto/i);
});

test('package.json declares a valid test command', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(typeof packageJson.scripts.test, 'string');
  assert.match(packageJson.scripts.test, /node --test/i);
});
