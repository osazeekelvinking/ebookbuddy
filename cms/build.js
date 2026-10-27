/**
 * EbookBuddy Static Blog Site Generator
 * Compiles content/posts.json and content/authors.json into pure static HTML files
 * with clean extensionless URLs (blog/[slug]/index.html, author/[slug]/index.html, cms/index.html).
 * Inlines critical CSS directly into each page so styles NEVER fail to render,
 * whether viewed via file:/// protocol, local dev server, or production CDN.
 */

const fs = require('fs');
const path = require('path');
const engine = require('./engine.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const AUTHOR_DIR = path.join(ROOT_DIR, 'author');
const CMS_DIR = path.join(ROOT_DIR, 'cms');

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return fallback;
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Read blog.css for inlining so it renders immediately and never breaks
const BLOG_CSS = fs.readFileSync(path.join(BLOG_DIR, 'blog.css'), 'utf8');

const SITE_URL = 'https://eb.sabimentors.com';
const TWITTER_HANDLE = '@sabimentors';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function getHeadTags(arg1, arg2, arg3, arg4, arg5) {
  let opts = {};
  if (typeof arg1 === 'object' && arg1 !== null) {
    opts = arg1;
  } else {
    opts = {
      relDepth: arg1 || 1,
      title: arg2 || '',
      description: arg3 || '',
      ogType: arg4 || 'website',
      ...(arg5 || {})
    };
  }

  const relDepth = opts.relDepth || 1;
  const rootRel = '../'.repeat(relDepth);
  const rawTitle = (opts.title || 'EbookBuddy').trim();
  
  // Format title without duplicating brand suffix or exceeding SERP limits
  let finalTitle = rawTitle;
  if (!finalTitle.includes('EbookBuddy')) {
    if (finalTitle.length <= 48) {
      finalTitle = `${finalTitle} | EbookBuddy`;
    }
  }

  const rawDesc = (opts.description || 'Turn real problems into profitable ebooks with AI. Answer simple questions, get ready-made prompts, and launch in 15 stages.').trim();
  let metaDesc = rawDesc;
  if (metaDesc.length > 158) {
    const truncated = metaDesc.substring(0, 155);
    const lastSpace = truncated.lastIndexOf(' ');
    metaDesc = (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }
  const ogType = opts.ogType || 'website';
  
  // Canonical URL
  let canonicalUrl = `${SITE_URL}/`;
  if (opts.canonicalPath) {
    const cleanPath = opts.canonicalPath.startsWith('/') ? opts.canonicalPath : `/${opts.canonicalPath}`;
    canonicalUrl = `${SITE_URL}${cleanPath}`;
  }

  // OG Image handling
  let ogImageUrl = DEFAULT_OG_IMAGE;
  if (opts.ogImage) {
    if (opts.ogImage.startsWith('http://') || opts.ogImage.startsWith('https://')) {
      ogImageUrl = opts.ogImage;
    } else {
      const cleanImg = opts.ogImage.startsWith('/') ? opts.ogImage : `/${opts.ogImage}`;
      ogImageUrl = `${SITE_URL}${cleanImg}`;
    }
  }
  const ogImageAlt = opts.ogImageAlt || finalTitle;

  const robotsTag = opts.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : '';
  const extraMeta = opts.extraMeta ? `${opts.extraMeta.trim()}\n` : '';
  const schemaScript = opts.schemaJson ? `<script type="application/ld+json">\n${JSON.stringify(opts.schemaJson, null, 2)}\n</script>\n` : '';

  return `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${robotsTag}<title>${escapeHtml(finalTitle)}</title>
<meta name="description" content="${escapeHtml(metaDesc)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">

<!-- Open Graph / Facebook -->
<meta property="og:site_name" content="EbookBuddy">
<meta property="og:type" content="${escapeHtml(ogType)}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:title" content="${escapeHtml(finalTitle)}">
<meta property="og:description" content="${escapeHtml(metaDesc)}">
<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}">
${extraMeta}<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="${TWITTER_HANDLE}">
<meta name="twitter:creator" content="${TWITTER_HANDLE}">
<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
<meta name="twitter:title" content="${escapeHtml(finalTitle)}">
<meta name="twitter:description" content="${escapeHtml(metaDesc)}">
<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">
<meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}">

<!-- Theme & App Icons -->
<meta name="theme-color" content="#F26B21">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="EbookBuddy">
<meta name="application-name" content="EbookBuddy">
<link rel="icon" type="image/svg+xml" href="${rootRel}favicon.svg">
<link rel="alternate icon" href="${rootRel}favicon.ico">
<link rel="apple-touch-icon" href="${rootRel}apple-touch-icon.png">
<link rel="manifest" href="${rootRel}site.webmanifest">

${schemaScript}<style id="ebookbuddy-blog-css">
${BLOG_CSS}
</style>
<link rel="stylesheet" href="${rootRel}blog/blog.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6130384188487467" crossorigin="anonymous"></script>
<script src="${rootRel}ads.js?v=20261027d"></script>
`;
}

function getNav(activePage, relDepth) {
  return `
<header class="site-header">
  <div class="nav-inner">
    <div class="brand-group">
      <a href="/" class="site-title">📖 Ebook<b>Buddy</b></a>
    </div>
    <nav class="nav-links">
      <a href="/" class="${activePage === 'home' ? 'active' : ''}">App</a>
      <a href="/blog" class="${activePage === 'blog' ? 'active' : ''}">Blog</a>
      <button type="button" class="theme-toggle-btn" id="thm" title="Toggle Theme">🌓</button>
    </nav>
  </div>
</header>
`;
}

function getFooter(relDepth) {
  const rootRel = '../'.repeat(relDepth);
  return `
<footer class="site-footer">
  <p>© 2026 <b>EbookBuddy</b> · Powered by <a href="https://sabimentors.com" target="_blank" rel="noopener">SabiMentors</a> × <a href="https://www.funnelcraftai.com" target="_blank" rel="noopener">FunnelCraft AI</a></p>
  <p style="margin-top:6px;font-size:0.75rem;color:var(--mute)">Turn any real-world problem into a profitable digital ebook in minutes.</p>
  <!-- Ebook-buddy Footer Multiplex Ad (Slot: 3385897927) -->
  <div class="ad-slot-wrap ad-autorelaxed" id="ad-footer" data-ad-slot-num="footer" data-ad-slot="3385897927" data-ad-format="autorelaxed" style="margin:20px auto 10px;"><span class="ad-label">Advertisement</span></div>
</footer>
<script>
  (function(){
    var curTheme = localStorage.getItem('eb_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    function applyTheme(t){
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('eb_theme', t);
    }
    applyTheme(curTheme);
    var btn = document.getElementById('thm');
    if(btn){
      btn.onclick = function(){
        curTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(curTheme);
      };
    }
    // Offline navigation helper: adapt extensionless URLs if opened directly via file:/// protocol
    if (window.location.protocol === 'file:') {
      var root = '${rootRel}';
      document.querySelectorAll('a[href]').forEach(function(a){
        var h = a.getAttribute('href');
        if (!h || h.startsWith('http') || h.startsWith('#') || h.startsWith('javascript:')) return;
        if (h === '/') a.setAttribute('href', root + 'index.html');
        else if (h === '/blog') a.setAttribute('href', root + 'blog/index.html');
        else if (h === '/cms') a.setAttribute('href', root + 'cms/index.html');
        else if (h.startsWith('/blog/')) a.setAttribute('href', root + h.slice(1) + '/index.html');
        else if (h.startsWith('/author/')) a.setAttribute('href', root + h.slice(1) + '/index.html');
      });
    }
  })();
</script>
`;
}

function resolveImagePath(imgPath, relDepth) {
  if (!imgPath) return '';
  if (imgPath.startsWith('http') || imgPath.startsWith('data:')) return imgPath;
  const rootRel = '../'.repeat(relDepth);
  const cleanPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
  return rootRel + cleanPath;
}

function generateCMSPage(posts, authors) {
  const relDepth = 1;
  const escapedCss = JSON.stringify(BLOG_CSS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>EbookBuddy CMS | Clean Blog Post Studio</title>
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="alternate icon" href="../favicon.ico">
<style id="ebookbuddy-blog-css">
${BLOG_CSS}
</style>
<script src="engine.js"></script>
<style>
.cms-shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: calc(100vh - 65px);
  max-width: 1400px;
  margin: 0 auto;
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
}
@media (max-width: 900px) {
  .cms-shell {
    grid-template-columns: 1fr;
  }
}
.cms-sidebar {
  background: var(--card);
  border-right: 1px solid var(--line);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cms-main {
  padding: 24px 28px 60px;
  background: var(--bg);
  overflow-y: auto;
}
.sidebar-title {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mute);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}
.post-list-item {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  cursor: pointer;
  transition: all 0.15s ease;
}
.post-list-item:hover, .post-list-item.active {
  border-color: var(--brand);
  background: var(--soft);
}
.post-list-item b {
  display: block;
  font-size: 0.88rem;
  color: var(--ink);
  line-height: 1.3;
}
.post-list-item small {
  font-size: 0.75rem;
  color: var(--mute);
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 5px;
  color: var(--ink);
}
.form-group .hint {
  font-size: 0.75rem;
  color: var(--mute);
  margin-top: 3px;
}
.input-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
input, select, textarea {
  width: 100%;
  font: inherit;
  font-size: 0.92rem;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  color: var(--ink);
}
input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--brand);
  border-color: transparent;
}
.editor-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
}
.tool-btn {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--ink);
}
.tool-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.editor-area {
  border-radius: 0 0 10px 10px;
  min-height: 260px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}
.panel-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.action-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.btn {
  padding: 9px 16px;
  border-radius: 10px;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary {
  background: var(--brand);
  color: var(--brand-ink);
  border-color: var(--brand);
}
.btn-primary:hover {
  opacity: 0.92;
}
.btn-outline {
  background: transparent;
  color: var(--ink);
  border-color: var(--line);
}
.btn-outline:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.btn-danger {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}
.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.74rem;
  background: var(--soft);
  color: var(--brand);
  border: 1px solid var(--line);
}
.live-preview-box {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px;
  margin-top: 14px;
}
</style>
</head>
<body>
${getNav('cms', relDepth)}

<div class="cms-shell">
  <!-- Sidebar: Post Library -->
  <aside class="cms-sidebar">
    <div class="sidebar-title">
      <span>Blog Posts</span>
      <button type="button" class="btn btn-primary" style="padding:4px 9px;font-size:0.75rem" onclick="createNewPost()">+ New Post</button>
    </div>
    <input type="text" id="cms-search" placeholder="Filter articles..." style="padding:6px 10px;font-size:0.82rem">
    
    <div class="post-list" id="post-list-el"></div>

    <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px">
      <button type="button" class="btn btn-outline" style="justify-content:center" onclick="exportJSON()">📥 Export posts.json</button>
      <button type="button" class="btn btn-outline" style="justify-content:center" onclick="document.getElementById('import-file').click()">📤 Import posts.json</button>
      <input type="file" id="import-file" style="display:none" accept=".json" onchange="importJSON(event)">
    </div>
  </aside>

  <!-- Main Workspace: Post Editor -->
  <main class="cms-main">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:18px">
      <div>
        <h1 style="font-size:1.5rem;font-weight:800;margin:0 0 4px">Article Editor</h1>
        <p style="font-size:0.84rem;color:var(--mute);margin:0">Create or edit static blog posts with automatic internal linking and related post recommendations.</p>
      </div>
      <div id="slug-badge" class="pill-badge">URL: /blog/<span>turn-real-problem-into-profitable-ebook</span></div>
    </div>

    <div class="panel-card">
      <div class="input-row">
        <div class="form-group" style="grid-column: 1 / -1">
          <label for="post-title">Post Title *</label>
          <input type="text" id="post-title" placeholder="e.g. How to Validate Your Ebook Idea in 48 Hours" oninput="onTitleChange()">
        </div>
      </div>

      <div class="input-row">
        <div class="form-group">
          <label for="post-slug">Slug (URL Path) *</label>
          <input type="text" id="post-slug" placeholder="e.g. validate-ebook-idea-fast" oninput="updateSlugBadge()">
          <span class="hint">Will generate extensionless URL: <code>/blog/[slug]</code></span>
        </div>
        <div class="form-group">
          <label for="post-category">Category</label>
          <select id="post-category" onchange="renderPreview()">
            <option value="Guides">Guides</option>
            <option value="AI Writing">AI Writing</option>
            <option value="Marketing">Marketing</option>
            <option value="Case Studies">Case Studies</option>
            <option value="Monetization">Monetization</option>
          </select>
        </div>
        <div class="form-group">
          <label for="post-author">Author *</label>
          <select id="post-author" onchange="renderPreview()">
            <option value="ebookbuddy">EbookBuddy (Default)</option>
          </select>
          <span class="hint">Profiles map to <code>/author/[author-slug]</code></span>
        </div>
      </div>

      <div class="input-row">
        <div class="form-group" style="grid-column: 1 / -1">
          <label for="post-subtitle">Subtitle / Hook</label>
          <input type="text" id="post-subtitle" placeholder="A catchy secondary headline" oninput="renderPreview()">
        </div>
      </div>

      <div class="input-row">
        <div class="form-group" style="grid-column: 1 / -1">
          <label for="post-excerpt">Excerpt / SEO Description</label>
          <textarea id="post-excerpt" rows="2" placeholder="Brief summary of the article for cards and search results..." oninput="renderPreview()"></textarea>
        </div>
      </div>

      <div class="input-row">
        <div class="form-group">
          <label for="post-tags">Tags (comma-separated)</label>
          <input type="text" id="post-tags" placeholder="Ebook, AI Prompts, Funnel, Marketing" oninput="renderPreview()">
          <span class="hint">Used to calculate Related Posts</span>
        </div>
        <div class="form-group">
          <label for="post-keywords">Auto-Link Target Keywords (comma-separated)</label>
          <input type="text" id="post-keywords" placeholder="validation, validate idea, book validation" oninput="renderPreview()">
          <span class="hint">Mentions of these terms in other posts will link to this post!</span>
        </div>
      </div>

      <!-- Editor Body -->
      <div class="form-group">
        <label for="post-content">Article Body (HTML / Markdown formatted)</label>
        <div class="editor-toolbar">
          <button type="button" class="tool-btn" onclick="insertTag('&lt;h2&gt;', '&lt;/h2&gt;')">H2</button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;h3&gt;', '&lt;/h3&gt;')">H3</button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;p class=&quot;lead&quot;&gt;', '&lt;/p&gt;')">Lead</button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;strong&gt;', '&lt;/strong&gt;')"><b>B</b></button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;em&gt;', '&lt;/em&gt;')"><i>I</i></button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;blockquote&gt;&quot;', '&quot;&lt;/blockquote&gt;')">Quote</button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;div class=&quot;callout-box&quot;&gt;&lt;span class=&quot;callout-badge&quot;&gt;Key Insight&lt;/span&gt;&lt;p&gt;', '&lt;/p&gt;&lt;/div&gt;')">Callout</button>
          <button type="button" class="tool-btn" onclick="insertTag('&lt;ul&gt;\\n  &lt;li&gt;', '&lt;/li&gt;\\n&lt;/ul&gt;')">List</button>
        </div>
        <textarea id="post-content" class="editor-area" rows="12" placeholder="Write article content here..." oninput="renderPreview()"></textarea>
      </div>

      <!-- Auto-Linking & Related Posts Analysis -->
      <div style="background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-top:14px">
        <div style="font-size:0.82rem;font-weight:700;color:var(--brand);margin-bottom:4px">⚡ Auto-Linker & Related Posts Engine Status</div>
        <div id="engine-summary" style="font-size:0.8rem;color:var(--mute)">Analyzing content...</div>
      </div>

      <!-- Action Buttons -->
      <div class="action-bar">
        <button type="button" class="btn btn-primary" onclick="saveCurrentPost()">💾 Save Article</button>
        <button type="button" class="btn btn-outline" onclick="copyFullHtml()">📋 Copy Static HTML</button>
        <button type="button" class="btn btn-outline" onclick="downloadStaticHtml()">⬇️ Download HTML</button>
        <button type="button" class="btn btn-danger" style="margin-left:auto" onclick="deleteCurrentPost()">🗑️ Delete</button>
      </div>
    </div>

    <!-- Live Preview -->
    <div style="margin-top:30px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="font-size:1.15rem;font-weight:800;margin:0">Live Single Post Preview</h2>
        <span style="font-size:0.78rem;color:var(--mute)">Exact rendering with author box and related posts</span>
      </div>
      <div class="live-preview-box" id="preview-container">
        <!-- Rendered in real time -->
      </div>
    </div>
  </main>
</div>

${getFooter(relDepth)}

<script>
var inlinedBlogCss = ${escapedCss};

// Seed database (pre-populated from posts.json)
var defaultPosts = ${JSON.stringify(posts, null, 2)};
var defaultAuthors = ${JSON.stringify(authors, null, 2)};

var posts = [];
var currentPostId = null;

function initCMS() {
  var saved = localStorage.getItem('eb_cms_posts');
  if (saved) {
    try {
      posts = JSON.parse(saved);
    } catch(e) {
      posts = defaultPosts;
    }
  } else {
    posts = defaultPosts;
  }
  renderPostList();
  if (posts.length > 0) {
    loadPost(posts[0].id);
  } else {
    createNewPost();
  }
}

function renderPostList() {
  var listEl = document.getElementById('post-list-el');
  var query = (document.getElementById('cms-search').value || '').toLowerCase();
  listEl.innerHTML = '';

  posts.forEach(function(post) {
    if (query && post.title.toLowerCase().indexOf(query) === -1) return;
    var div = document.createElement('div');
    div.className = 'post-list-item' + (post.id === currentPostId ? ' active' : '');
    div.onclick = function() { loadPost(post.id); };
    div.innerHTML = '<b>' + escapeHtml(post.title || 'Untitled Post') + '</b>' +
                    '<small>' + (post.category || 'General') + ' · ' + (post.publishedAt || 'Draft') + '</small>';
    listEl.appendChild(div);
  });
}

document.getElementById('cms-search').addEventListener('input', renderPostList);

function loadPost(id) {
  var post = posts.find(function(p) { return p.id === id; });
  if (!post) return;
  currentPostId = id;
  renderPostList();

  document.getElementById('post-title').value = post.title || '';
  document.getElementById('post-slug').value = post.slug || '';
  document.getElementById('post-subtitle').value = post.subtitle || '';
  document.getElementById('post-excerpt').value = post.excerpt || '';
  document.getElementById('post-category').value = post.category || 'Guides';
  document.getElementById('post-tags').value = (post.tags || []).join(', ');
  document.getElementById('post-keywords').value = (post.keywords || []).join(', ');
  document.getElementById('post-content').value = post.content || '';

  updateSlugBadge();
  renderPreview();
}

function createNewPost() {
  var newId = 'post-' + Date.now();
  var newPost = {
    id: newId,
    slug: 'new-article-' + Date.now().toString().slice(-4),
    title: 'New Ebook Guide',
    subtitle: '',
    excerpt: '',
    category: 'Guides',
    tags: ['Ebook Writing'],
    keywords: [],
    authorId: 'ebookbuddy',
    publishedAt: new Date().toISOString().split('T')[0],
    readingTime: '5 min read',
    content: '<p class="lead">Start with a captivating introductory statement that hooks the reader.</p><h2>First Section</h2><p>Explain the concept with actionable steps.</p>'
  };
  posts.unshift(newPost);
  loadPost(newId);
}

function onTitleChange() {
  var title = document.getElementById('post-title').value;
  var slugEl = document.getElementById('post-slug');
  slugEl.value = window.EbookBuddyEngine.slugify(title);
  updateSlugBadge();
  renderPreview();
}

function updateSlugBadge() {
  var slug = document.getElementById('post-slug').value || 'post';
  document.getElementById('slug-badge').innerHTML = 'URL: /blog/<b>' + escapeHtml(slug) + '</b>';
}

function insertTag(start, end) {
  var textarea = document.getElementById('post-content');
  var s = textarea.selectionStart;
  var e = textarea.selectionEnd;
  var val = textarea.value;
  var sel = val.substring(s, e) || 'text';
  textarea.value = val.substring(0, s) + start + sel + end + val.substring(e);
  textarea.focus();
  renderPreview();
}

function getActivePostData() {
  var title = document.getElementById('post-title').value;
  var slug = window.EbookBuddyEngine.slugify(document.getElementById('post-slug').value || title);
  var subtitle = document.getElementById('post-subtitle').value;
  var excerpt = document.getElementById('post-excerpt').value;
  var category = document.getElementById('post-category').value;
  var tags = document.getElementById('post-tags').value.split(',').map(function(s){return s.trim();}).filter(Boolean);
  var keywords = document.getElementById('post-keywords').value.split(',').map(function(s){return s.trim();}).filter(Boolean);
  var content = document.getElementById('post-content').value;
  var authorId = document.getElementById('post-author').value;

  return {
    id: currentPostId,
    slug: slug,
    title: title,
    subtitle: subtitle,
    excerpt: excerpt,
    category: category,
    tags: tags,
    keywords: keywords,
    authorId: authorId,
    publishedAt: new Date().toISOString().split('T')[0],
    readingTime: window.EbookBuddyEngine.calculateReadingTime(content),
    content: content
  };
}

function saveCurrentPost() {
  var data = getActivePostData();
  var idx = posts.findIndex(function(p) { return p.id === currentPostId; });
  if (idx !== -1) {
    posts[idx] = data;
  } else {
    posts.unshift(data);
  }
  localStorage.setItem('eb_cms_posts', JSON.stringify(posts));
  renderPostList();
  alert('Article saved successfully to browser storage!');
}

function deleteCurrentPost() {
  if (!confirm('Are you sure you want to delete this article?')) return;
  posts = posts.filter(function(p) { return p.id !== currentPostId; });
  localStorage.setItem('eb_cms_posts', JSON.stringify(posts));
  if (posts.length > 0) {
    loadPost(posts[0].id);
  } else {
    createNewPost();
  }
}

function exportJSON() {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 2));
  var downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "posts.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importJSON(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(evt) {
    try {
      var imported = JSON.parse(evt.target.result);
      if (Array.isArray(imported)) {
        posts = imported;
        localStorage.setItem('eb_cms_posts', JSON.stringify(posts));
        initCMS();
        alert('Successfully imported ' + posts.length + ' articles!');
      }
    } catch(err) {
      alert('Error parsing JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function renderPreview() {
  var current = getActivePostData();
  var autoLinked = window.EbookBuddyEngine.autoLinkContent(current.content, current.slug, posts);
  var related = window.EbookBuddyEngine.getRelatedPosts(current, posts, 2);

  // Update engine analysis info
  var engineSummary = document.getElementById('engine-summary');
  var foundLinks = (autoLinked.match(/class="post-auto-link"/g) || []).length;
  engineSummary.innerHTML = '🔗 <b>' + foundLinks + '</b> internal link(s) auto-injected into content &nbsp;|&nbsp; 📚 <b>' + related.length + '</b> related post(s) computed.';

  var previewEl = document.getElementById('preview-container');
  var author = defaultAuthors[0];

  previewEl.innerHTML = 
    '<article>' +
      '<div class="breadcrumbs"><a href="#">Home</a> <span class="sep">/</span> <a href="#">Blog</a> <span class="sep">/</span> <span class="current">' + escapeHtml(current.title || 'Untitled') + '</span></div>' +
      '<header class="post-header">' +
        '<span class="post-category">' + escapeHtml(current.category) + '</span>' +
        '<h1 class="post-title">' + escapeHtml(current.title || 'Untitled Post') + '</h1>' +
        (current.subtitle ? '<p class="post-subtitle">' + escapeHtml(current.subtitle) + '</p>' : '') +
        '<div class="post-meta-row">' +
          '<div class="author-mini">' +
            '<img src="../promotional_assets/images/post1_mascot_breakthrough.png" class="author-mini-avatar" onerror="this.onerror=null;this.src=\\'/promotional_assets/images/post1_mascot_breakthrough.png\\';">' +
            '<div class="author-mini-info">' +
              '<span class="author-mini-name">' + escapeHtml(author.name) + '</span>' +
              '<span class="post-dates">Today · ' + escapeHtml(current.readingTime) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="post-content">' + autoLinked + '</div>' +
      '<div class="author-profile-box">' +
        '<img src="../promotional_assets/images/post1_mascot_breakthrough.png" class="author-avatar-lg" onerror="this.onerror=null;this.src=\\'/promotional_assets/images/post1_mascot_breakthrough.png\\';">' +
        '<div class="author-body">' +
          '<div class="author-header-line"><span class="author-name">' + escapeHtml(author.name) + '</span><span class="author-role-badge">' + escapeHtml(author.role) + '</span></div>' +
          '<p class="author-bio">' + escapeHtml(author.bio) + '</p>' +
          '<a href="/author/' + escapeHtml(author.slug) + '" class="author-action-link">View all posts by ' + escapeHtml(author.name) + ' &rarr;</a>' +
        '</div>' +
      '</div>' +
      (related.length > 0 ? 
        '<section class="related-section">' +
          '<div class="related-section-header"><h3>Related Articles</h3></div>' +
          '<div class="related-grid">' +
            related.map(function(r) {
              return '<div class="related-card">' +
                '<span class="related-card-category">' + escapeHtml(r.category || 'Guide') + '</span>' +
                '<h4 class="related-card-title">' + escapeHtml(r.title) + '</h4>' +
                '<p class="related-card-excerpt">' + escapeHtml(r.excerpt) + '</p>' +
                '<div class="related-card-footer"><span>' + escapeHtml(r.publishedAt) + '</span><span>' + escapeHtml(r.readingTime) + '</span></div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</section>' : '') +
    '</article>';
}

function generateFullHtmlForCurrentPost() {
  var current = getActivePostData();
  var autoLinked = window.EbookBuddyEngine.autoLinkContent(current.content, current.slug, posts);
  var related = window.EbookBuddyEngine.getRelatedPosts(current, posts, 2);
  var author = defaultAuthors[0];

  return '<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n' +
    '<meta charset="utf-8">\\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\\n' +
    '<title>' + escapeHtml(current.title) + ' | EbookBuddy Blog</title>\\n' +
    '<style id="ebookbuddy-blog-css">\\n' + inlinedBlogCss + '\\n</style>\\n' +
    '<link rel="stylesheet" href="../../blog/blog.css">\\n' +
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6130384188487467" crossorigin="anonymous"><\\/script>\\n' +
    '<script src="../../ads.js" defer><\\/script>\\n' +
    '</head>\\n<body>\\n' +
    '<header class="site-header"><div class="nav-inner"><div class="brand-group"><a href="/" class="site-title">📖 Ebook<b>Buddy</b></a></div><nav class="nav-links"><a href="/">App</a><a href="/blog" class="active">Blog</a><button type="button" class="theme-toggle-btn" id="thm">🌓</button></nav></div></header>\\n' +
    '<main class="blog-wrap">\\n' +
    '<div class="breadcrumbs"><a href="/">Home</a> / <a href="/blog">Blog</a> / <span>' + escapeHtml(current.title) + '</span></div>\\n' +
    '<article>\\n' +
    '<header class="post-header"><span class="post-category">' + escapeHtml(current.category) + '</span><h1 class="post-title">' + escapeHtml(current.title) + '</h1>' +
    (current.subtitle ? '<p class="post-subtitle">' + escapeHtml(current.subtitle) + '</p>' : '') +
    '<div class="post-meta-row"><a href="/author/' + escapeHtml(author.slug) + '" class="author-mini"><img src="../../promotional_assets/images/post1_mascot_breakthrough.png" class="author-mini-avatar" onerror="this.onerror=null;this.src=\\'/promotional_assets/images/post1_mascot_breakthrough.png\\';"><div class="author-mini-info"><span class="author-mini-name">' + escapeHtml(author.name) + '</span><span class="post-dates">' + escapeHtml(current.publishedAt) + ' · ' + escapeHtml(current.readingTime) + '</span></div></a></div></header>\\n' +
    '<div class="post-content">' + autoLinked + '</div>\\n' +
    '<div class="author-profile-box"><img src="../../promotional_assets/images/post1_mascot_breakthrough.png" class="author-avatar-lg" onerror="this.onerror=null;this.src=\\'/promotional_assets/images/post1_mascot_breakthrough.png\\';"><div class="author-body"><div class="author-header-line"><span class="author-name">' + escapeHtml(author.name) + '</span><span class="author-role-badge">' + escapeHtml(author.role) + '</span></div><p class="author-bio">' + escapeHtml(author.bio) + '</p><a href="/author/' + escapeHtml(author.slug) + '" class="author-action-link">View all posts by ' + escapeHtml(author.name) + ' &rarr;</a></div></div>\\n' +
    (related.length > 0 ? '<section class="related-section"><div class="related-section-header"><h3>Related Articles</h3></div><div class="related-grid">' +
      related.map(function(r){return '<a href="/blog/' + r.slug + '" class="related-card"><span class="related-card-category">' + escapeHtml(r.category) + '</span><h4 class="related-card-title">' + escapeHtml(r.title) + '</h4><p class="related-card-excerpt">' + escapeHtml(r.excerpt) + '</p><div class="related-card-footer"><span>' + escapeHtml(r.publishedAt) + '</span><span>' + escapeHtml(r.readingTime) + '</span></div></a>';}).join('') +
      '</div></section>\\n' : '') +
    '<div class="product-cta-banner"><h3>Turn Your Idea Into a Profitable Ebook</h3><p>Use EbookBuddy\\'s 15-stage prompt builder to launch your book today.</p><a href="/" class="product-cta-btn">Start Free &rarr;</a></div>\\n' +
    '</article>\\n</main>\\n' +
    '<footer class="site-footer"><p>© 2026 <b>EbookBuddy</b> · Powered by <a href="https://sabimentors.com" target="_blank">SabiMentors</a> × <a href="https://www.funnelcraftai.com" target="_blank">FunnelCraft AI</a></p>' +
    '<!-- Ebook-buddy Footer Multiplex Ad (Slot: 3385897927) -->' +
    '<div class="ad-slot-wrap ad-autorelaxed" id="ad-footer" data-ad-slot-num="footer" data-ad-slot="3385897927" data-ad-format="autorelaxed" style="margin:20px auto 10px;"><span class="ad-label">Advertisement</span></div></footer>\\n' +
    '</body>\\n</html>';
}

function copyFullHtml() {
  var html = generateFullHtmlForCurrentPost();
  navigator.clipboard.writeText(html).then(function() {
    alert('Full Static HTML copied to clipboard!');
  });
}

function downloadStaticHtml() {
  var html = generateFullHtmlForCurrentPost();
  var current = getActivePostData();
  var blob = new Blob([html], { type: 'text/html' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

initCMS();
</script>
</body>
</html>`;
}

function buildSite() {
  console.log('--- Starting EbookBuddy Static Site Generator ---');

  const authors = readJSON(path.join(CONTENT_DIR, 'authors.json'), []);
  const posts = readJSON(path.join(CONTENT_DIR, 'posts.json'), []);

  const authorMap = {};
  authors.forEach(a => {
    authorMap[a.id] = a;
  });

  const defaultAuthor = authors[0] || {
    id: 'ebookbuddy',
    name: 'EbookBuddy',
    slug: 'ebookbuddy',
    role: 'Editorial Team',
    bio: 'Official EbookBuddy Editorial & Publishing Team.',
    avatar: '/promotional_assets/images/post1_mascot_breakthrough.png'
  };

  ensureDir(BLOG_DIR);
  ensureDir(AUTHOR_DIR);
  ensureDir(CMS_DIR);

  // 1. Generate Single Post Pages (blog/[slug]/index.html) -> relDepth = 2
  posts.forEach(post => {
    const postAuthor = authorMap[post.authorId] || defaultAuthor;
    const postSlugDir = path.join(BLOG_DIR, post.slug);
    ensureDir(postSlugDir);

    const relDepth = 2;
    const avatarSrc = resolveImagePath(postAuthor.avatar, relDepth);

    // Run auto-linking engine on post content
    const processedContent = engine.autoLinkContent(post.content, post.slug, posts);

    // Get 2 related posts
    const relatedPosts = engine.getRelatedPosts(post, posts, 2);

    // Build related posts cards HTML
    let relatedHtml = '';
    if (relatedPosts && relatedPosts.length > 0) {
      relatedHtml = `
      <section class="related-section">
        <div class="related-section-header">
          <h3>Related Articles</h3>
          <a href="/blog" style="font-size:0.82rem;font-weight:700">View all &rarr;</a>
        </div>
        <div class="related-grid">
          ${relatedPosts.map(rp => `
            <a href="/blog/${rp.slug}" class="related-card">
              <span class="related-card-category">${escapeHtml(rp.category || 'Guide')}</span>
              <h4 class="related-card-title">${escapeHtml(rp.title)}</h4>
              <p class="related-card-excerpt">${escapeHtml(rp.excerpt)}</p>
              <div class="related-card-footer">
                <span>${formatDate(rp.publishedAt)}</span>
                <span>${escapeHtml(rp.readingTime || '5 min read')}</span>
              </div>
            </a>
          `).join('')}
        </div>
      </section>
      `;
    }

    // Build Author Profile Box HTML
    const authorBoxHtml = `
    <div class="author-profile-box">
      <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(postAuthor.name)}" class="author-avatar-lg" onerror="this.onerror=null;this.src='/promotional_assets/images/post1_mascot_breakthrough.png'">
      <div class="author-body">
        <div class="author-header-line">
          <span class="author-name">${escapeHtml(postAuthor.name)}</span>
          <span class="author-role-badge">${escapeHtml(postAuthor.role || 'Author')}</span>
        </div>
        <p class="author-bio">${escapeHtml(postAuthor.bio)}</p>
        <a href="/author/${postAuthor.slug}" class="author-action-link">
          View all posts by ${escapeHtml(postAuthor.name)} &rarr;
        </a>
      </div>
    </div>
    `;

    // Social Sharing HTML
    const postCanonicalPath = `/blog/${post.slug}/`;
    const postOgImage = post.featuredImage || '/og-image.png';
    const shareUrl = encodeURIComponent(`${SITE_URL}${postCanonicalPath}`);
    const shareTitle = encodeURIComponent(post.title);
    const shareButtonsHtml = `
    <div class="post-share-card">
      <div class="post-share-head">
        <b>📢 Share this guide</b>
        <span style="font-size:0.75rem;color:var(--mute)">Help another creator launch their ebook</span>
      </div>
      <div class="share-grid">
        <a class="s-btn s-wa" href="https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="s-btn s-x" href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}" target="_blank" rel="noopener">X / Twitter</a>
        <a class="s-btn s-fb" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener">Facebook</a>
        <a class="s-btn s-li" href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener">LinkedIn</a>
        <button type="button" class="s-btn s-copy" onclick="navigator.clipboard.writeText(window.location.href);alert('Link copied to clipboard!');">🔗 Copy Link</button>
      </div>
    </div>
    `;

    const articleMeta = `
<!-- Article Meta -->
<meta property="article:published_time" content="${new Date(post.publishedAt || Date.now()).toISOString()}">
<meta property="article:author" content="${SITE_URL}/author/${postAuthor.slug}/">
<meta property="article:section" content="${escapeHtml(post.category || 'Guides')}">
${(post.tags || []).map(t => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n')}
`;

    const postSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": `${SITE_URL}${postCanonicalPath}#article`,
          "headline": post.title,
          "description": post.excerpt,
          "image": postOgImage.startsWith('http') ? postOgImage : `${SITE_URL}${postOgImage.startsWith('/') ? postOgImage : '/' + postOgImage}`,
          "datePublished": new Date(post.publishedAt || Date.now()).toISOString(),
          "dateModified": new Date(post.publishedAt || Date.now()).toISOString(),
          "author": {
            "@type": "Person",
            "name": postAuthor.name,
            "url": `${SITE_URL}/author/${postAuthor.slug}/`
          },
          "publisher": {
            "@type": "Organization",
            "name": "EbookBuddy",
            "url": `${SITE_URL}/`,
            "logo": {
              "@type": "ImageObject",
              "url": `${SITE_URL}/apple-touch-icon.png`
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${SITE_URL}${postCanonicalPath}`
          },
          "keywords": (post.tags || []).concat(post.keywords || []).join(', ')
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}${postCanonicalPath}#breadcrumb`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `${SITE_URL}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": `${SITE_URL}/blog/`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": post.title,
              "item": `${SITE_URL}${postCanonicalPath}`
            }
          ]
        }
      ]
    };

    const postPageTitle = post.title.length <= 48 ? `${post.title} | EbookBuddy Blog` : (post.title.length <= 58 ? `${post.title} | EbookBuddy` : post.title);

    const singlePostHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${getHeadTags({
  relDepth: relDepth,
  title: postPageTitle,
  description: post.excerpt,
  ogType: 'article',
  canonicalPath: postCanonicalPath,
  ogImage: postOgImage,
  ogImageAlt: post.title,
  extraMeta: articleMeta,
  schemaJson: postSchema
})}
</head>
<body>
${getNav('blog', relDepth)}

<main class="blog-wrap">
  <div class="breadcrumbs">
    <a href="/">Home</a>
    <span class="sep">/</span>
    <a href="/blog">Blog</a>
    <span class="sep">/</span>
    <span class="current">${escapeHtml(post.title)}</span>
  </div>

  <article>
    <header class="post-header">
      <span class="post-category">${escapeHtml(post.category || 'Article')}</span>
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      ${post.subtitle ? `<p class="post-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
      
      <div class="post-meta-row">
        <a href="/author/${postAuthor.slug}" class="author-mini">
          <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(postAuthor.name)}" class="author-mini-avatar" onerror="this.onerror=null;this.src='/promotional_assets/images/post1_mascot_breakthrough.png'">
          <div class="author-mini-info">
            <span class="author-mini-name">${escapeHtml(postAuthor.name)}</span>
            <span class="post-dates">${formatDate(post.publishedAt)} · ${escapeHtml(post.readingTime || '5 min read')}</span>
          </div>
        </a>
      </div>

      ${post.tags && post.tags.length ? `
        <div class="post-tags">
          ${post.tags.map(t => `<span class="tag-badge">#${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
    </header>

    <!-- Top Ad Slot -->
    <div class="ad-slot-wrap" id="ad-top" data-ad-slot-desk="3056304442" data-ad-slot-mob="6229262699">
      <span class="ad-label">Advertisement</span>
    </div>

    <!-- Article Content with Auto-Linked Terms -->
    <div class="post-content">
      ${processedContent}
    </div>

    <!-- Social Share Buttons -->
    ${shareButtonsHtml}

    <!-- Author Profile Box -->
    ${authorBoxHtml}

    <!-- Bottom Ad Slot -->
    <div class="ad-slot-wrap" id="ad-bottom" data-ad-slot-desk="9246930392" data-ad-slot-mob="5231663766">
      <span class="ad-label">Advertisement</span>
    </div>

    <!-- Related Posts -->
    ${relatedHtml}

    <!-- Product CTA Banner -->
    <div class="product-cta-banner">
      <h3>Turn Your Idea Into a Profitable Ebook</h3>
      <p>Use EbookBuddy's 15-stage prompt builder to generate book outlines, chapters, marketing copy, and launch material in minutes.</p>
      <a href="/" class="product-cta-btn">Start Building Your Ebook Free &rarr;</a>
    </div>
  </article>
</main>

${getFooter(relDepth)}
</body>
</html>
`;

    fs.writeFileSync(path.join(postSlugDir, 'index.html'), singlePostHtml, 'utf8');
    console.log(`Generated single post: blog/${post.slug}/index.html`);
  });

  // 2. Generate Author Archive Pages (author/[slug]/index.html) -> relDepth = 2
  authors.forEach(author => {
    const authorPosts = posts.filter(p => p.authorId === author.id);
    const authorDir = path.join(AUTHOR_DIR, author.slug);
    ensureDir(authorDir);

    const relDepth = 2;
    const avatarSrc = resolveImagePath(author.avatar, relDepth);
    const authorCanonicalPath = `/author/${author.slug}/`;
    const authorOgImage = author.avatar || '/og-image.png';

    const authorSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}${authorCanonicalPath}#profile`,
          "url": `${SITE_URL}${authorCanonicalPath}`,
          "name": author.name,
          "description": author.bio,
          "mainEntity": {
            "@type": "Person",
            "name": author.name,
            "description": author.bio,
            "jobTitle": author.role || "Author",
            "image": authorOgImage.startsWith('http') ? authorOgImage : `${SITE_URL}${authorOgImage.startsWith('/') ? authorOgImage : '/' + authorOgImage}`
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}${authorCanonicalPath}#breadcrumb`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `${SITE_URL}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": `${SITE_URL}/blog/`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": `Author: ${author.name}`,
              "item": `${SITE_URL}${authorCanonicalPath}`
            }
          ]
        }
      ]
    };

    const authorArchiveHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${getHeadTags({
  relDepth: relDepth,
  title: author.name.includes('EbookBuddy') ? `${author.name} — Author Profile & Guides` : `${author.name} — Author Profile | EbookBuddy`,
  description: author.bio,
  ogType: 'profile',
  canonicalPath: authorCanonicalPath,
  ogImage: authorOgImage,
  ogImageAlt: author.name,
  schemaJson: authorSchema
})}
</head>
<body>
${getNav('blog', relDepth)}

<main class="blog-wrap">
  <div class="breadcrumbs">
    <a href="/">Home</a>
    <span class="sep">/</span>
    <a href="/blog">Blog</a>
    <span class="sep">/</span>
    <span class="current">Author: ${escapeHtml(author.name)}</span>
  </div>

  <section class="author-hero">
    <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(author.name)}" class="author-hero-avatar" onerror="this.onerror=null;this.src='/promotional_assets/images/post1_mascot_breakthrough.png'">
    <h1 class="author-hero-name">${escapeHtml(author.name)}</h1>
    <span class="author-hero-role">${escapeHtml(author.role || 'Author')}</span>
    <p class="author-hero-bio">${escapeHtml(author.bio)}</p>
    <div class="author-stats-pill">
      <span>📚 ${authorPosts.length} ${authorPosts.length === 1 ? 'Article' : 'Articles'} Published</span>
    </div>
  </section>

  <div class="catalog-toolbar">
    <h2 style="font-size:1.25rem;margin:0;font-weight:800">All Posts by ${escapeHtml(author.name)}</h2>
  </div>

  <div class="catalog-grid">
    ${authorPosts.map(p => `
      <a href="/blog/${p.slug}" class="post-card">
        <span class="post-card-category">${escapeHtml(p.category || 'Guide')}</span>
        <h3 class="post-card-title">${escapeHtml(p.title)}</h3>
        <p class="post-card-excerpt">${escapeHtml(p.excerpt)}</p>
        <div class="post-card-meta">
          <span>${formatDate(p.publishedAt)}</span>
          <span>${escapeHtml(p.readingTime || '5 min read')}</span>
        </div>
      </a>
    `).join('')}
  </div>

  <div class="product-cta-banner" style="margin-top:36px">
    <h3>Ready to launch your own ebook?</h3>
    <p>Follow the exact blueprints written by ${escapeHtml(author.name)} and get your prompts generated in 15 stages.</p>
    <a href="/" class="product-cta-btn">Open Free Ebook Creator &rarr;</a>
  </div>
</main>

${getFooter(relDepth)}
</body>
</html>
`;

    fs.writeFileSync(path.join(authorDir, 'index.html'), authorArchiveHtml, 'utf8');
    console.log(`Generated author archive: author/${author.slug}/index.html`);
  });

  // 3. Generate Main Blog Index (blog/index.html) -> relDepth = 1
  const relDepth = 1;
  const blogIndexCanonical = `/blog/`;
  const blogIndexSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/blog/#collection`,
        "url": `${SITE_URL}/blog/`,
        "name": "EbookBuddy Blog",
        "description": "Actionable blueprints, prompt engineering frameworks, and funnel tactics to turn your ideas into income.",
        "publisher": {
          "@type": "Organization",
          "name": "EbookBuddy",
          "url": `${SITE_URL}/`,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/apple-touch-icon.png`
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/blog/#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${SITE_URL}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": `${SITE_URL}/blog/`
          }
        ]
      }
    ]
  };

  const blogIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${getHeadTags({
  relDepth: relDepth,
  title: 'EbookBuddy Blog — AI Ebook Publishing & Marketing Guides',
  description: 'Guides, frameworks, prompt templates, and sales strategies to help you turn real problems into profitable ebooks with AI.',
  ogType: 'website',
  canonicalPath: blogIndexCanonical,
  ogImage: '/og-image.png',
  ogImageAlt: 'EbookBuddy Blog',
  schemaJson: blogIndexSchema
})}
</head>
<body>
${getNav('blog', relDepth)}

<main class="blog-wrap">
  <div class="breadcrumbs">
    <a href="/">Home</a>
    <span class="sep">/</span>
    <span class="current">Blog</span>
  </div>

  <header style="margin-bottom:24px">
    <h1 style="font-size:2.2rem;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px">EbookBuddy Blog</h1>
    <p style="font-size:1.05rem;color:var(--mute);margin:0">Actionable blueprints, prompt engineering frameworks, and funnel tactics to turn your ideas into income.</p>
  </header>

  <!-- Top Ad Slot -->
  <div class="ad-slot-wrap" id="ad-top" data-ad-slot-desk="3056304442" data-ad-slot-mob="6229262699">
    <span class="ad-label">Advertisement</span>
  </div>

  <div class="catalog-toolbar">
    <input type="text" id="blog-search" class="catalog-search" placeholder="Search guides, prompts, funnels...">
  </div>

  <div class="catalog-grid" id="posts-container">
    ${posts.map(p => {
      const a = authorMap[p.authorId] || defaultAuthor;
      return `
      <article class="post-card" data-title="${escapeHtml((p.title + ' ' + p.excerpt).toLowerCase())}">
        <span class="post-card-category">${escapeHtml(p.category || 'Guide')}</span>
        <h2 class="post-card-title"><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a></h2>
        <p class="post-card-excerpt">${escapeHtml(p.excerpt)}</p>
        <div class="post-card-meta">
          <a href="/author/${a.slug}" style="color:inherit;font-weight:600">${escapeHtml(a.name)}</a>
          <span>${formatDate(p.publishedAt)} · ${escapeHtml(p.readingTime || '5 min read')}</span>
        </div>
      </article>
      `;
    }).join('')}
  </div>

  <!-- Bottom Ad Slot -->
  <div class="ad-slot-wrap" id="ad-bottom" data-ad-slot-desk="9246930392" data-ad-slot-mob="5231663766">
    <span class="ad-label">Advertisement</span>
  </div>

  <div class="product-cta-banner">
    <h3>Turn Your Idea Into a Profitable Ebook</h3>
    <p>Answer simple questions, get ready-made prompts, and build your digital product in 15 guided stages.</p>
    <a href="/" class="product-cta-btn">Launch Free Ebook Builder &rarr;</a>
  </div>
</main>

${getFooter(relDepth)}
<script>
  var searchInput = document.getElementById('blog-search');
  var cards = document.querySelectorAll('#posts-container .post-card');
  if(searchInput){
    searchInput.addEventListener('input', function(e){
      var query = (e.target.value || '').toLowerCase().trim();
      cards.forEach(function(card){
        var text = card.getAttribute('data-title') || '';
        if(!query || text.indexOf(query) !== -1){
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
</script>
</body>
</html>
`;

  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), blogIndexHtml, 'utf8');
  console.log(`Generated main blog directory: blog/index.html`);

  // 4. Generate CMS Studio (cms/index.html) -> relDepth = 1
  const cmsHtml = generateCMSPage(posts, authors);
  fs.writeFileSync(path.join(CMS_DIR, 'index.html'), cmsHtml, 'utf8');
  console.log(`Generated CMS studio: cms/index.html`);

  // 5. Generate Dynamic sitemap.xml
  const sitemapUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/blog/`, priority: '0.8', changefreq: 'daily' },
    ...posts.map(p => ({
      loc: `${SITE_URL}/blog/${p.slug}/`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: p.publishedAt
    })),
    ...authors.map(a => ({
      loc: `${SITE_URL}/author/${a.slug}/`,
      priority: '0.5',
      changefreq: 'monthly'
    }))
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml.trim() + '\n', 'utf8');
  console.log(`Generated dynamic sitemap: sitemap.xml (${sitemapUrls.length} URLs)`);

  // 6. Generate robots.txt
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /cms/
Disallow: /cms

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTxt, 'utf8');
  console.log(`Generated robots.txt: robots.txt`);

  console.log('--- Static Generation Complete ---');
}

if (require.main === module) {
  buildSite();
}

module.exports = { buildSite };
