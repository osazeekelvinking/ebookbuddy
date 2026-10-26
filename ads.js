/**
 * EbookBuddy - Google AdSense Seamless Integration
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
 *  - Slot Footer (Page bottom / Above footer):
 *      Multiplex (Autorelaxed): 3385897927
 *
 * Features:
 *  - Subtle/tiny "Advertisement" label above all ad slots.
 *  - Automatic collapse when ads don't render (unfilled, blocked, or timed out),
 *    eliminating awkward blank empty spaces completely.
 *  - Policy Compliant: No background timer auto-refresh. Ads refresh only upon
 *    user-initiated navigation (clicking stage tabs/chips or next/prev buttons),
 *    acting like natural page loads in this Single Page Application.
 *  - Works seamlessly across all current and future pages.
 */

(function (window, document) {
  "use strict";

  var AD_CLIENT = "ca-pub-6130384188487467";
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
    "ad-bottom": { desk: "9246930392", mob: "5231663766" },
    "ad-footer": { slot: "3385897927", format: "autorelaxed", name: "Ebook-buddy Footer" },
    "footer": { slot: "3385897927", format: "autorelaxed", name: "Ebook-buddy Footer" }
  };

  // Ensure default CSS exists for ad slot containers, labels, and collapse state
  function injectStyles() {
    if (document.getElementById("ebookbuddy-ads-css")) return;
    var style = document.createElement("style");
    style.id = "ebookbuddy-ads-css";
    style.textContent =
      ".ad-slot-wrap{" +
      "display:flex;flex-direction:column;justify-content:center;align-items:center;" +
      "margin:14px auto;text-align:center;min-height:105px;" +
      "overflow:hidden;clear:both;width:100%;max-width:760px;" +
      "scroll-margin-top:105px;" +
      "}" +
      ".ad-slot-wrap.ad-autorelaxed{" +
      "min-height:140px;max-width:100%;margin:18px auto 14px;" +
      "}" +
      ".ad-label{" +
      "display:block;font-size:10px;font-weight:600;letter-spacing:0.08em;" +
      "text-transform:uppercase;color:var(--mute,#6B6B78);opacity:0.7;" +
      "margin:0 auto 4px;line-height:1;text-align:center;user-select:none;" +
      "}" +
      ".ad-slot-wrap ins.adsbygoogle{" +
      "display:inline-block!important;" +
      "}" +
      ".ad-slot-wrap.ad-autorelaxed ins.adsbygoogle{" +
      "display:block!important;width:100%!important;min-height:120px;" +
      "}" +
      ".ad-slot-wrap.ad-collapsed," +
      ".ad-slot-wrap:has(ins[data-ad-status='unfilled']){" +
      "display:none!important;min-height:0!important;height:0!important;" +
      "margin:0!important;padding:0!important;" +
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

    // 2. Predefined slot number attribute: data-ad-slot-num="1|2|3|footer" or data-ad-id="1|2|3|footer"
    var slotNum = el.getAttribute("data-ad-slot-num") || el.getAttribute("data-ad-id");
    if (slotNum && AD_SLOTS[slotNum]) {
      if (AD_SLOTS[slotNum].slot) return AD_SLOTS[slotNum].slot;
      return isDesk ? AD_SLOTS[slotNum].desk : AD_SLOTS[slotNum].mob;
    }

    // 3. Fallback by element ID (e.g., id="ad-hero", id="ad-top", id="ad-bottom", id="ad-footer")
    if (el.id && AD_SLOTS[el.id]) {
      if (AD_SLOTS[el.id].slot) return AD_SLOTS[el.id].slot;
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

    var slotNum = el.getAttribute("data-ad-slot-num") || el.getAttribute("data-ad-id");
    var slotConfig = (slotNum && AD_SLOTS[slotNum]) || (el.id && AD_SLOTS[el.id]);
    var isAutorelaxed =
      el.getAttribute("data-ad-format") === "autorelaxed" ||
      el.classList.contains("ad-autorelaxed") ||
      (slotConfig && slotConfig.format === "autorelaxed");

    var width = isDesk ? 728 : 320;
    var height = 90;

    // Uncollapse container when preparing new ad
    el.classList.remove("ad-collapsed");
    el.innerHTML = "";

    // Add subtle/tiny label above ad slot
    var label = document.createElement("span");
    label.className = "ad-label";
    label.textContent = "Advertisement";
    el.appendChild(label);

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    if (isAutorelaxed) {
      ins.style.display = "block";
      ins.setAttribute("data-ad-format", "autorelaxed");
    } else {
      ins.style.display = "inline-block";
      ins.style.width = width + "px";
      ins.style.height = height + "px";
    }
    ins.setAttribute("data-ad-client", AD_CLIENT);
    ins.setAttribute("data-ad-slot", slotId);
    el.appendChild(ins);

    var adLoaded = false;
    var collapseTimer = null;
    var observer = null;

    function markLoaded() {
      if (adLoaded) return;
      adLoaded = true;
      el.classList.remove("ad-collapsed");
      if (collapseTimer) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
      }
      if (observer) {
        observer.disconnect();
      }
    }

    function checkAdLoaded() {
      if (adLoaded) return true;
      var status = ins.getAttribute("data-ad-status");
      var gStatus = ins.getAttribute("data-adsbygoogle-status");
      var hasIframe = ins.getElementsByTagName("iframe").length > 0;
      var hasContent = ins.children.length > 0 && ins.offsetHeight > 20;

      if (status === "filled" || gStatus === "done" || hasIframe || hasContent) {
        markLoaded();
        return true;
      }
      return false;
    }

    function collapseAd() {
      if (adLoaded) return; // NEVER collapse if ad has loaded!
      var isTopAd = el.id === "ad-top";
      var wasInLayout = !el.classList.contains("ad-collapsed") && el.offsetHeight > 0;
      el.classList.add("ad-collapsed");
      if (isTopAd && wasInLayout && typeof window.snapToStageHeader === "function") {
        window.snapToStageHeader(true);
      }
    }

    // 1. MutationObserver watching for status changes or DOM insertion
    if (window.MutationObserver) {
      observer = new window.MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === "attributes" && m.attributeName === "data-ad-status") {
            if (ins.getAttribute("data-ad-status") === "unfilled") {
              if (!adLoaded) {
                collapseAd();
                if (observer) observer.disconnect();
              }
              return;
            } else if (ins.getAttribute("data-ad-status") === "filled") {
              markLoaded();
              return;
            }
          }
        }
        checkAdLoaded();
      });
      observer.observe(ins, { attributes: true, childList: true, subtree: true });
    }

    // 2. Safety timeout for ad blockers or completely dead requests (15 seconds)
    collapseTimer = setTimeout(function () {
      if (!checkAdLoaded()) {
        collapseAd();
      }
    }, 15000);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // If push throws an error, collapse
      collapseAd();
    }
  }

  // Refresh all ad slots on the page (called on user navigation, e.g. clicking stage tabs)
  function refreshAds() {
    if (document.hidden) return;

    var targets = document.querySelectorAll(
      ".ad-slot-wrap, [data-ad-slot-desk], [data-ad-slot-num], #ad-hero, #ad-top, #ad-bottom, #ad-footer"
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

  var lastIsDesk = window.innerWidth >= DESKTOP_BP;
  var resizeAdTimer = null;

  function initAds() {
    injectStyles();
    refreshAds();
  }

  // Responsive breakpoint listener (desktop <-> mobile re-alignment)
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
