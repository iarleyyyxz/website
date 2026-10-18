(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer:fine)").matches;

  // Optional: set your restricted YouTube Data API v3 key here.
  // Restrict the key by your website domain in Google Cloud Console.
  const YOUTUBE_API_KEY = "AIzaSyAMylMSlXArbZVmWOFBHAMwwB7WgQrUP2g";

  const portfolioVideos = [
    { id: "SOAxJ7F1R_8", type: "long" },
    { id: "8Fg0LSk1pmY", type: "long" },
    { id: "5OUJnLcb6lI", type: "long" },
    { id: "vEqPxgzor2Y", type: "long" },
    { id: "xkB_XB-XIIg", type: "long" },
    { id: "DRIFpDfwA9k", type: "long" },
    { id: "1wDBGx-JlHs", type: "long" },
    { id: "_G4I8Jvd3jU", type: "long" },
    { id: "NmHEMBcHlx0", type: "long" },
    { id: "iArBNx0_SVw", type: "long" },
    { id: "TzDF9J_hOm8", type: "long" },
    { id: "nactHjNF55A", type: "long" },
    { id: "roQ-9guBwnI", type: "long" },
    { id: "w040lMC3JjY", type: "long" },
    { id: "aq-MbU3zF9o", type: "long" },
    { id: "NY8gdYAH-BU", type: "long" },
    { id: "p-lLAU-Nl4U", type: "shorts" },
    { id: "htkc2gO0IjE", type: "shorts" },
    { id: "Dy0W0_Xd-RA", type: "shorts" },
    { id: "J23Q5N3gK9A", type: "shorts" }
  ];

  // Cursor glow
  const glow = document.getElementById("cursorGlow");
  if (glow && finePointer && !reduceMotion) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const tick = () => {
      x += (tx - x) * 0.11;
      y += (ty - y) * 0.11;
      glow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  // Gentle 3D hover tilt.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt-card").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${py * -3.8}deg) rotateY(${px * 4.4}deg) translateY(-5px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  // Portfolio switcher: Long-form, Shorts and Motion graphics.
  const workTabs = [...document.querySelectorAll(".work-tab")];
  const navWorkTabs = [...document.querySelectorAll(".nav a[data-work-tab]")];
  const longView = document.getElementById("longFormGrid");
  const shortsView = document.getElementById("shortsGrid");
  const motionSection = document.getElementById("motions");

  const setWorkView = type => {
    const shorts = type === "shorts";
    const motions = type === "motions";
    if (longView) { longView.hidden = shorts || motions; longView.classList.toggle("is-active", !shorts && !motions); }
    if (shortsView) { shortsView.hidden = !shorts; shortsView.classList.toggle("is-active", shorts); }
    if (motionSection && motions) motionSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    workTabs.forEach(tab => {
      const active = tab.dataset.workTab === type;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  workTabs.forEach(tab => tab.addEventListener("click", () => setWorkView(tab.dataset.workTab || "long")));
  navWorkTabs.forEach(link => link.addEventListener("click", () => setWorkView(link.dataset.workTab || "long")));

  // Shared video modal.
  const modal = document.getElementById("videoModal");
  const frame = document.getElementById("modalFrame");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  const close = document.getElementById("modalClose");

  const openVideo = button => {
    const id = button.dataset.id;
    if (!id || !modal) return;
    modalTitle.textContent = button.dataset.title || "Portfolio video";
    modalCategory.textContent = button.dataset.type === "shorts" ? "SHORTS" : "LONG-FORM";
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    close?.focus();
  };

  const closeVideo = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    frame.src = "about:blank";
  };

  document.querySelectorAll(".portfolio-card").forEach(card => card.addEventListener("click", () => openVideo(card)));
  const featured = document.querySelector(".feature-card");
  featured?.addEventListener("click", () => openVideo(featured));
  document.querySelector("[data-close-modal]")?.addEventListener("click", closeVideo);
  close?.addEventListener("click", closeVideo);
  addEventListener("keydown", e => { if (e.key === "Escape") closeVideo(); });

  // Copy Discord.
  const discord = document.getElementById("discordCopy");
  if (discord) {
    const original = discord.textContent;
    discord.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(discord.dataset.copy || ""); } catch (_) {}
      discord.textContent = "Copied ✓";
      setTimeout(() => { discord.textContent = original; }, 1400);
    });
  }


  // Motion graphics gallery. Browsers cannot list a folder directly, so the manifest is generated from assets/.
  const motionGrid = document.getElementById("motionGrid");
  const motionStatus = document.getElementById("motionStatus");
  const motionCount = document.getElementById("motionCount");
  const motionModal = document.getElementById("motionModal");
  const motionModalVideo = document.getElementById("motionModalVideo");
  const motionModalTitle = document.getElementById("motionModalTitle");
  const motionModalClose = document.getElementById("motionModalClose");

  const closeMotion = () => {
    if (!motionModal) return;
    motionModal.classList.remove("is-open");
    motionModal.setAttribute("aria-hidden", "true");
    motionModalVideo.pause();
    motionModalVideo.removeAttribute("src");
    motionModalVideo.load();
    document.body.classList.remove("modal-open");
  };

const motionObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { threshold: 0.25 })
  : null;

  async function loadMotions() {
    if (!motionGrid) return;
    try {
      const response = await fetch("assets/motions.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load assets/motions.json");
      const items = await response.json();
      motionGrid.replaceChildren();
      if (!Array.isArray(items) || items.length === 0) {
        motionGrid.innerHTML = '<div class="motion-empty"><strong>No motions added yet.</strong><span>Put MP4, WebM or OGG files in <code>assets/</code>, then run <code>node generate-motions.js</code>.</span></div>';
        if (motionCount) motionCount.textContent = "0 MOTIONS";
        return;
      }
      const supported = items.filter(item => item && item.src && /\.(mp4|webm|ogv|ogg|mov)(\?.*)?$/i.test(item.src));
      supported.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "motion-card";
        const video = document.createElement("video");
        video.className = "motion-card__video";
        video.src = item.src; video.muted = true; video.loop = true; video.autoplay = !motionObserver; video.playsInline = true; video.preload = "metadata";
        video.setAttribute("aria-label", item.title || `Motion ${index + 1}`);
        const media = document.createElement("div"); media.className = "motion-card__media"; media.appendChild(video);
        const overlay = document.createElement("button"); overlay.className = "motion-card__open"; overlay.type = "button"; overlay.textContent = "↗"; overlay.setAttribute("aria-label", `Open ${item.title || `Motion ${index + 1}`}`);
        overlay.addEventListener("click", () => {
          motionModalTitle.textContent = item.title || `Motion ${index + 1}`;
          motionModalVideo.src = item.src; motionModalVideo.muted = video.muted;
          motionModal.classList.add("is-open"); motionModal.setAttribute("aria-hidden", "false"); document.body.classList.add("modal-open");
          motionModalVideo.play().catch(() => {}); motionModalClose.focus();
        });
        media.appendChild(overlay);
        const footer = document.createElement("div"); footer.className = "motion-card__footer";
        const title = document.createElement("strong"); title.textContent = item.title || item.src.split("/").pop().replace(/\.[^.]+$/, "");
        const mute = document.createElement("button"); mute.className = "motion-mute"; mute.type = "button"; mute.textContent = "🔇 MUTED"; mute.setAttribute("aria-pressed", "true");
        mute.addEventListener("click", () => { video.muted = !video.muted; mute.textContent = video.muted ? "🔇 MUTED" : "🔊 SOUND ON"; mute.setAttribute("aria-pressed", String(!video.muted)); });
        footer.append(title, mute); card.append(media, footer); motionGrid.appendChild(card);
        if (motionObserver) motionObserver.observe(video);
else video.play().catch(() => {});
      });
      if (motionCount) motionCount.textContent = `${supported.length} MOTION${supported.length === 1 ? "" : "S"}`;
      if (!supported.length) motionGrid.innerHTML = '<div class="motion-empty">No supported video files found in the manifest.</div>';
    } catch (error) {
      console.warn(error);
      if (motionCount) motionCount.textContent = "MOTION GALLERY";
      if (motionStatus) motionStatus.innerHTML = 'Could not load motions. Run the site from a web server and make sure <code>assets/motions.json</code> exists.';
    }
  }
  loadMotions();
  document.querySelectorAll("[data-close-motion]").forEach(el => el.addEventListener("click", closeMotion));
  motionModalClose?.addEventListener("click", closeMotion);
  addEventListener("keydown", e => { if (e.key === "Escape") closeMotion(); });

  // Current year.
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Active navigation state.
  const nav = [...document.querySelectorAll(".nav a")];
  const targets = nav.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        nav.forEach(link => link.classList.remove("is-current"));
        const index = targets.indexOf(entry.target);
        if (index >= 0) nav[index].classList.add("is-current");
      });
    }, { threshold: 0.35 });
    targets.forEach(target => observer.observe(target));
  }

  // YouTube Data API v3: total views across all portfolio videos.
  const totalViewsEl = document.getElementById("totalViews");
  const viewsStatusEl = document.getElementById("viewsStatus");
  const videoCountEl = document.getElementById("videoCount");
  if (videoCountEl) videoCountEl.textContent = String(portfolioVideos.length);

  const formatViews = value => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

  async function loadPortfolioViews() {
    if (!totalViewsEl || !viewsStatusEl) return;
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "PASTE_YOUTUBE_DATA_API_KEY_HERE") {
      totalViewsEl.textContent = "—";
      viewsStatusEl.textContent = "Add your YouTube API key in script.js";
      return;
    }

    try {
      let total = 0;
      for (let i = 0; i < portfolioVideos.length; i += 50) {
        const ids = portfolioVideos.slice(i, i + 50).map(video => video.id).join(",");
        const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(ids)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`YouTube API request failed (${response.status})`);
        const data = await response.json();
        for (const item of (data.items || [])) total += Number(item.statistics?.viewCount || 0);
      }

      totalViewsEl.textContent = `${formatViews(total)}+`;
      viewsStatusEl.textContent = `Across ${portfolioVideos.length} portfolio videos`;
    } catch (error) {
      console.error(error);
      totalViewsEl.textContent = "—";
      viewsStatusEl.textContent = "Could not load YouTube views";
    }
  }

  loadPortfolioViews();
})();
