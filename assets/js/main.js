/* Annie Super Store — v3 */
(function () {
  "use strict";
  var WA = "2347013420832";
  var DB = window.ANNIE_PRODUCTS || [];

  // stock state helpers
  var STATE_LABEL = { in: "In stock", low: "Low stock", out: "Out of stock" };
  function stLabel(p){ return STATE_LABEL[p.state] || "In stock"; }
  function stClass(p){ return p.state === "out" ? "st-out" : (p.state === "low" ? "st-low" : "st-in"); }

  /* nav scroll state (homepage only — category navs are static) */
  var nav = document.getElementById("nav");
  if (nav && !nav.classList.contains("nav--static")) {
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* scroll progress + back to top */
  var progress = document.getElementById("progress");
  var toTop = document.getElementById("toTop");
  window.addEventListener("scroll", function () {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (progress && max > 0) progress.style.width = (window.scrollY / max * 100) + "%";
    if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
  }, { passive: true });
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* mobile menu */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  function closeMenu() {
    if (!links) return;
    links.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function openMenu() {
    links.classList.add("open");
    toggle.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.contains("open") ? closeMenu() : openMenu();
    });
    links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMenu(); closeModal(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) closeMenu(); });
  }

  /* search core */
  function searchDB(q, cat) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return DB.filter(function (p) {
      var hit = (p.name + " " + p.desc + " " + p.catName).toLowerCase().indexOf(q) !== -1;
      return cat ? (hit && p.cat === cat) : hit;
    });
  }
  function waLink(p) {
    var msg = "Hello! \uD83D\uDC4B (Demo) I saw *" + p.name + "* on the Overal Stores demo site. Is it available?";
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
  }
  function hitRow(p, withStock) {
    var meta = p.catName + (withStock ? ' &middot; <em class="' + (p.state === "out" ? "outtxt" : (p.state === "low" ? "lowtxt" : "oktxt")) + '">' + stLabel(p) + "</em>" : "");
    return '<a class="nav__search-hit" href="' + p.page + '#p-' + p.id + '">' +
      '<span class="nav__search-hit-name">' + p.name + '</span>' +
      '<span class="nav__search-hit-meta">' + meta + '</span></a>';
  }

  /* menu global search */
  var menuSearch = document.getElementById("menuSearch");
  var menuResults = document.getElementById("menuSearchResults");
  if (menuSearch && menuResults) {
    menuSearch.addEventListener("input", function () {
      if (!menuSearch.value.trim()) { menuResults.hidden = true; menuResults.innerHTML = ""; return; }
      var hits = searchDB(menuSearch.value).slice(0, 6);
      menuResults.innerHTML = hits.length
        ? hits.map(function (p) { return hitRow(p, true); }).join("")
        : '<p class="nav__search-none">No products match.</p>';
      menuResults.hidden = false;
    });
  }

  /* category page: search + chips */
  var catSearch = document.getElementById("catSearch");
  var grid = document.getElementById("prodGrid");
  var chips = document.getElementById("chips");
  var emptyBox = document.getElementById("prodEmpty");
  var emptyQ = document.getElementById("emptyQ");
  var otherBox = document.getElementById("otherResults");
  var countEl = document.getElementById("catCount");
  var chipState = "all";

  if (grid) {
    var thisCat = grid.getAttribute("data-cat");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".prod"));
    var stateById = {};
    DB.forEach(function (p) { stateById[p.id] = p.state; });

    function applyFilters() {
      var q = catSearch ? catSearch.value : "";
      var hits = q.trim() ? searchDB(q, thisCat) : DB.filter(function (p) { return p.cat === thisCat; });
      var hitIds = {};
      hits.forEach(function (p) { hitIds[p.id] = true; });
      var shown = 0;
      cards.forEach(function (c) {
        var id = c.getAttribute("data-pid");
        var st = stateById[id] || "in";
        var ok = hitIds[id] &&
          (chipState === "all" || chipState === st);
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = (q.trim() || chipState !== "all") && shown ? shown + " shown" : "";

      if (!shown && q.trim()) {
        var others = searchDB(q).filter(function (p) { return p.cat !== thisCat; }).slice(0, 4);
        emptyQ.textContent = q;
        otherBox.innerHTML = others.length
          ? '<p class="prods__empty-sub">Found in other aisles:</p>' + others.map(function (p) { return hitRow(p, false); }).join("")
          : '<p class="prods__empty-sub">No matches anywhere &mdash; <a href="https://wa.me/' + WA + '" target="_blank" rel="noopener">ask us on WhatsApp</a>, we may still stock it.</p>';
        emptyBox.hidden = false;
      } else {
        emptyBox.hidden = true;
      }
    }
    if (catSearch) catSearch.addEventListener("input", applyFilters);
    if (chips) chips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      chipState = b.getAttribute("data-f");
      chips.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("chip--on", c === b); });
      applyFilters();
    });
  }

  /* product modal */
  var modal = document.getElementById("pmodal");
  function openModal(p) {
    if (!modal || !p) return;
    document.getElementById("pmCat").textContent = p.catName + " \u00b7 Aisle " + p.n;
    document.getElementById("pmTitle").textContent = p.name;
    document.getElementById("pmDesc").textContent = p.desc;
    document.getElementById("pmStock").textContent = stLabel(p);
    document.getElementById("pmDot").className = "prod__dot " + stClass(p);
    document.getElementById("pmImg").src = "assets/pics-vids/" + p.img;
    document.getElementById("pmImg").alt = p.name;
    document.getElementById("pmWa").href = waLink(p);
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("open"); });
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { modal.hidden = true; }, 300);
    if (location.hash.indexOf("#p-") === 0) history.replaceState(null, "", location.pathname);
  }
  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    document.addEventListener("click", function (e) {
      var card = e.target.closest && e.target.closest(".prod[data-pid]");
      if (card) {
        var p = DB.filter(function (x) { return x.id === card.getAttribute("data-pid"); })[0];
        openModal(p);
      }
    });
    if (location.hash.indexOf("#p-") === 0) {
      var id = location.hash.slice(3);
      var hit = DB.filter(function (x) { return x.id === id; })[0];
      if (hit) setTimeout(function () { openModal(hit); }, 350);
    }
  }

  /* parallax hero */
  var heroMedia = document.getElementById("heroMedia");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (heroMedia && !reduceMotion) {
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y < window.innerHeight) heroMedia.style.transform = "translateY(" + (y * 0.18) + "px)";
    }, { passive: true });
  }

  /* reveals + counters */
  document.querySelectorAll(".bento .tile").forEach(function (el, i) { el.style.setProperty("--i", i); });
  document.querySelectorAll(".prods__grid .prod").forEach(function (el, i) { el.style.setProperty("--i", i % 8); });
  document.querySelectorAll(".rev-rail .review").forEach(function (el, i) { el.style.setProperty("--i", i); });

  var revealEls = document.querySelectorAll(".section-head, .tile, .story__text, .story__media, .review, .visit__card, .contact__inner, .prod");
  revealEls.forEach(function (el) { el.classList.add("reveal"); });

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });

    var statsSection = document.getElementById("stats");
    if (statsSection) {
      var done = false;
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !done) {
            done = true;
            document.querySelectorAll(".stat__num[data-count]").forEach(countUp);
            so.disconnect();
          }
        });
      }, { threshold: 0.4 });
      so.observe(statsSection);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }
})();
