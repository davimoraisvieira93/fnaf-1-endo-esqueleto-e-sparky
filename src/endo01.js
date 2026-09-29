// endo01.js - Endo-01 como camada por cima do canvas do jogo.
// NAO altera o Runtime.js: cria um segundo canvas transparente em cima do MMFCanvas.
//
// PENDENTE (depende do dump do F9): CONFIG.getCamera e CONFIG.isPlaying.
// Enquanto nao estiverem ligados, use o modo de teste no console:
//   endo01.test(true)           -> liga o modo de teste
//   endo01.forceCamera('cam5')  -> finge que a CAM 5 esta aberta ('cam5','cam1b','cam2a','cam2b', null)
//   endo01.setStage(0..4)       -> move o Endo direto para um estagio
(function () {
  var CONFIG = {
    // Nivel de IA de 0 a 20 (0 = Endo nunca se move). Igual ao esquema do FNAF 1.
    ai: 5,
    // Intervalo entre tentativas de movimento (o FNAF 1 usa ~4.97 s).
    moveIntervalMs: 4970,
    // Tamanho interno do canvas do jogo.
    width: 1280,
    height: 720,
    // Pasta das imagens: a mesma resources/ do jogo (PNG com fundo transparente, do tamanho da camera).
    imgDir: "resources/",

    // Rota: cada estagio mostra uma imagem em uma camera.
    stages: [
      { cam: "cam5", img: "endo_cam5_parado.png" },
      { cam: "cam5", img: "endo_cam5_saindo.png" },
      { cam: "cam1b", img: "endo_cam1b.png" },
      { cam: "cam2a", img: "endo_cam2a.png" },
      { cam: "cam2b", img: "endo_cam2b.png" }
    ],

    // TODO: preencher depois do dump do F9.
    // Deve retornar 'cam5' | 'cam1b' | 'cam2a' | 'cam2b' | null (outra camera / escritorio).
    getCamera: function (app) { return null; },
    // TODO: deve retornar true so durante a noite (nao no menu).
    isPlaying: function (app) { return false; }
  };

  var state = { stage: 0, testMode: false, forcedCam: undefined, images: {}, loaded: 0 };
  var canvas = null, ctx = null, gameCanvas = null;

  function getApp() {
    return window.game && window.game.application ? window.game.application : null;
  }

  function loadImages() {
    CONFIG.stages.forEach(function (s) {
      if (state.images[s.img]) return;
      var im = new Image();
      im.onload = function () { state.loaded++; };
      im.onerror = function () { console.warn("[endo01] imagem nao encontrada: " + CONFIG.imgDir + s.img); };
      im.src = CONFIG.imgDir + s.img;
      state.images[s.img] = im;
    });
  }

  function createOverlay() {
    gameCanvas = document.getElementById("MMFCanvas");
    if (!gameCanvas) return false;
    canvas = document.createElement("canvas");
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "10";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    return true;
  }

  function syncOverlay() {
    var r = gameCanvas.getBoundingClientRect();
    canvas.style.left = (r.left + window.pageXOffset) + "px";
    canvas.style.top = (r.top + window.pageYOffset) + "px";
    canvas.style.width = r.width + "px";
    canvas.style.height = r.height + "px";
  }

  function currentCam() {
    if (state.forcedCam !== undefined) return state.forcedCam;
    var app = getApp();
    return app ? CONFIG.getCamera(app) : null;
  }

  function playing() {
    if (state.testMode) return true;
    var app = getApp();
    return app ? CONFIG.isPlaying(app) : false;
  }

  function draw() {
    requestAnimationFrame(draw);
    if (!ctx) return;
    syncOverlay();
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
    if (!playing()) return;
    var cam = currentCam();
    var s = CONFIG.stages[state.stage];
    if (!cam || !s || s.cam !== cam) return;
    var im = state.images[s.img];
    if (im && im.complete && im.naturalWidth > 0) {
      ctx.drawImage(im, 0, 0, CONFIG.width, CONFIG.height);
    }
  }

  // Sistema de IA: a cada intervalo, sorteia 1..20; se <= nivel, avanca um estagio.
  function tick() {
    if (!playing() || CONFIG.ai <= 0) return;
    var roll = 1 + Math.floor(Math.random() * 20);
    if (roll <= CONFIG.ai && state.stage < CONFIG.stages.length - 1) {
      state.stage++;
      console.log("[endo01] estagio " + state.stage + " (" + CONFIG.stages[state.stage].cam + ")");
    }
  }

  function init() {
    if (!createOverlay()) { console.warn("[endo01] MMFCanvas nao encontrado"); return; }
    loadImages();
    requestAnimationFrame(draw);
    setInterval(tick, CONFIG.moveIntervalMs);
  }

  window.endo01 = {
    config: CONFIG,
    state: state,
    test: function (on) { state.testMode = on !== false; },
    forceCamera: function (cam) { state.forcedCam = cam === undefined ? undefined : cam; },
    setStage: function (n) { state.stage = Math.max(0, Math.min(CONFIG.stages.length - 1, n | 0)); },
    reset: function () { state.stage = 0; }
  };

  window.addEventListener("load", init, false);
})();
