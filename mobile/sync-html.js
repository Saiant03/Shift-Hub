// Copies the root index.html (the real app) into htmlSource.js so the WebView
// can load it. Runs automatically before `npm start`. Root index.html stays the
// single source of truth — never edit htmlSource.js by hand.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'index.html');
const out = path.join(__dirname, 'htmlSource.js');

const html = fs.readFileSync(src, 'utf8');
const banner = '// AUTO-GENERATED from ../index.html by sync-html.js — do not edit by hand.\n';
fs.writeFileSync(out, banner + 'export default ' + JSON.stringify(html) + ';\n');

console.log('Synced index.html -> htmlSource.js (' + html.length + ' chars)');
