import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = process.argv.includes('--built');
const target = path.join(root, 'renderer/dist/index.html');
const source = built ? target : path.join(root, 'renderer/prebuilt/index.html');
if (!fs.existsSync(source)) throw new Error(`Missing renderer: ${source}`);
let html = fs.readFileSync(source, 'utf8');
// Strip the artifact wrapper and online font imports; runtime is local-only.
html = html.replace(/<script\b[^>]*id=["']capabilities["'][^>]*>[\s\S]*?<\/script>/gi, '');
html = html.replace(/<script\b[^>]*>window\.__artifactSourceMap=[\s\S]*?<\/script>/g, '');
html = html.replace(/@import\s*(?:url\()?["']https:\/\/fonts\.googleapis\.com[^"']*["']\)?\s*;/g, '');
html = html.replace(/https:\/\/artifact-assets\.placeholder\/src\/assets\/([A-Za-z0-9._-]+)/g, (_url, name) => {
  const asset = path.join(root, 'renderer/src/assets', name);
  const mime = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }[path.extname(name)];
  if (!mime || !fs.existsSync(asset)) throw new Error(`Missing local image: ${name}`);
  return `data:${mime};base64,${fs.readFileSync(asset).toString('base64')}`;
});
html = html.replace(/<meta\b(?=[^>]*http-equiv=["']Content-Security-Policy["'])[^>]*>/gi, '');
const hashes = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => `'sha256-${crypto.createHash('sha256').update(match[1]).digest('base64')}'`);
const csp = [
  "default-src 'none'", `script-src 'self' ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self' data:", "connect-src 'none'", "object-src 'none'",
  "base-uri 'none'", "form-action 'none'", "frame-src 'none'", "worker-src 'none'"
].join('; ');
const platformCss = `
<style id="desktop-overrides">
/* Native font fallbacks keep Persian readable without remote font requests. */
body,button,input { font-family: "Segoe UI",Tahoma,Arial,sans-serif; }
.brand>span,.hero h1,.welcome,.game-art strong,.detail-art strong,
.collection-panel strong,.hero-stamp,.hero-stamp small,.footer-brand {
  font-family: Impact,"Arial Narrow","Segoe UI",sans-serif;
}
.hero h1 {font-size:120px;letter-spacing:0;}
.welcome {font-size:29px;}
.game-art strong {font-size:30px;line-height:1.15;}
.section-heading .eyebrow,.art-label {font-size:14px!important;}
</style>`;
html = html.replace(/<html lang="en">/, '<html lang="fa">');
html = html.replace(/<head>/, `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
html = html.replace('</head>', `${platformCss}\n</head>`);
// Keep the web prototype's honest feature boundary, clarify this is the desktop shell.
html = html.replaceAll('نسخهٔ نمایشی', 'نسخهٔ دسکتاپ');
html = html.replaceAll('تجربهٔ نمایشی تحت وب', 'کتابخانهٔ دسکتاپ');
html = html.replaceAll('لانچر نصب‌شدنی نیست', 'اجراکنندهٔ بازی نیست');
html = html.replaceAll('WEB PROTOTYPE', 'DESKTOP CATALOG');
// The replacements above can touch inline script text. Recompute hashes last.
const finalHashes = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => `'sha256-${crypto.createHash('sha256').update(match[1]).digest('base64')}'`);
html = html.replace(/script-src 'self'[^;"]*/, `script-src 'self' ${finalHashes.join(' ')}`);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, html);
console.log(`Prepared local-only desktop renderer (${Buffer.byteLength(html)} bytes).`);
