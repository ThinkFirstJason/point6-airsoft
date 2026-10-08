(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Header state ---------- */
  const topbar = $("#topbar");
  const hero = $(".hero");
  const onScroll = () => {
    const threshold = hero ? hero.offsetHeight * 0.7 : 80;
    topbar.classList.toggle("is-scrolled", window.scrollY > threshold);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const mobileMenu = $("#mobile-menu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
    topbar.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !mobileMenu.hidden) setMenu(false); });

  /* ---------- Operations: past / next / countdown ---------- */
  const now = Date.now();
  const ops = $$("#ops-list .op").map((el) => ({
    el,
    start: Date.parse(el.dataset.start),
    end: Date.parse(el.dataset.end),
    title: $("h3", el).textContent.trim(),
  }));

  ops.forEach((op) => {
    const status = $("[data-status]", op.el);
    if (op.end < now) { op.el.classList.add("is-past"); status.textContent = "Complete"; }
    else if (op.start <= now) { status.textContent = "Live now"; }
  });

  // Upcoming ops first (soonest at top), completed ones after (most recent first).
  const list = $("#ops-list");
  const upcoming = ops.filter((o) => o.end >= now).sort((a, b) => a.start - b.start);
  const past = ops.filter((o) => o.end < now).sort((a, b) => b.start - a.start);
  [...upcoming, ...past].forEach((o) => list.appendChild(o.el));

  const next = upcoming[0];
  const hud = $(".hero__hud");
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/New_York" });
  const hhmm = (t) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" }).format(t).replace(":", "");

  if (!next) {
    hud.classList.add("is-tba");
    $("[data-next-title]").textContent = "Next op: TBA";
    $("[data-next-meta]").textContent = "Watch Facebook for the drop";
  } else {
    next.el.classList.add("is-next");
    $("[data-next-title]").textContent = next.title;
    const parts = fmt.formatToParts(next.start);
    const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
    $("[data-next-meta]").textContent = `${get("weekday")} ${get("day")} ${get("month")} · ${hhmm(next.start)}–${hhmm(next.end)}`.toUpperCase();

    const cd = Object.fromEntries($$("[data-cd]").map((n) => [n.dataset.cd, n]));
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      let diff = next.start - Date.now();
      if (diff <= 0) {
        $("[data-countdown]").innerHTML = '<span><b>LIVE</b>&nbsp;ON THE FIELD NOW</span>';
        return true;
      }
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      const s = Math.floor(diff / 1e3);
      cd.d.textContent = pad(d); cd.h.textContent = pad(h); cd.m.textContent = pad(m); cd.s.textContent = pad(s);
      return false;
    };
    if (!tick()) { const id = setInterval(() => { if (tick()) clearInterval(id); }, 1000); }
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".topbar__nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => navIO.observe(s));

    /* ---------- Reveal on scroll ---------- */
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 4) * 60, 180)}ms`;
      io.observe(el);
    });
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  }

  $("[data-year]").textContent = new Date().getFullYear();
})();
