/* Mobile menu — fullscreen overlay toggle */
(function () {
  var burger = document.getElementById("navBurger");
  var menu = document.getElementById("menu");
  if (!burger || !menu) return;

  function setOpen(open) {
    document.documentElement.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
  }

  burger.addEventListener("click", function () {
    setOpen(!document.documentElement.classList.contains("menu-open"));
  });

  menu.querySelectorAll("[data-menu-link]").forEach(function (a) {
    a.addEventListener("click", function () { setOpen(false); });
  });
})();
