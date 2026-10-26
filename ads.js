/**
 * Ebook Buddy - Google AdSense Seamless Integration
 * Client: ca-pub-6130384188487467
 *
 * Slots configured:
 *  - Slot 1 (Hero / Under 3-step cards):
 *      Desktop (728x90): 4369386116
 *      Mobile  (320x90): 8117059432
 *  - Slot 2 (Top / Above stage workspace):
 *      Desktop (728x90): 3056304442
 *      Mobile  (320x90): 6229262699
 *  - Slot 3 (Bottom / Below stage workspace):
 *      Desktop (728x90): 9246930392
 *      Mobile  (320x90): 5231663766
 *
 * How to use on current or future pages:
 * 1. Include in the <head>:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6130384188487467" crossorigin="anonymous"></script>
 *    <script src="ads.js" defer></script>
 *
 * 2. Add an ad container anywhere in <body>:
 *    <!-- Using predefined slot 1, 2, or 3 -->
 *    <div class="ad-slot-wrap" data-ad-slot-num="1"></div>
 *    <div class="ad-slot-wrap" data-ad-slot-num="2"></div>
 *    <div class="ad-slot-wrap" data-ad-slot-num="3"></div>
 *
 *    <!-- Or using custom slot IDs -->
 *    <div class="ad-slot-wrap" data-ad-slot-desk="4369386116" data-ad-slot-mob="8117059432"></div>
 *
 *    <!-- Or using semantic IDs -->
 *    <div class="ad-slot-wrap" id="ad-hero"></div>
 *    <div class="ad-slot-wrap" id="ad-top"></div>
 *    <div class="ad-slot-wrap" id="ad-bottom"></div>
 */

(function (window, document) {
  "use strict";

  var AD_CLIENT = "ca-pub-6130384188487467";
  var AD_REFRESH_SEC = 35;
  var DESKTOP_BP = 768;

  // Predefined Ad Slots
  var AD_SLOTS = {
    1: { desk: "4369386116", mob: "8117059432", name: "Ebook-buddy 1" },
    2: { desk: "3056304442", mob: "6229262699", name: "Ebook-buddy 2" },
    3: { desk: "9246930392", mob: "5231663766", name: "Ebook-buddy 3" },
    "ad-1": { desk: "4369386116", mob: "8117059432" },
    "ad-hero": { desk: "4369386116", mob: "8117059432" },
    "ad-2": { desk: "3056304442", mob: "6229262699" },
    "ad-top": { desk: "3056304442", mob: "6229262699" },
    "ad-3": { desk: "9246930392", mob: "5231663766" },
    "ad-bottom": { desk: "9246930392", mob: "5231663766" }
  };

  // Ensure default CSS exists for ad slot containers
  function injectStyles() {
    if (document.getElementById("ebookbuddy-ads-css")) return;
    var style = document.createElement("style");
    style.id = "ebookbuddy-ads-css";
    style.textContent =
      ".ad-slot-wrap{" +
      "display:flex;justify-content:center;align-items:center;" +
      "margin:14px auto;text-align:center;min-height:90px;" +
      "overflow:hidden;clear:both;width:100%;max-width:760px;" +
      "scroll-margin-top:105px;" +
      "}" +
      ".ad-slot-wrap ins.adsbygoogle{" +
      "display:inline-block!important;" +
      "}";
    document.head.appendChild(style);
  }

  // Resolve slot ID for a container element
  function resolveSlot(el, isDesk) {
    if (!el) return null;

    // 1. Direct explicit data attributes
    var deskSlot = el.getAttribute("data-ad-slot-desk");
    var mobSlot = el.getAttribute("data-ad-slot-mob");
    if (isDesk && deskSlot) return deskSlot;
    if (!isDesk && mobSlot) return mobSlot;
    if (deskSlot && !mobSlot) return deskSlot;

    // 2. Predefined slot number attribute: data-ad-slot-num="1|2|3" or data-ad-id="1|2|3"
    var slotNum = el.getAttribute("data-ad-slot-num") || el.getAttribute("data-ad-id");
    if (slotNum && AD_SLOTS[slotNum]) {
      return isDesk ? AD_SLOTS[slotNum].desk : AD_SLOTS[slotNum].mob;
    }

    // 3. Fallback by element ID (e.g., id="ad-hero", id="ad-top", id="ad-bottom")
    if (el.id && AD_SLOTS[el.id]) {
      return isDesk ? AD_SLOTS[el.id].desk : AD_SLOTS[el.id].mob;
    }

    // 4. Generic single data-ad-slot
    var genSlot = el.getAttribute("data-ad-slot");
    if (genSlot) return genSlot;

    return null;
  }

  // Render or re-render an ad in the given container
  function renderAd(target) {
    var el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;

    var isDesk = window.innerWidth >= DESKTOP_BP;
    var slotId = resolveSlot(el, isDesk);
    if (!slotId) return;

    var width = isDesk ? 728 : 320;
    var height = 90;

    // Clear previous ad element
    el.innerHTML = "";

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "inline-block";
    ins.style.width = width + "px";
    ins.style.height = height + "px";
    ins.setAttribute("data-ad-client", AD_CLIENT);
    ins.setAttribute("data-ad-slot", slotId);

    el.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ignore push errors (e.g. ad blockers or duplicate pushes)
    }
  }

  // Refresh all ad slots on the page
  function refreshAds() {
    if (document.hidden) return;

    var targets = document.querySelectorAll(
      ".ad-slot-wrap, [data-ad-slot-desk], [data-ad-slot-num], #ad-hero, #ad-top, #ad-bottom"
    );

    var seen = [];
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      if (seen.indexOf(el) === -1) {
        seen.push(el);
        renderAd(el);
      }
    }
  }

  var adTimer = null;
  var lastIsDesk = window.innerWidth >= DESKTOP_BP;
  var resizeAdTimer = null;

  function initAds() {
    injectStyles();
    refreshAds();

    if (adTimer) clearInterval(adTimer);
    adTimer = setInterval(refreshAds, AD_REFRESH_SEC * 1000);
  }

  // Listeners
  window.addEventListener("resize", function () {
    clearTimeout(resizeAdTimer);
    resizeAdTimer = setTimeout(function () {
      var nowDesk = window.innerWidth >= DESKTOP_BP;
      if (nowDesk !== lastIsDesk) {
        lastIsDesk = nowDesk;
        refreshAds();
      }
    }, 300);
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      refreshAds();
    }
  });

  // Auto-init when document is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAds);
  } else {
    initAds();
  }

  // Expose globally
  window.renderAd = renderAd;
  window.refreshAds = refreshAds;
  window.initAds = initAds;
  window.EbookBuddyAds = {
    client: AD_CLIENT,
    slots: AD_SLOTS,
    renderAd: renderAd,
    refreshAds: refreshAds,
    initAds: initAds
  };
})(window, document);
