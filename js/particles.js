/* Hero particle field — grid of points, mouse repulsion + wave, lime on black */
(function () {
  var canvas = document.getElementById("heroCanvas");
  if (!canvas || !window.THREE) return;

  var hero = canvas.parentElement;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 10;

  // Build a grid of points covering the hero plane
  var COLS = 110, ROWS = 60;
  var count = COLS * ROWS;
  var positions = new Float32Array(count * 3);
  var seeds = new Float32Array(count);
  var W = 24, H = 13;
  var i = 0;
  for (var y = 0; y < ROWS; y++) {
    for (var x = 0; x < COLS; x++) {
      positions[i * 3] = (x / (COLS - 1) - 0.5) * W;
      positions[i * 3 + 1] = (y / (ROWS - 1) - 0.5) * H;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
      i++;
    }
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  var uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uPR: { value: Math.min(window.devicePixelRatio, 1.5) }
  };

  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: [
      "attribute float aSeed;",
      "uniform float uTime;",
      "uniform vec2 uMouse;",
      "uniform float uPR;",
      "varying float vGlow;",
      "void main() {",
      "  vec3 p = position;",
      "  float wave = sin(p.x * 0.55 + uTime * 0.6) * cos(p.y * 0.5 + uTime * 0.45);",
      "  p.z += wave * 0.55;",
      "  float d = distance(p.xy, uMouse);",
      "  float force = smoothstep(3.2, 0.0, d);",
      "  vec2 dir = d > 0.001 ? normalize(p.xy - uMouse) : vec2(0.0);",
      "  p.xy += dir * force * 1.4;",
      "  p.z += force * 1.8;",
      "  vGlow = force;",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
      "  gl_Position = projectionMatrix * mv;",
      "  float size = (1.1 + aSeed * 1.2 + force * 2.4) * uPR;",
      "  gl_PointSize = size * (10.0 / -mv.z);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "varying float vGlow;",
      "void main() {",
      "  vec2 c = gl_PointCoord - 0.5;",
      "  if (dot(c, c) > 0.25) discard;",
      "  vec3 dim = vec3(0.32, 0.32, 0.29);",
      "  vec3 lime = vec3(0.784, 0.941, 0.290);",
      "  vec3 col = mix(dim, lime, clamp(vGlow * 1.6, 0.0, 1.0));",
      "  float alpha = 0.35 + vGlow * 0.65;",
      "  gl_FragColor = vec4(col, alpha);",
      "}"
    ].join("\n")
  });

  scene.add(new THREE.Points(geo, mat));

  var targetMouse = new THREE.Vector2(99, 99);

  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  hero.addEventListener("mousemove", function (e) {
    var rect = hero.getBoundingClientRect();
    var nx = (e.clientX - rect.left) / rect.width * 2 - 1;
    var ny = -((e.clientY - rect.top) / rect.height * 2 - 1);
    // project to world plane at z=0
    var fovY = (camera.fov * Math.PI) / 180;
    var planeH = 2 * Math.tan(fovY / 2) * camera.position.z;
    var planeW = planeH * camera.aspect;
    targetMouse.set((nx * planeW) / 2, (ny * planeH) / 2);
  });
  hero.addEventListener("mouseleave", function () {
    targetMouse.set(99, 99);
  });

  var clock = new THREE.Clock();
  var inView = true;

  // Only render while hero is on screen
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
