// Copies the root index.html (the real app) into htmlSource.js so the WebView
// can load it. Runs automatically before `npm start`. Root index.html stays the
// single source of truth — never edit htmlSource.js by hand.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'index.html');
const out = path.join(__dirname, 'htmlSource.js');

// The WebView loads this HTML with no file access (baseUrl https://shifthub.local/ has no server),
// so local <script src="x.js?v=..."> tags are replaced by their file contents here.
const html = fs.readFileSync(src, 'utf8').replace(/<script src="([\w.-]+\.js)(?:\?[^"]*)?"><\/script>/g, (tag, name) => {
  const file = path.join(__dirname, '..', name);
  if (!fs.existsSync(file)) throw new Error('sync-html: ' + name + ' (referenced by index.html) not found');
  const js = fs.readFileSync(file, 'utf8');
  if (/<\/script/i.test(js)) throw new Error('sync-html: ' + name + ' contains </script and cannot be inlined');
  return '<script>' + js + '</script>';
});
if (/<script[^>]*\ssrc="(?![a-z]+:)/i.test(html)) throw new Error('sync-html: a local <script src> was left un-inlined');
const banner = '// AUTO-GENERATED from ../index.html by sync-html.js — do not edit by hand.\n';
fs.writeFileSync(out, banner + 'export default ' + JSON.stringify(html) + ';\n');

console.log('Synced index.html -> htmlSource.js (' + html.length + ' chars)');
