(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Soft cursor light: atmospheric only, never a distracting custom cursor.
  const mouseGlow = document.getElementById("mouseGlow");
  if (mouseGlow && !prefersReducedMotion && window.matchMedia("(pointer:fine)").matches) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; }, {passive:true});
    const moveGlow = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      mouseGlow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      requestAnimationFrame(moveGlow);
    };
    moveGlow();
  }

  // Timeline timecode — keeps the editor aesthetic without extra UI clutter.
  const timecode = document.getElementById("timecode");
  if (timecode && !prefersReducedMotion) {
    const FPS = 24;
    let frame = 0;
    const pad = n => String(n).padStart(2, "0");
    setInterval(() => {
      frame++;
      const total = Math.floor(frame / FPS);
      const f = frame % FPS;
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      timecode.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }, 1000 / FPS);
  }

  // Small audio waveform for the only decorative editing element: the timeline.
  const waveform = document.getElementById("nleWaveform");
  if (waveform) {
    const heights = [25,45,72,38,84,58,31,66,92,44,70,54,28,76,48,86,35,61,94,43,68,30,78,51,89,42,64,35,74,46,83,57,29,69,91,47,62,36,80,52,72,40,88,31,67,49,77,43];
    waveform.innerHTML = heights.map(h => `<span style="height:${h}%"></span>`).join("");
  }

  // Portfolio video switching.
  const frame = document.getElementById("showroomFrame");
  const title = document.getElementById("showroomTitle");
  const position = document.getElementById("showroomPos");
  const total = document.getElementById("showroomTotal");
  const clips = [...document.querySelectorAll(".filmclip")];

  clips.forEach((clip, index) => {
    clip.addEventListener("click", () => {
      const id = clip.dataset.id;
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
      title.textContent = clip.dataset.title || `Video ${String(index + 1).padStart(2, "0")}`;
      position.textContent = String(index + 1).padStart(2, "0");
      total.textContent = String(clips.length).padStart(2, "0");
      clips.forEach(c => c.classList.toggle("is-active", c === clip));
    });
  });

  // Portfolio category filters.
  const categoryTabs = [...document.querySelectorAll(".category-tab")];
  if (categoryTabs.length && clips.length) {
    const filterClips = category => {
      clips.forEach(clip => {
        const categories = (clip.dataset.categories || "").split(",");
        const visible = category === "all" || categories.includes(category);
        clip.hidden = !visible;
      });

      const visibleClips = clips.filter(c => !c.hidden);
      const current = clips.find(c => c.classList.contains("is-active"));
      if (!current || current.hidden) {
        const first = visibleClips[0];
        if (first) first.click();
      }
    };

    categoryTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        categoryTabs.forEach(t => t.classList.toggle("is-active", t === tab));
        filterClips(tab.dataset.category);
      });
    });
  }

  // Discord username copy.
  const discord = document.getElementById("discordCopy");
  if (discord) {
    const original = discord.textContent;
    discord.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(discord.dataset.copy || ""); } catch (_) {}
      discord.textContent = "Copied ✓";
      setTimeout(() => discord.textContent = original, 1400);
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  // Tiny terminal status loop keeps the contact area feeling alive.
  const contactCommand = document.getElementById("contactCommand");
  if (contactCommand && !prefersReducedMotion) {
    const commands = ["ready_for_new_project", "accepting_raw_footage", "timeline_clean", "render_queue_idle"];
    let ci = 0;
    setInterval(() => {
      ci = (ci + 1) % commands.length;
      contactCommand.animate(
        [{opacity:1, transform:"translateY(0)"},{opacity:0, transform:"translateY(2px)"},{opacity:1, transform:"translateY(0)"}],
        {duration:320,easing:"ease-out"}
      );
      setTimeout(() => contactCommand.textContent = commands[ci], 110);
    }, 3600);
  }

  // Subtle magnetic tilt on client cards — same restraint as the mouse glow.
  const clientCards = [...document.querySelectorAll(".client")];
  if (clientCards.length && !prefersReducedMotion && window.matchMedia("(pointer:fine)").matches) {
    clientCards.forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-5px) rotateX(${py * -6}deg) rotateY(${px * 6}deg)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  // Highlight the navigation item closest to the visible section.
  const navLinks = [...document.querySelectorAll(".nav a")];
  const navTargets = navLinks
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (navLinks.length && navTargets.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.remove("is-current"));
        const i = navTargets.indexOf(entry.target);
        if (i >= 0) navLinks[i].classList.add("is-current");
      });
    }, {threshold:0.45});
    navTargets.forEach(target => navObserver.observe(target));
  }

})();
