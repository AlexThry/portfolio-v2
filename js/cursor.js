/* Custom cursor — dot + lagging ring, hover states, label state */
(function () {
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (!fine) return;
  document.documentElement.classList.add("cursor-on");

  var cursor = document.getElementById("cursor");
  var dot = document.getElementById("cursorDot");
  var ring = document.getElementById("cursorRing");
  var label = document.getElementById("cursorLabel");

  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
  });

  gsap.ticker.add(function () {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
  });

  function bind() {
    document.querySelectorAll("a, button, [data-hover]").forEach(function (el) {
      if (el.__cursorBound) return;
      el.__cursorBound = true;
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("cursor--hover");
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("cursor--hover");
      });
    });
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      if (el.__cursorLabelBound) return;
      el.__cursorLabelBound = true;
      el.addEventListener("mouseenter", function () {
        label.textContent = el.getAttribute("data-cursor");
        cursor.classList.add("cursor--label");
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("cursor--label");
      });
    });
  }
  bind();
})();
