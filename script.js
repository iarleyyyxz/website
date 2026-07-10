(() => {
  "use strict";

  const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     BOOT SEQUENCE — plays once per session, skippable
     ============================================================ */
  const bootScreen = document.getElementById("bootScreen");
  const bootLog = document.getElementById("bootLog");
  const bootSkip = document.getElementById("bootSkip");

  if (bootScreen) {
    const alreadyBooted = sessionStorage.getItem("editorBooted");

    if (alreadyBooted || prefersReducedMotion) {
      bootScreen.remove();
    } else {
      const lines = [
        ["ok",   "Starting kernel modules: cut.ko color.ko sound.ko"],
        ["ok",   "Mounting /dev/footage on /mnt/raw"],
        ["ok",   "Starting premiere-pro.service"],
        ["ok",   "Starting after-effects.service"],
        ["ok",   "Starting photoshop.service"],
        ["ok",   "Checking timeline integrity ... 0 conflicts found"],
        ["ok",   "Loading color profiles (rec709, teal-orange.lut)"],
        ["ok",   "Starting audio-mixer.service"],
        ["warn", "3 raw clips still unedited — ignoring for now"],
        ["ok",   "Rendering preview ... done"],
        ["ok",   "Reached target Portfolio"],
        ["dim",  ""],
        ["dim",  "editor login: guest"],
        ["dim",  "Password: ********"],
        ["dim",  "Welcome. Last login just now from your browser."],
        ["dim",  "$ ./launch-site.sh"],
      ];

      document.body.style.overflow = "hidden";

      let i = 0;
      const tags = { ok: "[ OK ] ", warn: "[WARN] ", dim: "" };
      const classes = { ok: "boot-screen__ok", warn: "boot-screen__warn", dim: "boot-screen__dim" };

      function finishBoot() {
        bootScreen.classList.add("is-done");
        document.body.style.overflow = "";
        sessionStorage.setItem("editorBooted", "1");
        setTimeout(() => bootScreen.remove(), 550);
      }

      function printLine() {
        if (i >= lines.length) {
          setTimeout(finishBoot, 420);
          return;
        }
        const [type, text] = lines[i];
        const row = document.createElement("div");
        const tag = tags[type] || "";
        row.innerHTML = tag
          ? `<span class="${classes[type]}">${tag}</span>${text}`
          : `<span class="${classes[type]}">${text}</span>`;
        bootLog.appendChild(row);
        bootLog.scrollTop = bootLog.scrollHeight;
        i++;
        setTimeout(printLine, 90 + Math.random() * 90);
      }
      setTimeout(printLine, 250);

      bootSkip.addEventListener("click", finishBoot);
    }
  }

  /* ============================================================
     CUSTOM CURSOR — transparent ring, white outline
     ============================================================ */
  if (!isCoarsePointer) {
    const ring = document.getElementById("cursorRing");
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      ring.classList.add("is-visible");
    });

    document.addEventListener("mouseleave", () => ring.classList.remove("is-visible"));
    document.addEventListener("mouseenter", () => ring.classList.add("is-visible"));

    const interactiveSelectors = "a, button, .clip, .track, .video-card, .term-window__btn, .os-panel__ws, .rating__star, .video-card__like";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(interactiveSelectors)) ring.classList.add("is-active");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(interactiveSelectors)) ring.classList.remove("is-active");
    });

    function loop() {
      // smooth easing (lerp) for a slight trailing motion
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ============================================================
     HERO BACKGROUND — falling timecode / hex "code rain"
     ============================================================ */
  const rainCanvas = document.getElementById("heroRain");
  if (rainCanvas) {
    const ctx = rainCanvas.getContext("2d");
    const heroEl = document.querySelector(".hero");
    const chars = "0123456789ABCDEF:./".split("");
    const fontSize = 15;
    let columns = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      const rect = heroEl.getBoundingClientRect();
      rainCanvas.width = rect.width * dpr;
      rainCanvas.height = rect.height * dpr;
      rainCanvas.style.width = rect.width + "px";
      rainCanvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colCount = Math.ceil(rect.width / fontSize);
      columns = new Array(colCount).fill(0).map(() => ({
        y: Math.random() * -100,
        speed: 0.4 + Math.random() * 0.9,
      }));
    }

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    function drawRain() {
      const rect = heroEl.getBoundingClientRect();
      ctx.fillStyle = "rgba(9, 12, 18, 0.15)";
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      columns.forEach((col, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = col.y * fontSize;

        ctx.fillStyle = "rgba(76, 141, 255, 0.9)";
        ctx.fillText(char, x, y);

        ctx.fillStyle = "rgba(76, 141, 255, 0.28)";
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);

        col.y += col.speed;
        if (y > rect.height + fontSize * 2 && Math.random() > 0.975) {
          col.y = Math.random() * -40;
          col.speed = 0.4 + Math.random() * 0.9;
        }
      });
    }

    if (!prefersReducedMotion) {
      setInterval(drawRain, 60);
    } else {
      drawRain();
    }
  }

  /* ============================================================
     HEADER — background on scroll
     ============================================================ */
  const header = document.getElementById("header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ============================================================
     TIMECODE — NLE-style counter (24fps)
     ============================================================ */
  const timecodeEl = document.getElementById("timecode");
  if (timecodeEl && !prefersReducedMotion) {
    const FPS = 24;
    let frame = 0;
    const pad = (n) => String(n).padStart(2, "0");

    setInterval(() => {
      frame++;
      const totalSeconds = Math.floor(frame / FPS);
      const f = frame % FPS;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      timecodeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }, 1000 / FPS);
  }

  /* ============================================================
     MARQUEE — duplicate clips for a seamless loop
     ============================================================ */
  const marqueeTrack = document.getElementById("marqueeTrack");
  if (marqueeTrack) {
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ============================================================
     FOOTER YEAR
     ============================================================ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     OS TASKBAR — clock + active workspace
     ============================================================ */
  const osClock = document.getElementById("osClock");
  if (osClock) {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      osClock.textContent = `${h}:${m}`;
    };
    updateClock();
    setInterval(updateClock, 15000);
  }

  const wsLinks = Array.from(document.querySelectorAll(".os-panel__ws"));
  const wsSections = wsLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (wsLinks.length && "IntersectionObserver" in window) {
    const wsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = wsSections.indexOf(entry.target);
            wsLinks.forEach((l) => l.classList.remove("is-active"));
            if (idx !== -1) wsLinks[idx].classList.add("is-active");
          }
        });
      },
      { threshold: 0.5 }
    );
    wsSections.forEach((section) => wsObserver.observe(section));
  }
  /* ============================================================
     DISCORD — click to copy username
     ============================================================ */
  const copyBtn = document.querySelector(".social-link--copy");
  if (copyBtn) {
    const original = copyBtn.innerHTML;
    const checkIcon = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    copyBtn.addEventListener("click", async () => {
      const value = copyBtn.dataset.copy || "";
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        // clipboard API unavailable — fail silently, tooltip still shows the username
      }
      copyBtn.classList.add("is-copied");
      copyBtn.innerHTML = checkIcon;
      setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        copyBtn.innerHTML = original;
      }, 1600);
    });
  }

  /* ============================================================
     VIDEO LIKES — persisted per-browser via localStorage
     ============================================================ */
  const likeButtons = document.querySelectorAll(".video-card__like");
  if (likeButtons.length) {
    const STORE_KEY = "editorVideoLikes";
    let likeStore = {};
    try {
      likeStore = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (err) {
      likeStore = {};
    }

    likeButtons.forEach((btn) => {
      const card = btn.closest(".video-card");
      const videoId = (card && card.dataset.videoId) || "video";
      const countEl = btn.querySelector(".video-card__like-count");
      const saved = likeStore[videoId] || { liked: false, count: 0 };

      countEl.textContent = saved.count;
      if (saved.liked) {
        btn.classList.add("is-liked");
        btn.setAttribute("aria-pressed", "true");
      }

      btn.addEventListener("click", () => {
        const current = likeStore[videoId] || { liked: false, count: 0 };
        current.liked = !current.liked;
        current.count = Math.max(0, current.count + (current.liked ? 1 : -1));
        likeStore[videoId] = current;

        try {
          localStorage.setItem(STORE_KEY, JSON.stringify(likeStore));
        } catch (err) {
          // storage unavailable (private mode, etc.) — like still updates visually this session
        }

        countEl.textContent = current.count;
        btn.classList.toggle("is-liked", current.liked);
        btn.setAttribute("aria-pressed", String(current.liked));
      });
    });
  }

  /* ============================================================
     RATING WIDGET — star rating + optional comment
     ============================================================ */
  const ratingStars = document.getElementById("ratingStars");
  const ratingSubmit = document.getElementById("ratingSubmit");
  const ratingComment = document.getElementById("ratingComment");
  const ratingThanks = document.getElementById("ratingThanks");

  if (ratingStars && ratingSubmit) {
    const stars = Array.from(ratingStars.querySelectorAll(".rating__star"));
    let selected = 0;

    function paintStars(value) {
      stars.forEach((star) => {
        const isFilled = Number(star.dataset.value) <= value;
        star.classList.toggle("is-hover", isFilled);
      });
    }

    stars.forEach((star) => {
      star.addEventListener("mouseenter", () => paintStars(Number(star.dataset.value)));
      star.addEventListener("focus", () => paintStars(Number(star.dataset.value)));

      star.addEventListener("click", () => {
        selected = Number(star.dataset.value);
        stars.forEach((s) => {
          const isSelected = Number(s.dataset.value) <= selected;
          s.classList.toggle("is-selected", isSelected);
          s.setAttribute("aria-checked", String(Number(s.dataset.value) === selected));
        });
      });
    });

    ratingStars.addEventListener("mouseleave", () => paintStars(selected));

    ratingSubmit.addEventListener("click", () => {
      if (selected === 0) {
        paintStars(0);
        stars.forEach((s) => s.classList.add("is-hover"));
        setTimeout(() => paintStars(selected), 300);
        return;
      }

      const entry = {
        value: selected,
        comment: ratingComment.value.trim(),
        date: new Date().toISOString(),
      };

      try {
        const key = "editorSiteFeedback";
        const existing = JSON.parse(localStorage.getItem(key)) || [];
        existing.push(entry);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (err) {
        // storage unavailable — feedback still confirmed to the visitor below
      }

      ratingThanks.hidden = false;
      ratingSubmit.textContent = "Sent ✓";
      ratingSubmit.disabled = true;
      ratingComment.disabled = true;
      stars.forEach((s) => (s.disabled = true));
    });
  }

})();
