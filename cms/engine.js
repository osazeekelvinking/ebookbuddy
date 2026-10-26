/**
 * EbookBuddy Blog & CMS Shared Engine
 * Auto-linking engine, related posts matcher, reading-time calculation, and slug generator.
 * Runs seamlessly in both Node.js and Browser environments.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EbookBuddyEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Converts a title string to a clean URL-friendly slug
   */
  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Calculates estimated reading time for given HTML or Markdown text
   */
  function calculateReadingTime(text) {
    var clean = String(text || "").replace(/<[^>]+>/g, " ").trim();
    var words = clean ? clean.split(/\s+/).length : 0;
    var minutes = Math.max(1, Math.ceil(words / 200));
    return minutes + " min read";
  }

  /**
   * Escape string for safe regular expression matching
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Automatically links relevant keywords in the HTML content to other blog posts.
   * Rules:
   *  - Skips text already inside <a> tags, headings (h1-h6), and code blocks (code, pre).
   *  - Links only the first occurrence of each keyword per article.
   *  - Matches longer keyword phrases first to avoid greedy substring collisions.
   *  - Generates clean extensionless URLs (/blog/[slug]).
   *
   * @param {string} htmlContent - The raw HTML of the article body.
   * @param {string} currentSlug - The slug of the current post (to avoid self-linking).
   * @param {Array} allPosts - Array of all post objects.
   * @returns {string} The transformed HTML with injected links.
   */
  function autoLinkContent(htmlContent, currentSlug, allPosts) {
    if (!htmlContent || !Array.isArray(allPosts)) return htmlContent || "";

    // Build dictionary of candidate keywords to target posts
    var candidateKeywords = [];
    var usedSlugs = {};
    usedSlugs[currentSlug] = true;

    allPosts.forEach(function (post) {
      if (!post || post.slug === currentSlug) return;

      var targetSlug = post.slug;
      var targetTitle = (post.title || "").trim();

      // Add full title as candidate if reasonably distinct
      if (targetTitle.length >= 4) {
        candidateKeywords.push({
          phrase: targetTitle,
          slug: targetSlug,
          priority: targetTitle.length * 2
        });
      }

      // Add explicit keywords defined in post.keywords
      if (Array.isArray(post.keywords)) {
        post.keywords.forEach(function (kw) {
          var cleanKw = String(kw || "").trim();
          if (cleanKw.length >= 3) {
            candidateKeywords.push({
              phrase: cleanKw,
              slug: targetSlug,
              priority: cleanKw.length
            });
          }
        });
      }
    });

    // Sort by priority (longest phrase first)
    candidateKeywords.sort(function (a, b) {
      return b.priority - a.priority;
    });

    // Filter duplicate phrases
    var uniqueCandidates = [];
    var seenPhrases = {};
    candidateKeywords.forEach(function (item) {
      var norm = item.phrase.toLowerCase();
      if (!seenPhrases[norm]) {
        seenPhrases[norm] = true;
        uniqueCandidates.push(item);
      }
    });

    // Tokenize HTML into tags and text segments to safely avoid editing inside <a>, <h1-6>, <pre>, <code>
    var tagRegex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*)?>/g;
    var tokens = [];
    var lastIndex = 0;
    var match;

    while ((match = tagRegex.exec(htmlContent)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: "text",
          content: htmlContent.substring(lastIndex, match.index)
        });
      }
      tokens.push({
        type: "tag",
        raw: match[0],
        tagName: match[1].toLowerCase(),
        isClosing: match[0].charAt(1) === "/"
      });
      lastIndex = tagRegex.lastIndex;
    }
    if (lastIndex < htmlContent.length) {
      tokens.push({
        type: "text",
        content: htmlContent.substring(lastIndex)
      });
    }

    // Process text tokens while tracking active protected tags
    var forbiddenDepth = {
      a: 0,
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
      code: 0,
      pre: 0
    };

    var linkedSlugsInThisPost = {};

    tokens.forEach(function (token) {
      if (token.type === "tag") {
        var tag = token.tagName;
        if (forbiddenDepth.hasOwnProperty(tag)) {
          if (token.isClosing) {
            forbiddenDepth[tag] = Math.max(0, forbiddenDepth[tag] - 1);
          } else if (!token.raw.endsWith("/>")) {
            forbiddenDepth[tag]++;
          }
        }
        return;
      }

      // Check if inside any protected element
      var isProtected = false;
      for (var f in forbiddenDepth) {
        if (forbiddenDepth[f] > 0) {
          isProtected = true;
          break;
        }
      }
      if (isProtected) return;

      // Attempt to link candidates that have not been linked yet
      uniqueCandidates.forEach(function (candidate) {
        if (linkedSlugsInThisPost[candidate.slug]) return;

        // Word boundary regex
        var pattern = new RegExp("\\b(" + escapeRegExp(candidate.phrase) + ")\\b", "i");
        var m = pattern.exec(token.content);
        if (m) {
          var matchedText = m[1];
          var linkHtml = '<a class="post-auto-link" href="/blog/' + candidate.slug + '">' + matchedText + '</a>';
          token.content = token.content.substring(0, m.index) + linkHtml + token.content.substring(m.index + matchedText.length);
          linkedSlugsInThisPost[candidate.slug] = true;
        }
      });
    });

    // Reassemble HTML
    var result = "";
    tokens.forEach(function (token) {
      result += token.type === "tag" ? token.raw : token.content;
    });

    return result;
  }

  /**
   * Recommends related posts for a given article
   * @param {Object} currentPost - Current post object
   * @param {Array} allPosts - All posts
   * @param {number} limit - Maximum number of related posts to return (default: 2)
   * @returns {Array} List of related post objects
   */
  function getRelatedPosts(currentPost, allPosts, limit) {
    if (!currentPost || !Array.isArray(allPosts)) return [];
    var maxLimit = limit || 2;
    var currentSlug = currentPost.slug;
    var currentCategory = (currentPost.category || "").toLowerCase();
    var currentTags = Array.isArray(currentPost.tags) ? currentPost.tags.map(function (t) { return t.toLowerCase(); }) : [];

    var scored = allPosts
      .filter(function (p) {
        return p && p.slug !== currentSlug;
      })
      .map(function (candidate) {
        var score = 0;
        // Same category gives +3
        if (candidate.category && candidate.category.toLowerCase() === currentCategory) {
          score += 3;
        }
        // Matching tags give +2 each
        if (Array.isArray(candidate.tags)) {
          candidate.tags.forEach(function (t) {
            if (currentTags.indexOf(t.toLowerCase()) !== -1) {
              score += 2;
            }
          });
        }
        // Same author gives +1
        if (candidate.authorId && candidate.authorId === currentPost.authorId) {
          score += 1;
        }
        return { post: candidate, score: score };
      });

    // Sort by score descending, then by publication date descending
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var dateA = new Date(a.post.publishedAt || 0).getTime();
      var dateB = new Date(b.post.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    return scored.slice(0, maxLimit).map(function (item) {
      return item.post;
    });
  }

  return {
    slugify: slugify,
    calculateReadingTime: calculateReadingTime,
    autoLinkContent: autoLinkContent,
    getRelatedPosts: getRelatedPosts
  };
});
