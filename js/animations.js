/* GSAP — preloader, smooth scroll, reveals, parallax, marquee */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links work with Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      }
    });
  });

  /* ---------- Split helper (words) ---------- */
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = "";
    words.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return el.querySelectorAll(".w");
  }

  /* ---------- Initial states ---------- */
  gsap.set(".hero__line-inner", { yPercent: 110 });
  gsap.set(".hero__intro, .hero__scroll, .hero__meta", { opacity: 0, y: 20 });
  gsap.set(".nav", { opacity: 0 });

  /* ---------- Preloader ---------- */
  var counter = { v: 0 };
  var countEl = document.getElementById("preloaderCount");
  var pre = document.getElementById("preloader");

  var intro = gsap.timeline();
  intro
    .to(counter, {
      v: 100, duration: 1.4, ease: "power2.inOut",
      onUpdate: function () { countEl.textContent = Math.round(counter.v); }
    })
    .to(pre, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "+=0.15")
    .set(pre, { display: "none" })
    .to(".hero__line-inner", { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }, "-=0.85")
    .to(".hero__intro, .hero__scroll, .hero__meta", {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08
    }, "-=0.6")
    .to(".nav", { opacity: 1, duration: 0.6 }, "-=0.5");

  /* ---------- Marquee ---------- */
  gsap.to("#marqueeTrack", { xPercent: -50, duration: 18, ease: "none", repeat: -1 });

  /* ---------- Section heads ---------- */
  document.querySelectorAll(".section-head__title").forEach(function (el) {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  /* ---------- About words reveal ---------- */
  document.querySelectorAll(".reveal-words").forEach(function (el) {
    var words = splitWords(el);
    gsap.from(words, {
      opacity: 0.12, y: 8, stagger: 0.018, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 80%", end: "top 30%", scrub: 0.6 }
    });
  });

  /* ---------- Journey rows ---------- */
  document.querySelectorAll(".journey__row").forEach(function (row) {
    gsap.from(row, {
      opacity: 0, y: 34, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: row, start: "top 92%" }
    });
  });

  /* ---------- Skills columns ---------- */
  gsap.from(".skills__col", {
    opacity: 0, y: 40, stagger: 0.1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".skills__grid", start: "top 85%" }
  });

  /* ---------- Works: reveal + parallax ---------- */
  document.querySelectorAll(".work").forEach(function (work) {
    var media = work.querySelector(".work__media");
    var info = work.querySelector(".work__info");

    gsap.from(media, {
      clipPath: "inset(100% 0% 0% 0%)", duration: 1.1, ease: "power4.out",
      scrollTrigger: { trigger: work, start: "top 80%" }
    });
    gsap.from(info.children, {
      opacity: 0, y: 30, stagger: 0.08, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: work, start: "top 75%" }
    });
    // Parallax drift
    gsap.fromTo(media, { y: 40 }, {
      y: -40, ease: "none",
      scrollTrigger: { trigger: work, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---------- Certs ---------- */
  gsap.from(".cert", {
    opacity: 0, y: 30, stagger: 0.12, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".certs", start: "top 88%" }
  });

  /* ---------- Contact big reveal ---------- */
  gsap.set(".contact__line-inner", { yPercent: 110 });
  gsap.to(".contact__line-inner", {
    yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12,
    scrollTrigger: { trigger: ".contact__big", start: "top 80%" }
  });
  gsap.from(".contact__col", {
    opacity: 0, y: 30, stagger: 0.1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".contact__details", start: "top 90%" }
  });
})();
