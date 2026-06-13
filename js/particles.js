/* ============================================================
   HERO BACKGROUND — 4 WebGL shader variants, one picked at random
   each launch. All THREE.Points, lime-on-black, mouse-reactive,
   mobile-throttled. Variant name is stamped into .hero__meta--tl.
   ============================================================ */
(function () {
  var canvas = document.getElementById("heroCanvas");
  if (!canvas || !window.THREE) return;

  var hero = canvas.parentElement;
  var isMobile = window.matchMedia("(max-width: 720px)").matches;
  var DENSITY = isMobile ? 0.45 : 1.0;
  var PR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(PR);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 10;

  var uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uPR: { value: PR }
  };

  var FRAG_COMMON = [
    "precision highp float;",
    "varying float vGlow;",
    "void main() {",
    "  vec2 c = gl_PointCoord - 0.5;",
    "  if (dot(c, c) > 0.25) discard;",
    "  vec3 dim = vec3(0.30, 0.30, 0.27);",
    "  vec3 lime = vec3(0.784, 0.941, 0.290);",
    "  vec3 col = mix(dim, lime, clamp(vGlow * 1.6, 0.0, 1.0));",
    "  float alpha = 0.32 + vGlow * 0.68;",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  /* ---------- Variant builders ---------- */

  // 0 — GRID WAVE: lattice of points, rolling wave, mouse repulsion
  function buildGrid() {
    var COLS = Math.round(110 * DENSITY), ROWS = Math.round(60 * DENSITY);
    var count = COLS * ROWS;
    var pos = new Float32Array(count * 3), seed = new Float32Array(count);
    var W = 24, H = 13, i = 0;
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      pos[i * 3] = (x / (COLS - 1) - 0.5) * W;
      pos[i * 3 + 1] = (y / (ROWS - 1) - 0.5) * H;
      pos[i * 3 + 2] = 0; seed[i] = Math.random(); i++;
    }
    return {
      name: "GRID FIELD",
      attrs: { aSeed: seed }, positions: pos,
      vert: [
        "attribute float aSeed;",
        "uniform float uTime; uniform vec2 uMouse; uniform float uPR;",
        "varying float vGlow;",
        "void main() {",
        "  vec3 p = position;",
        "  float wave = sin(p.x * 0.55 + uTime * 0.6) * cos(p.y * 0.5 + uTime * 0.45);",
        "  p.z += wave * 0.55;",
        "  float d = distance(p.xy, uMouse);",
        "  float force = smoothstep(3.2, 0.0, d);",
        "  vec2 dir = d > 0.001 ? normalize(p.xy - uMouse) : vec2(0.0);",
        "  p.xy += dir * force * 1.4; p.z += force * 1.8;",
        "  vGlow = force;",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = (1.1 + aSeed * 1.2 + force * 2.4) * uPR * (10.0 / -mv.z);",
        "}"
      ].join("\n")
    };
  }

  // 1 — ORBIT RINGS: concentric rotating rings, mouse swirls them
  function buildOrbit() {
    var RINGS = Math.round(46 * DENSITY);
    var perRing = Math.round(90 * DENSITY);
    var count = RINGS * perRing;
    var pos = new Float32Array(count * 3), seed = new Float32Array(count);
    var i = 0;
    for (var r = 0; r < RINGS; r++) for (var a = 0; a < perRing; a++) {
      var rad = 0.4 + r * (8.5 / RINGS);
      var ang = (a / perRing) * Math.PI * 2;
      pos[i * 3] = Math.cos(ang) * rad;
      pos[i * 3 + 1] = Math.sin(ang) * rad * 0.62;
      pos[i * 3 + 2] = 0; seed[i] = r / RINGS; i++;
    }
    return {
      name: "ORBIT RINGS",
      attrs: { aSeed: seed }, positions: pos,
      vert: [
        "attribute float aSeed;",
        "uniform float uTime; uniform vec2 uMouse; uniform float uPR;",
        "varying float vGlow;",
        "void main() {",
        "  vec3 p = position;",
        "  float rad = length(p.xy);",
        "  float ang = atan(p.y, p.x);",
        "  ang += uTime * (0.12 + aSeed * 0.35) * (mod(aSeed * 10.0, 2.0) < 1.0 ? 1.0 : -1.0);",
        "  p.x = cos(ang) * rad; p.y = sin(ang) * rad;",
        "  float d = distance(p.xy, uMouse);",
        "  float force = smoothstep(3.5, 0.0, d);",
        "  vec2 dir = d > 0.001 ? normalize(p.xy - uMouse) : vec2(0.0);",
        "  p.xy += dir * force * 1.6;",
        "  p.z += sin(rad * 1.4 - uTime * 1.2) * 0.5;",
        "  vGlow = max(force, smoothstep(0.9, 0.0, abs(fract(rad * 0.5 - uTime * 0.15) - 0.5)) * 0.5);",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = (1.0 + force * 2.6) * uPR * (10.0 / -mv.z);",
        "}"
      ].join("\n")
    };
  }

  // 2 — FLOW FIELD: scattered points drifting on a sin/cos flow, mouse attracts
  function buildFlow() {
    var count = Math.round(5200 * DENSITY);
    var pos = new Float32Array(count * 3), seed = new Float32Array(count);
    var W = 26, H = 15;
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * W;
      pos[i * 3 + 1] = (Math.random() - 0.5) * H;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      seed[i] = Math.random();
    }
    return {
      name: "FLOW FIELD",
      attrs: { aSeed: seed }, positions: pos,
      vert: [
        "attribute float aSeed;",
        "uniform float uTime; uniform vec2 uMouse; uniform float uPR;",
        "varying float vGlow;",
        "void main() {",
        "  vec3 p = position;",
        "  float t = uTime * 0.4 + aSeed * 6.28;",
        "  p.x += sin(p.y * 0.4 + t) * 1.3 + cos(p.y * 0.17 + t * 0.6) * 0.8;",
        "  p.y += cos(p.x * 0.35 + t) * 1.0 + sin(p.x * 0.2 - t * 0.5) * 0.7;",
        "  p.z += sin(p.x * 0.3 + p.y * 0.3 + uTime * 0.5) * 0.6;",
        "  float d = distance(p.xy, uMouse);",
        "  float force = smoothstep(4.0, 0.0, d);",
        "  vec2 dir = d > 0.001 ? normalize(uMouse - p.xy) : vec2(0.0);",
        "  p.xy += dir * force * 1.8;",
        "  vGlow = max(force, aSeed * 0.18);",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = (0.8 + aSeed * 1.4 + force * 2.6) * uPR * (10.0 / -mv.z);",
        "}"
      ].join("\n")
    };
  }

  // 3 — GLOBE: points on a sphere shell, slow spin, mouse parallax tilt
  function buildGlobe() {
    var count = Math.round(6000 * DENSITY);
    var pos = new Float32Array(count * 3), seed = new Float32Array(count);
    var R = 6.2;
    for (var i = 0; i < count; i++) {
      // fibonacci sphere
      var phi = Math.acos(1 - 2 * (i + 0.5) / count);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      pos[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = R * Math.cos(phi);
      pos[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
      seed[i] = Math.random();
    }
    return {
      name: "POINT GLOBE",
      attrs: { aSeed: seed }, positions: pos,
      vert: [
        "attribute float aSeed;",
        "uniform float uTime; uniform vec2 uMouse; uniform float uPR;",
        "varying float vGlow;",
        "mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }",
        "mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }",
        "void main() {",
        "  float mx = clamp(uMouse.x, -12.0, 12.0) * 0.05;",
        "  float my = clamp(uMouse.y, -12.0, 12.0) * 0.05;",
        "  vec3 p = rotX(my) * rotY(uTime * 0.12 - mx) * position;",
        "  float pulse = sin(aSeed * 6.28 + uTime * 1.5) * 0.15;",
        "  p *= 1.0 + pulse * 0.05;",
        "  vGlow = smoothstep(2.0, 6.5, p.z) * 0.9 + 0.05;",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  gl_PointSize = (1.0 + aSeed * 1.3 + vGlow * 1.8) * uPR * (10.0 / -mv.z);",
        "}"
      ].join("\n")
    };
  }

  /* ---------- Pick one at random ---------- */
  var builders = [buildGrid, buildOrbit, buildFlow, buildGlobe];
  var variant = builders[Math.floor(Math.random() * builders.length)]();

  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(variant.positions, 3));
  Object.keys(variant.attrs).forEach(function (k) {
    geo.setAttribute(k, new THREE.BufferAttribute(variant.attrs[k], 1));
  });

  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: variant.vert,
    fragmentShader: FRAG_COMMON
  });
  scene.add(new THREE.Points(geo, mat));

  // Stamp the variant name into the hero meta
  var tag = document.querySelector(".hero__meta--tl");
  if (tag) tag.innerHTML = "FOLIO / 2026<br>MODE — " + variant.name;

  /* ---------- Mouse → world plane ---------- */
  var targetMouse = new THREE.Vector2(99, 99);
  function setMouseFromEvent(clientX, clientY) {
    var rect = hero.getBoundingClientRect();
    var nx = (clientX - rect.left) / rect.width * 2 - 1;
    var ny = -((clientY - rect.top) / rect.height * 2 - 1);
    var fovY = (camera.fov * Math.PI) / 180;
    var planeH = 2 * Math.tan(fovY / 2) * camera.position.z;
    var planeW = planeH * camera.aspect;
    targetMouse.set((nx * planeW) / 2, (ny * planeH) / 2);
  }
  hero.addEventListener("mousemove", function (e) { setMouseFromEvent(e.clientX, e.clientY); });
  hero.addEventListener("mouseleave", function () { targetMouse.set(99, 99); });
  hero.addEventListener("touchmove", function (e) {
    if (e.touches[0]) setMouseFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  var clock = new THREE.Clock();
  var inView = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
    }).observe(hero);
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!inView) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(targetMouse, 0.08);
    renderer.render(scene, camera);
  }
  tick();
})();
