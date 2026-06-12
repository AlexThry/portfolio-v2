/* WebGL hover distortion on work images — wave + RGB shift shader per media */
(function () {
  if (!window.THREE) return;
  var medias = document.querySelectorAll(".work__media[data-img]");
  if (!medias.length) return;

  var VERT = [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = vec4(position, 1.0);",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform sampler2D uTex;",
    "uniform float uProgress;",
    "uniform float uTime;",
    "uniform float uImgAspect;",
    "uniform float uPlaneAspect;",
    "varying vec2 vUv;",
    "vec2 coverUv(vec2 uv) {",
    "  float r = uPlaneAspect / uImgAspect;",
    "  if (r > 1.0) {",
    "    uv.y = (uv.y - 0.5) / r + 0.5;",
    "  } else {",
    "    uv.x = (uv.x - 0.5) * r + 0.5;",
    "  }",
    "  return uv;",
    "}",
    "void main() {",
    "  float p = uProgress;",
    "  vec2 uv = vUv;",
    "  uv = (uv - 0.5) * (1.0 - 0.07 * p) + 0.5;",
    "  uv.x += sin(uv.y * 9.0 + uTime * 1.6) * 0.035 * p;",
    "  uv.y += cos(uv.x * 7.0 + uTime * 1.3) * 0.022 * p;",
    "  uv = coverUv(uv);",
    "  float s = 0.014 * p;",
    "  float rC = texture2D(uTex, uv + vec2(s, 0.0)).r;",
    "  float gC = texture2D(uTex, uv).g;",
    "  float bC = texture2D(uTex, uv - vec2(s, 0.0)).b;",
    "  vec3 col = vec3(rC, gC, bC);",
    "  float gray = dot(col, vec3(0.299, 0.587, 0.114));",
    "  col = mix(col, vec3(gray), 0.25 * (1.0 - p));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  var planeGeo = new THREE.PlaneGeometry(2, 2);
  var instances = [];

  medias.forEach(function (el) {
    var src = el.getAttribute("data-img");
    loader.load(src, function (tex) {
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;

      var canvas = document.createElement("canvas");
      el.appendChild(canvas);

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      var scene = new THREE.Scene();
      var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      var uniforms = {
        uTex: { value: tex },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uImgAspect: { value: tex.image.width / tex.image.height },
        uPlaneAspect: { value: 1 }
      };

      var mat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG
      });
      scene.add(new THREE.Mesh(planeGeo, mat));

      var inst = {
        el: el, renderer: renderer, scene: scene, camera: camera,
        uniforms: uniforms, needsRender: true, inView: true
      };

      function resize() {
        var w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        uniforms.uPlaneAspect.value = w / h;
        inst.needsRender = true;
      }
      resize();
      window.addEventListener("resize", resize);

      el.addEventListener("mouseenter", function () {
        gsap.to(uniforms.uProgress, { value: 1, duration: 0.9, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(uniforms.uProgress, { value: 0, duration: 0.9, ease: "power3.out" });
      });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          inst.inView = entries[0].isIntersecting;
        }, { rootMargin: "100px" }).observe(el);
      }

      instances.push(inst);
    });
  });

  var clock = window.THREE ? new THREE.Clock() : null;
  function tick() {
    requestAnimationFrame(tick);
    var t = clock.getElapsedTime();
    for (var i = 0; i < instances.length; i++) {
      var inst = instances[i];
      if (!inst.inView) continue;
      var p = inst.uniforms.uProgress.value;
      if (p > 0.001 || inst.needsRender) {
        inst.uniforms.uTime.value = t;
        inst.renderer.render(inst.scene, inst.camera);
        inst.needsRender = p > 0.001;
      }
    }
  }
  tick();
})();
