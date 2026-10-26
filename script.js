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
    { id: "KM0BDc9SFyY", type: "long" },
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

  // ---------------------------------------------------------------------------
  // Custom video player.
  // Built on the YouTube IFrame API with our own controls. Nothing is drawn over the
  // video except one transparent click layer: the controls live BELOW the picture,
  // and there are no filters, blurs or transforms near the iframe (those are what
  // make some GPUs show a black frame with sound only).
  // ---------------------------------------------------------------------------
  const vp = document.getElementById("videoModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  const close = document.getElementById("modalClose");
  const $ = id => document.getElementById(id);
  const ui = {
    wrap: $("vpPlayer"), stage: $("vpStage"), hit: $("vpHit"),
    status: $("vpStatus"), statusText: $("vpStatusText"), statusLink: $("vpStatusLink"),
    play: $("vpPlay"), time: $("vpTime"), seek: $("vpSeek"), mute: $("vpMute"),
    vol: $("vpVol"), speed: $("vpSpeed"), fs: $("vpFs"), yt: $("vpYt")
  };
  const RATES = [0.75, 1, 1.25, 1.5, 2];

  let player = null, apiPromise = null, ready = false, current = null, createdWith = null;
  let seeking = false, tickTimer = 0, slowTimer = 0, readyTimer = 0, rateIndex = 1, fallbackFrame = null;

  const fmt = s => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? `${h}:${String(m).padStart(2, "0")}` : String(m)) + ":" + String(sec).padStart(2, "0");
  };
  const setFill = input => {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--p", pct + "%");
  };
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;

  // Loads https://www.youtube.com/iframe_api once.
  const loadAPI = () => {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { apiPromise = null; reject(new Error("YouTube API timeout")); }, 10000);
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        if (typeof previous === "function") previous();
        resolve(window.YT);
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => { clearTimeout(timeout); apiPromise = null; reject(new Error("YouTube API blocked")); };
      document.head.appendChild(tag);
    });
    return apiPromise;
  };

  // Status overlay (loading / error).
  const showStatus = (text, link = false, error = false) => {
    ui.status.hidden = false;
    ui.status.classList.toggle("is-error", error);
    ui.statusText.textContent = text;
    ui.statusLink.hidden = !link;
  };
  const hideStatus = () => { ui.status.hidden = true; clearTimeout(slowTimer); };

  const syncPlayUI = playing => {
    ui.play.textContent = playing ? "❚❚" : "▶";
    ui.play.setAttribute("aria-label", playing ? "Pause" : "Play");
    vp.classList.toggle("is-paused", !playing && ui.status.hidden);
  };
  const syncAudioUI = () => {
    if (!ready || !player) return;
    const muted = player.isMuted() || player.getVolume() === 0;
    ui.mute.textContent = muted ? "🔇" : "🔊";
    ui.mute.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  };

  const update = () => {
    if (!ready || !player || !player.getCurrentTime) return;
    const dur = player.getDuration() || 0, cur = player.getCurrentTime() || 0;
    if (seeking) return;
    ui.seek.value = dur ? Math.round((cur / dur) * 1000) : 0;
    setFill(ui.seek);
    ui.time.textContent = `${fmt(cur)} / ${fmt(dur)}`;
  };
  const stopTick = () => { clearInterval(tickTimer); tickTimer = 0; };
  const startTick = () => { if (!tickTimer) tickTimer = setInterval(update, 250); };

  const resetUI = () => {
    seeking = false;
    ui.seek.value = 0; setFill(ui.seek);
    ui.time.textContent = "0:00 / 0:00";
    rateIndex = 1; ui.speed.textContent = "1×";
    vp.classList.remove("is-paused", "is-fallback");
    syncPlayUI(false);
  };

  const removeFallback = () => { if (fallbackFrame) { fallbackFrame.remove(); fallbackFrame = null; } };

  // Last resort: if the API cannot load (blocked network / extension), use a plain embed.
  const useFallback = id => {
    clearTimeout(readyTimer); stopTick();
    if (player && player.destroy) { try { player.destroy(); } catch (_) {} }
    player = null; ready = false;
    hideStatus();
    removeFallback();
    vp.classList.add("is-fallback");
    vp.classList.remove("is-paused");
    const f = document.createElement("iframe");
    f.title = modalTitle.textContent || "Portfolio video";
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    ui.stage.appendChild(f);
    fallbackFrame = f;
  };

  const onReady = () => {
    ready = true;
    clearTimeout(readyTimer);
    if (!current) { try { player.stopVideo(); } catch (_) {} return; }
    try { player.setVolume(Number(ui.vol.value)); player.setPlaybackRate(RATES[rateIndex]); } catch (_) {}
    if (current !== createdWith) player.loadVideoById(current);
    syncAudioUI();
  };

  const onStateChange = e => {
    const s = e.data; // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    if (!current) { if (s === 1) try { player.pauseVideo(); } catch (_) {} return; }
    if (s === 1 || s === 2 || s === 3 || s === 5) hideStatus();
    if (s === 1) startTick(); else if (s !== 3) stopTick();
    syncPlayUI(s === 1 || s === 3);
    if (s === 0) { try { player.seekTo(0, true); player.pauseVideo(); } catch (_) {} } // skip YouTube's end-screen suggestions
    syncAudioUI();
    update();
  };

  const onError = () => {
    stopTick();
    showStatus("THIS VIDEO CAN'T BE PLAYED HERE", true, true);
    vp.classList.remove("is-paused");
  };

  const createPlayer = (YT, id) => {
    if (!$("vpMount")) { const d = document.createElement("div"); d.id = "vpMount"; ui.stage.prepend(d); }
    ready = false; createdWith = id;
    const vars = { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0 };
    if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
    player = new YT.Player("vpMount", {
      host: "https://www.youtube-nocookie.com",
      width: "100%", height: "100%", videoId: id, playerVars: vars,
      events: { onReady, onStateChange, onError }
    });
    readyTimer = setTimeout(() => { if (!ready && current) useFallback(current); }, 12000);
  };

  const pauseMotions = () => document.querySelectorAll(".motion-card__video").forEach(v => v.pause());
  const resumeMotions = () => document.querySelectorAll(".motion-card__video").forEach(v => {
    const r = v.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {});
  });

  const openVideo = button => {
    const id = button.dataset.id;
    if (!id || !vp) return;
    const shorts = button.dataset.type === "shorts";
    modalTitle.textContent = button.dataset.title || "Portfolio video";
    modalCategory.textContent = shorts ? "SHORTS" : "LONG-FORM";
    vp.classList.toggle("is-shorts", shorts);
    ui.yt.href = ui.statusLink.href = `https://www.youtube.com/watch?v=${id}`;

    removeFallback();
    resetUI();
    pauseMotions();
    current = id;
    vp.classList.add("is-open");
    vp.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    close?.focus();

    showStatus("LOADING VIDEO…");
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => { if (!ui.status.hidden && !ui.status.classList.contains("is-error")) showStatus("STILL LOADING…", true); }, 6000);

    loadAPI().then(YT => {
      if (current !== id || !vp.classList.contains("is-open")) return;
      if (!player) createPlayer(YT, id);
      else if (ready) { player.setPlaybackRate(1); player.loadVideoById(id); }
      // if the player exists but is not ready yet, onReady loads `current`
    }).catch(() => { if (current === id) useFallback(id); });
  };

  const closeVideo = () => {
    if (!vp) return;
    current = null;
    clearTimeout(slowTimer); clearTimeout(readyTimer); stopTick();
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    if (player && ready) { try { player.stopVideo(); } catch (_) {} }
    removeFallback();
    vp.classList.remove("is-open", "is-paused", "is-fallback");
    vp.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    resumeMotions();
  };

  // Controls.
  const toggle = () => {
    if (!ready || !player) return;
    const s = player.getPlayerState();
    if (s === 1 || s === 3) player.pauseVideo(); else player.playVideo();
  };
  const skip = d => {
    if (!ready || !player) return;
    const dur = player.getDuration() || 0;
    player.seekTo(Math.max(0, Math.min(dur, player.getCurrentTime() + d)), true);
    update();
  };
  const toggleFs = () => {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const el = ui.wrap;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  if (vp) {
    ui.play.addEventListener("click", toggle);
    ui.hit.addEventListener("click", toggle);
    ui.fs.addEventListener("click", toggleFs);
    if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) ui.fs.hidden = true;
    const onFs = () => { ui.fs.textContent = fsEl() ? "✕" : "⛶"; ui.fs.setAttribute("aria-label", fsEl() ? "Exit fullscreen" : "Fullscreen"); };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);

    ui.seek.addEventListener("input", () => {
      setFill(ui.seek);
      if (!ready) return;
      seeking = true;
      const dur = player.getDuration() || 0;
      ui.time.textContent = `${fmt((ui.seek.value / 1000) * dur)} / ${fmt(dur)}`;
    });
    ui.seek.addEventListener("change", () => {
      if (ready) player.seekTo((ui.seek.value / 1000) * (player.getDuration() || 0), true);
      seeking = false; update();
    });

    ui.vol.addEventListener("input", () => {
      setFill(ui.vol);
      if (!ready) return;
      const v = Number(ui.vol.value);
      player.setVolume(v);
      if (v > 0 && player.isMuted()) player.unMute();
      syncAudioUI();
    });
    ui.mute.addEventListener("click", () => {
      if (!ready) return;
      if (player.isMuted() || player.getVolume() === 0) {
        player.unMute();
        if (player.getVolume() === 0) { player.setVolume(60); ui.vol.value = 60; setFill(ui.vol); }
      } else player.mute();
      syncAudioUI();
    });
    ui.speed.addEventListener("click", () => {
      rateIndex = (rateIndex + 1) % RATES.length;
      ui.speed.textContent = RATES[rateIndex] + "×";
      if (ready) player.setPlaybackRate(RATES[rateIndex]);
    });

    setFill(ui.seek); setFill(ui.vol);
    vp.querySelector("[data-close-modal]")?.addEventListener("click", closeVideo);
    close?.addEventListener("click", closeVideo);

    document.querySelectorAll(".portfolio-card").forEach(card => card.addEventListener("click", () => openVideo(card)));
    const featured = document.querySelector(".feature-card");
    featured?.addEventListener("click", () => openVideo(featured));

    addEventListener("keydown", e => {
      if (!vp.classList.contains("is-open")) return;
      if (e.key === "Escape") { if (!fsEl()) closeVideo(); return; }
      if (e.key === "Tab") {
        const items = [...vp.querySelectorAll("button, a[href], input")].filter(el => !el.disabled && !el.hidden && el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || !ready || vp.classList.contains("is-fallback")) return;
      const tag = e.target.tagName, k = e.key.toLowerCase();
      if (k === " " && (tag === "BUTTON" || tag === "A")) return;
      if ((k === "arrowleft" || k === "arrowright") && tag === "INPUT") return;
      switch (k) {
        case " ": case "k": e.preventDefault(); toggle(); break;
        case "arrowleft": e.preventDefault(); skip(-5); break;
        case "arrowright": e.preventDefault(); skip(5); break;
        case "j": skip(-10); break;
        case "l": skip(10); break;
        case "m": ui.mute.click(); break;
        case "f": toggleFs(); break;
      }
    });
  }

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
      const supported = items.filter(item => item && item.src && /\.(mp4|webm)(\?.*)?$/i.test(item.src));
      supported.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "motion-card";
        const video = document.createElement("video");
        video.className = "motion-card__video";
        video.src = item.src + "#t=0.001"; video.muted = true; video.loop = true; video.autoplay = !motionObserver; video.playsInline = true; video.preload = "metadata"; video.setAttribute("playsinline", ""); video.setAttribute("webkit-playsinline", "");
        video.addEventListener("error", () => { media.classList.add("is-broken"); const note = document.createElement("div"); note.className = "motion-empty"; note.textContent = "Video codec not supported by this browser. Re-encode to H.264 (see convert-motions.sh)."; media.appendChild(note); console.warn("Motion video failed:", item.src, video.error); });
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
