const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
let errors = [];
let passed = 0;

function check(desc, cond) {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${desc}`);
  } else {
    errors.push(desc);
    console.error(`  [FAIL] ${desc}`);
  }
}

console.log('=== EbookBuddy SEO Audit ===\n');

// 1. Check Root Asset Files
console.log('1. Checking Root & Asset Files:');
const requiredFiles = [
  'index.html',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'site.webmanifest',
  'og-image.png'
];

requiredFiles.forEach(f => {
  const p = path.join(ROOT, f);
  check(`File exists: ${f}`, fs.existsSync(p) && fs.statSync(p).size > 0);
});

// 2. Check HTML files for SEO tags
console.log('\n2. Auditing HTML Pages for Essential Meta Tags:');

const pagesToAudit = [
  { path: 'index.html', canonical: 'https://eb.sabimentors.com/', isArticle: false, allowIndex: true },
  { path: 'blog/index.html', canonical: 'https://eb.sabimentors.com/blog/', isArticle: false, allowIndex: true },
  { path: 'blog/turn-real-problem-into-profitable-ebook/index.html', canonical: 'https://eb.sabimentors.com/blog/turn-real-problem-into-profitable-ebook/', isArticle: true, allowIndex: true },
  { path: 'blog/prompt-engineering-guide-for-ebook-authors/index.html', canonical: 'https://eb.sabimentors.com/blog/prompt-engineering-guide-for-ebook-authors/', isArticle: true, allowIndex: true },
  { path: 'blog/high-converting-funnels-to-sell-ebook/index.html', canonical: 'https://eb.sabimentors.com/blog/high-converting-funnels-to-sell-ebook/', isArticle: true, allowIndex: true },
  { path: 'author/ebookbuddy/index.html', canonical: 'https://eb.sabimentors.com/author/ebookbuddy/', isArticle: false, allowIndex: true },
  { path: 'cms/index.html', allowIndex: false }
];

pagesToAudit.forEach(page => {
  const fullPath = path.join(ROOT, page.path);
  console.log(`\nAuditing: ${page.path}`);
  if (!fs.existsSync(fullPath)) {
    check(`Page exists: ${page.path}`, false);
    return;
  }
  const html = fs.readFileSync(fullPath, 'utf8');

  // Title check
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  check(`Has <title>`, !!titleMatch && titleMatch[1].trim().length > 0);
  if (titleMatch) {
    const title = titleMatch[1];
    check(`Title has reasonable length (<= 75 chars): "${title}" (${title.length} chars)`, title.length <= 75);
    check(`No duplicate brand suffix in title`, !title.includes('EbookBuddy | EbookBuddy') && !title.includes('EbookBuddy Blog | EbookBuddy'));
  }

  // Favicon links
  check(`Has favicon link`, html.includes('favicon.svg') || html.includes('favicon.ico'));

  if (page.allowIndex) {
    // Canonical
    const canonicalMatch = html.match(/<link rel="canonical" href="(.*?)"/i);
    check(`Has canonical URL`, !!canonicalMatch);
    if (canonicalMatch) {
      check(`Canonical URL matches expected: ${page.canonical}`, canonicalMatch[1] === page.canonical);
    }

    // Meta description
    const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
    check(`Has meta description`, !!descMatch && descMatch[1].length > 20);
    if (descMatch) {
      check(`Description under 165 chars (${descMatch[1].length} chars)`, descMatch[1].length <= 165);
    }

    // OpenGraph
    check(`Has og:title`, html.includes('property="og:title"'));
    check(`Has og:description`, html.includes('property="og:description"'));
    check(`Has og:url`, html.includes('property="og:url"'));
    check(`Has og:site_name`, html.includes('property="og:site_name" content="EbookBuddy"'));
    check(`Has og:image`, html.includes('property="og:image" content="https://eb.sabimentors.com/'));
    check(`Has og:image:width 1200`, html.includes('property="og:image:width" content="1200"'));
    check(`Has og:image:height 630`, html.includes('property="og:image:height" content="630"'));

    // Twitter Card
    check(`Has twitter:card`, html.includes('name="twitter:card" content="summary_large_image"'));
    check(`Has twitter:site @sabimentors`, html.includes('name="twitter:site" content="@sabimentors"'));
    check(`Has twitter:title`, html.includes('name="twitter:title"'));
    check(`Has twitter:description`, html.includes('name="twitter:description"'));
    check(`Has twitter:image`, html.includes('name="twitter:image" content="https://eb.sabimentors.com/'));

    // Schema.org JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    check(`Has JSON-LD structured data`, !!jsonLdMatch);
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        check(`JSON-LD is valid JSON`, !!parsed);
        check(`JSON-LD has @context schema.org`, parsed['@context'] === 'https://schema.org');
      } catch (err) {
        check(`JSON-LD syntax error: ${err.message}`, false);
      }
    }

    if (page.isArticle) {
      check(`Has article:published_time`, html.includes('property="article:published_time"'));
      check(`Has article:author`, html.includes('property="article:author"'));
      check(`Has article:section`, html.includes('property="article:section"'));
    }
  } else {
    // Should be noindexed
    check(`Has noindex directive`, html.includes('name="robots" content="noindex, nofollow"'));
  }
});

// 3. Sitemap & Robots
console.log('\n3. Validating sitemap.xml and robots.txt:');
const sitemapContent = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
check(`sitemap.xml has urlset xmlns`, sitemapContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
check(`sitemap.xml includes root URL`, sitemapContent.includes('<loc>https://eb.sabimentors.com/</loc>'));
check(`sitemap.xml includes blog URL`, sitemapContent.includes('<loc>https://eb.sabimentors.com/blog/</loc>'));
check(`sitemap.xml includes all 3 posts`, (sitemapContent.match(/<loc>https:\/\/eb\.sabimentors\.com\/blog\//g) || []).length === 4); // index + 3 posts

const robotsContent = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
check(`robots.txt disallows /cms/`, robotsContent.includes('Disallow: /cms/'));
check(`robots.txt references sitemap`, robotsContent.includes('Sitemap: https://eb.sabimentors.com/sitemap.xml'));

console.log(`\n================================`);
console.log(`Audit Summary: ${passed} Passed, ${errors.length} Failed`);
if (errors.length > 0) {
  console.log('Failed checks:\n' + errors.map(e => ` - ${e}`).join('\n'));
  process.exit(1);
} else {
  console.log('All SEO audits PASSED with flying colors!');
  process.exit(0);
}
