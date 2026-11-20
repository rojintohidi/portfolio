/* Rojin Tohidi — portfolio. Language, theme, subtle reveals and the image viewer. No dependencies. */
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------- language: English / Persian (mirrors the layout) ---------- */
  const i18n = [...document.querySelectorAll("[data-fa]")];
  i18n.forEach((el) => { el.dataset.en = el.innerHTML; });
  const themeBtn = document.querySelector("[data-theme-toggle]");
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : sysDark.matches);
  const L = {
    en: { dark: "Dark", light: "Light", toDark: "Switch to dark theme", toLight: "Switch to light theme", lang: "تغییر به فارسی" },
    fa: { dark: "تیره", light: "روشن", toDark: "تغییر به پوستهٔ تیره", toLight: "تغییر به پوستهٔ روشن", lang: "Switch to English" },
  };
  const t = () => L[root.lang === "fa" ? "fa" : "en"];
  function labelTheme() {
    if (!themeBtn) return;
    (themeBtn.querySelector(".tgl-t") || themeBtn).textContent = isDark() ? t().light : t().dark;
    themeBtn.setAttribute("aria-label", isDark() ? t().toLight : t().toDark);
  }
  function setLang(lang) {
    root.lang = lang; root.dir = lang === "fa" ? "rtl" : "ltr";
    i18n.forEach((el) => { el.innerHTML = lang === "fa" && el.dataset.fa ? el.dataset.fa : el.dataset.en; });
    document.querySelectorAll("[data-alt-fa]").forEach((im) => {
      if (!im.dataset.altEn) im.dataset.altEn = im.alt;
      im.alt = lang === "fa" && im.dataset.altFa ? im.dataset.altFa : im.dataset.altEn;
    });
    document.querySelectorAll("[data-fa-label]").forEach((el) => {
      if (el.dataset.enLabel === undefined) el.dataset.enLabel = el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", lang === "fa" ? el.dataset.faLabel : el.dataset.enLabel);
    });
    const btn = document.querySelector("[data-lang-toggle]");
    if (btn) { (btn.querySelector(".tgl-t") || btn).innerHTML = lang === "fa" ? "English" : '<span lang="fa">فارسی</span>'; btn.setAttribute("aria-label", t().lang); }
    labelTheme();
    store.set("lang", lang);
  }
  document.querySelector("[data-lang-toggle]")?.addEventListener("click", () => setLang(root.lang === "fa" ? "en" : "fa"));
  setLang(store.get("lang") === "fa" ? "fa" : "en");

  /* ---------- theme ---------- */
  themeBtn?.addEventListener("click", () => { root.dataset.theme = isDark() ? "light" : "dark"; store.set("theme", root.dataset.theme); labelTheme(); });
  sysDark.addEventListener?.("change", labelTheme);

  /* ---------- subtle reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce()) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ---------- image viewer: full-size, uncropped, grouped per project ---------- */
  (() => {
    const triggers = [...document.querySelectorAll("a[data-lb]")];
    if (!triggers.length) return;
    const V = {
      en: { close: "Close", prev: "Previous image", next: "Next image", zoom: "Actual size", fit: "Fit to screen", viewer: "Image viewer", of: "of" },
      fa: { close: "بستن", prev: "تصویر قبلی", next: "تصویر بعدی", zoom: "اندازهٔ واقعی", fit: "اندازهٔ صفحه", viewer: "نمایشگر تصویر", of: "از" },
    };
    const dlg = document.createElement("dialog");
    dlg.className = "lb";
    dlg.innerHTML = `
      <div class="lb-bar"><span class="lb-count" aria-live="polite"></span>
        <span class="lb-tools"><button type="button" class="lb-zoom"></button><button type="button" class="lb-close"><span class="lb-close-t"></span> <svg class="ic" aria-hidden="true" focusable="false"><use href="#i-close"/></svg></button></span></div>
      <div class="lb-stage"><img class="lb-img" alt=""><span class="lb-spin" aria-hidden="true"></span></div>
      <button type="button" class="lb-nav lb-prev"><svg class="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-right"/></svg></button>
      <button type="button" class="lb-nav lb-next"><svg class="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-right"/></svg></button>
      <p class="lb-cap"></p>`;
    document.body.appendChild(dlg);
    const $ = (c) => dlg.querySelector(c);
    const img = $(".lb-img"), stage = $(".lb-stage"), cap = $(".lb-cap"), count = $(".lb-count");
    const prevB = $(".lb-prev"), nextB = $(".lb-next"), zoomB = $(".lb-zoom"), closeB = $(".lb-close");
    let group = [], idx = 0, opener = null, swiped = false;
    const v = () => V[root.lang === "fa" ? "fa" : "en"];
    const groupOf = (name) => { const seen = new Set(); return triggers.filter((a) => a.dataset.lb === name && !seen.has(a.getAttribute("href")) && seen.add(a.getAttribute("href"))); };
    const setZoom = (on) => {
      dlg.classList.toggle("zoomed", on);
      zoomB.textContent = on ? v().fit : v().zoom;
      zoomB.setAttribute("aria-pressed", on ? "true" : "false");
      if (!on) stage.scrollTo(0, 0);
    };
    const show = (i) => {
      idx = (i + group.length) % group.length;
      const a = group[idx], th = a.querySelector("img");
      setZoom(false);
      dlg.classList.add("loading");
      img.onload = img.onerror = () => dlg.classList.remove("loading");
      img.src = a.getAttribute("href");
      img.alt = th ? th.alt : (a.dataset.cap || "");
      const c = root.lang === "fa" && a.dataset.capFa ? a.dataset.capFa : (a.dataset.cap || "");
      cap.textContent = c; cap.hidden = !c;
      const many = group.length > 1;
      prevB.hidden = nextB.hidden = !many;
      count.textContent = many ? `${(idx + 1).toLocaleString(root.lang === "fa" ? "fa-IR" : "en")} ${v().of} ${group.length.toLocaleString(root.lang === "fa" ? "fa-IR" : "en")}` : "";
      if (many) [group[(idx + 1) % group.length], group[(idx - 1 + group.length) % group.length]].forEach((n) => { const p = new Image(); p.src = n.getAttribute("href"); });
      if (!reduce()) { img.classList.remove("swap"); void img.offsetWidth; img.classList.add("swap"); }
    };
    const open = (a) => {
      opener = a; group = groupOf(a.dataset.lb);
      dlg.setAttribute("aria-label", v().viewer);
      $(".lb-close-t").textContent = v().close;
      prevB.setAttribute("aria-label", v().prev); nextB.setAttribute("aria-label", v().next);
      show(group.findIndex((g) => g.getAttribute("href") === a.getAttribute("href")));
      dlg.showModal(); root.classList.add("lb-open");
      closeB.focus();
    };
    const close = () => { if (dlg.open) dlg.close(); };
    dlg.addEventListener("close", () => { root.classList.remove("lb-open"); img.removeAttribute("src"); if (opener) opener.focus(); });
    triggers.forEach((a) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault(); open(a);
    }));
    closeB.addEventListener("click", close);
    prevB.addEventListener("click", () => show(idx - 1));
    nextB.addEventListener("click", () => show(idx + 1));
    zoomB.addEventListener("click", () => setZoom(!dlg.classList.contains("zoomed")));
    img.addEventListener("click", () => setZoom(!dlg.classList.contains("zoomed")));
    dlg.addEventListener("click", (e) => { if (swiped) { swiped = false; return; } if (e.target === dlg || e.target === stage) close(); });
    dlg.addEventListener("keydown", (e) => {
      if (group.length < 2) return;
      const rtl = root.dir === "rtl";
      if (e.key === "ArrowRight") { e.preventDefault(); show(idx + (rtl ? -1 : 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(idx + (rtl ? 1 : -1)); }
    });
    // touch: swipe sideways to browse, swipe down to close (not while zoomed, so the image can be panned)
    let sx = null, sy = 0;
    stage.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" && !dlg.classList.contains("zoomed")) { sx = e.clientX; sy = e.clientY; } });
    stage.addEventListener("pointerup", (e) => {
      if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) swiped = true;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && group.length > 1) { const fwd = dx < 0; show(idx + ((root.dir === "rtl" ? !fwd : fwd) ? 1 : -1)); }
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    });
  })();

  /* ---------- Breath loop: plays muted while on screen; never autoplays under reduced motion ---------- */
  document.querySelectorAll("[data-loop]").forEach((v) => {
    const btn = v.parentElement.querySelector("[data-loop-toggle]");
    const lab = () => (root.lang === "fa" ? { play: "پخش", pause: "توقف" } : { play: "Play", pause: "Pause" });
    let userPaused = reduce();
    const sync = () => { if (!btn) return; const playing = !v.paused; (btn.querySelector(".tgl-t") || btn).textContent = playing ? lab().pause : lab().play; btn.dataset.state = playing ? "playing" : "paused"; };
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => sync()); };
    v.addEventListener("play", sync); v.addEventListener("pause", sync);
    btn?.addEventListener("click", () => { if (v.paused) { userPaused = false; tryPlay(); } else { userPaused = true; v.pause(); } });
    document.querySelector("[data-lang-toggle]")?.addEventListener("click", () => setTimeout(sync));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { if (e.isIntersecting && !userPaused) tryPlay(); else if (!e.isIntersecting) v.pause(); }, { threshold: 0.35 }).observe(v);
    } else if (!userPaused) tryPlay();
    sync();
  });

  /* ---------- project cards: a click anywhere on the image opens the project (the title link stays the keyboard target) ---------- */
  document.querySelectorAll(".feature").forEach((f) => {
    const link = f.querySelector("h3 a"), media = f.querySelector(".feature-media");
    if (!link || !media) return;
    media.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) window.open(link.href, "_blank", "noopener");
      else link.click();
    });
  });

  /* ---------- pointer extras: a "View" disc over project images, a floating preview on the archive index.
     Mouse and trackpad only, never under reduced motion; both are decorative (aria-hidden). ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce()) {
    const follower = (el) => {
      let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      const tick = () => {
        x += (tx - x) * 0.2; y += (ty - y) * 0.2;
        el.style.transform = `translate(${x}px, ${y}px)`;
        raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(tick) : 0;
      };
      return (e, snap) => { tx = e.clientX; ty = e.clientY; if (snap) { x = tx; y = ty; } if (!raf) raf = requestAnimationFrame(tick); };
    };
    // a tag in the project's own colour: its number and "Open project" / "Open study"
    const disc = document.createElement("div");
    disc.className = "cursor-tag"; disc.setAttribute("aria-hidden", "true");
    disc.innerHTML = '<span class="ct-no"></span><span class="ct-t"></span><svg class="ic" aria-hidden="true" focusable="false"><use href="#i-arrow-right"/></svg>';
    document.body.appendChild(disc);
    const moveDisc = follower(disc);
    const show = (e, host, no, kind) => {
      const cs = getComputedStyle(host);
      disc.style.setProperty("--tag", cs.getPropertyValue("--accent-v").trim() || "#2b3fd6");
      disc.classList.toggle("dark-text", host.matches(".t-saffron"));
      disc.querySelector(".ct-no").textContent = no;
      disc.querySelector(".ct-t").textContent = root.lang === "fa" ? (kind === "study" ? "دیدن طرح" : "دیدن پروژه") : (kind === "study" ? "Open study" : "Open project");
      moveDisc(e, true); disc.classList.add("on");
    };
    document.querySelectorAll(".feature").forEach((f) => {
      const media = f.querySelector(".feature-media"); if (!media) return;
      const no = () => (f.querySelector(".feature-no")?.textContent || "").trim();
      f.addEventListener("pointermove", (e) => {
        const r = media.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !e.target.closest("button");
        if (inside && !disc.classList.contains("on")) show(e, f, no(), "project");
        else if (!inside) disc.classList.remove("on");
        if (inside) moveDisc(e);
      });
      f.addEventListener("pointerleave", () => disc.classList.remove("on"));
    });
    document.querySelectorAll(".st-tile").forEach((tile, k) => {
      const no = () => (k + 1).toLocaleString(root.lang === "fa" ? "fa-IR" : "en", { minimumIntegerDigits: 2 });
      tile.addEventListener("pointerenter", (e) => show(e, tile, no(), "study"));
      tile.addEventListener("pointermove", (e) => moveDisc(e));
      tile.addEventListener("pointerleave", () => disc.classList.remove("on"));
    });
    window.addEventListener("scroll", () => disc.classList.remove("on"), { passive: true });

    const rows = document.querySelectorAll(".index a[data-preview]");
    if (rows.length) {
      const pv = document.createElement("img");
      pv.className = "ix-preview"; pv.alt = ""; pv.setAttribute("aria-hidden", "true"); pv.decoding = "async"; document.body.appendChild(pv);
      const movePv = follower(pv);
      rows.forEach((a) => {
        a.addEventListener("pointerenter", (e) => { pv.src = a.dataset.preview; movePv(e, true); pv.classList.add("on"); });
        a.addEventListener("pointermove", (e) => movePv(e));
        a.addEventListener("pointerleave", () => pv.classList.remove("on"));
      });
      window.addEventListener("scroll", () => pv.classList.remove("on"), { passive: true });
    }
  }

  const y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
})();
