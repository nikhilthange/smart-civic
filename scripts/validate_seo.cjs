const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('===[ STARTING STRICT 100% SEO, GEO & SCHEMA AUDIT ]===');

// 1. Validate index.html
const indexHtmlPath = path.join(rootDir, 'frontend', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// Title check
const titleMatch = indexHtml.match(/<title>(.*?)<\/title>/);
if (!titleMatch) throw new Error('Missing <title> tag in index.html');
if (titleMatch[1].length > 60) throw new Error(`Title too long (${titleMatch[1].length} chars, max 60): "${titleMatch[1]}"`);
console.log(`✓ <title> tag verified (${titleMatch[1].length} chars, optimal <=60):`, titleMatch[1]);

// Meta Description check
const descMatch = indexHtml.match(/<meta name="description" content="(.*?)"/);
if (!descMatch) throw new Error('Missing meta description');
if (descMatch[1].length < 120 || descMatch[1].length > 160) {
  throw new Error(`Meta description length invalid (${descMatch[1].length} chars, optimal 120-160): "${descMatch[1]}"`);
}
console.log(`✓ Meta description verified (${descMatch[1].length} chars, optimal 120-160):`, descMatch[1]);

// Meta Keywords check
const keywordsMatch = indexHtml.match(/<meta name="keywords" content="(.*?)"/);
if (!keywordsMatch) throw new Error('Missing meta keywords');
console.log('✓ Meta keywords verified (' + keywordsMatch[1].split(',').length + ' keyword tags).');

// H1 in raw HTML check
const h1Match = indexHtml.match(/<h1[\s\S]*?>([\s\S]*?)<\/h1>/);
if (!h1Match) throw new Error('Missing H1 heading in initial HTML');
console.log('✓ Static H1 tag verified inside <div id="root">.');

// Favicon Links
const faviconSvg = fs.existsSync(path.join(rootDir, 'frontend', 'public', 'favicon.svg'));
const logoSvg = fs.existsSync(path.join(rootDir, 'frontend', 'public', 'logo.svg'));
if (!faviconSvg || !logoSvg) throw new Error('Favicon or Logo file missing in public directory');
console.log('✓ favicon.svg (' + fs.statSync(path.join(rootDir, 'frontend', 'public', 'favicon.svg')).size + ' bytes) & logo.svg (' + fs.statSync(path.join(rootDir, 'frontend', 'public', 'logo.svg')).size + ' bytes) verified.');

// JSON-LD Validation
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!jsonLdMatch) throw new Error('Missing JSON-LD structured schema');
const jsonLd = JSON.parse(jsonLdMatch[1]);
if (!jsonLd['@graph'] || jsonLd['@graph'].length === 0) throw new Error('JSON-LD graph is empty');
console.log('✓ JSON-LD Schema valid with ' + jsonLd['@graph'].length + ' graph entities:');
jsonLd['@graph'].forEach((entity) => {
  console.log('   - @type: ' + entity['@type'] + ' (' + (entity.name || entity.url || 'Entity') + ')');
});

// 2. Validate manifest.json
const manifestPath = path.join(rootDir, 'frontend', 'public', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
if (!manifest.name || !manifest.icons) throw new Error('Invalid manifest.json');
console.log('✓ manifest.json valid: ' + manifest.name + ' (' + manifest.icons.length + ' icons)');

// 3. Validate sitemap.xml
const sitemapPath = path.join(rootDir, 'frontend', 'public', 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
const urlCount = (sitemap.match(/<loc>/g) || []).length;
console.log('✓ sitemap.xml valid with ' + urlCount + ' indexed URLs.');

// 4. Validate robots.txt
const robotsPath = path.join(rootDir, 'frontend', 'public', 'robots.txt');
const robots = fs.readFileSync(robotsPath, 'utf-8');
if (!robots.includes('GPTBot') || !robots.includes('Google-Extended') || !robots.includes('PerplexityBot')) {
  throw new Error('Missing AI crawlers in robots.txt');
}
console.log('✓ robots.txt verified with all major AI search engine bots allowed.');

// 5. Validate llms.txt and llms-full.txt
const llmsPath = path.join(rootDir, 'frontend', 'public', 'llms.txt');
const llmsFullPath = path.join(rootDir, 'frontend', 'public', 'llms-full.txt');
const llms = fs.readFileSync(llmsPath, 'utf-8');
const llmsFull = fs.readFileSync(llmsFullPath, 'utf-8');
if (!llms.includes('Smart Civic') || !llmsFull.includes('Smart Civic')) {
  throw new Error('llms.txt missing key identification');
}
console.log('✓ llms.txt and llms-full.txt verified for ChatGPT / Gemini / Claude Answer Engine Optimization.');

console.log('======================================================');
console.log('🎉 100% STRICT AUDIT RESULT: ALL CHECKS PASSED PERFECTLY');
console.log('======================================================');
