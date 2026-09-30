// endo01.js - Endo-01 como camada por cima do canvas do jogo.
// NAO altera o Runtime.js: cria um segundo canvas transparente em cima do MMFCanvas.
//
// Rota: CAM 5 (parado) -> CAM 5 (saindo) -> CAM 1B -> CAM 7 -> CAM 2A -> CAM 2B -> PORTA
//
// Na PORTA ele fica parado:
//  - porta ABERTA: conta um tempo (7 a 20 s conforme a noite) e da o jumpscare.
//      Cada vez que voce ABRE a camera, o tempo cai de 1 a 2 s.
//  - porta FECHADA: ele demora de 7 a 14 s para sair e volta para CAM 1B, CAM 5 parado
//      ou CAM 5 saindo (sorteado). Se voce abrir a porta antes dele sair, a contagem
//      de saida e cancelada e a do jumpscare continua de onde parou.
//
// PENDENTE (depende do dump do F9): getCamera, isPlaying, isDoorClosed e getNight.
// Enquanto nao estiverem ligados, use o modo de teste no console:
//   endo01.test(true)            -> liga o modo de teste
//   endo01.forceCamera('office') -> 'cam5','cam1b','cam7','cam2a','cam2b','office' ou null
//   endo01.setStage(0..6)        -> move o Endo direto para um estagio (6 = porta)
//   endo01.setDoor(true/false)   -> finge porta fechada/aberta
//   endo01.setNight(1..7)        -> muda a noite
//   endo01.status()              -> mostra estagio e tempos restantes
//   endo01.jumpscare()           -> dispara o jumpscare agora
(function () {
  var CONFIG = {
    // Nivel de IA de 0 a 20 (0 = Endo nunca se move). Usado se getAi devolver null
    // e aiByNight nao tiver valor para a noite.
    ai: 1,
    // Nivel de IA por noite (indice 0 = noite 1). Preencha com os mesmos valores da Chica.
    // Use null numa noite para cair no "ai" acima.
    aiByNight: [1, 2, 3, 4, 6, 8, 10],
    // Segundos de noite sem nenhum movimento (1 hora do jogo ~ 89 s; 180 s = ate as 2 AM).
    startDelaySec: 180,
    // Noite atual (1 a 7). Se getNight devolver um numero, ele tem prioridade.
    night: 1,
    // Intervalo entre tentativas de movimento (o FNAF 1 usa ~4.97 s).
    moveIntervalMs: 4970,
    width: 1280,
    height: 720,
    imgDir: "resources/",

    // Estagios, na ordem da rota. 'cam' = onde a imagem aparece.
    // 'office' = escritorio com a camera fechada (Endo na porta).
    stages: [
      { id: "cam5parado", cam: "cam5",   img: "endo_cam5_parado.png" },
      { id: "cam5saindo", cam: "cam5",   img: "endo_cam5_saindo.png" },
      { id: "cam1b",      cam: "cam1b",  img: "endo_cam1b.png" },
      { id: "cam7",       cam: "cam7",   img: "endo_cam7.png" },
      { id: "cam2a",      cam: "cam2a",  img: "endo_cam2a.png" },
      { id: "cam2b",      cam: "cam2b",  img: "endo_cam2b.png" },
      { id: "porta",      cam: "office", img: "endo_porta.png" }
    ],
    doorStageId: "porta",
    // Para onde ele volta quando sai da porta (um deles e sorteado).
    retreatIds: ["cam1b", "cam5parado", "cam5saindo"],

    // Tempo na porta ate o jumpscare (segundos), por noite (indice 0 = noite 1).
    // Noites alem da lista usam o ultimo valor.
    attackSecByNight: [20, 17, 14, 10, 7],
    // Quanto o tempo cai cada vez que a camera e aberta (sorteia entre min e max).
    camOpenPenaltySec: [1, 2],
    // Tempo para ele sair da porta quando ela esta fechada (sorteia entre min e max).
    leaveSec: [7, 14],

    // Jumpscare: lista de frames PNG 1280x720 (pode ser so 1 imagem).
    jumpscare: {
      frames: [
        "endo_jumpscare_1.png",
        "endo_jumpscare_2.png",
        "endo_jumpscare_3.png",
        "endo_jumpscare_4.png"
      ],
      fps: 20,
      loops: 2,
      shake: 12,
      sound: "endo_jumpscare.mp3"   // "" se nao tiver som
    },

    // Porta por onde o Endo vem: "left" ou "right".
    doorSide: "left",

    // Detectado pelos dumps do F9.
    // 'cam5' | 'cam1b' | 'cam7' | 'cam2a' | 'cam2b' | 'office' (camera fechada) | null (outra camera)
    getCamera: function (app) {
      var list = app.run && app.run.rhObjectList;
      if (!list) return null;
      var byName = {};
      for (var i = 0; i < list.length; i++) {
        var o = list[i];
        if (o && o.hoOiList) byName[o.hoOiList.oilName] = o;
      }
      var follow = byName["control room follow"];
      var camOpen = follow && follow.rov && follow.rov.rvValues && follow.rov.rvValues[0] === 1;
      if (!camOpen) return "office";
      var map = {
        "5 backstage": "cam5",
        "1B dining area": "cam1b",
        "cam 7 bathrooms": "cam7",
        "cam 2A": "cam2a",
        "cam 2B": "cam2b"
      };
      for (var name in map) {
        var b = byName[name];
        if (b && b.roc && b.roc.rcImage === 166) return map[name];
      }
      return null;
    },
    // true so durante a noite (frame 2 = "Frame 1"; o menu e o frame 0).
    isPlaying: function (app) { return app.currentFrame === 2; },
    // true se a porta por onde o Endo vem esta fechada (esq: imagem 102, dir: 118).
    isDoorClosed: function (app) {
      var left = CONFIG.doorSide === "left";
      var name = left ? "left door" : "right door";
      var closedImg = left ? 102 : 118;
      var list = app.run && app.run.rhObjectList;
      if (!list) return false;
      for (var i = 0; i < list.length; i++) {
        var o = list[i];
        if (o && o.hoOiList && o.hoOiList.oilName === name)
          return !!(o.roc && o.roc.rcImage === closedImg);
      }
      return false;
    },
    // Nivel de IA lido do jogo (ex.: o mesmo da Chica), ou null para usar aiByNight/ai.
    // Preencher depois do dump do F9 com os objetos "chica AI".
    getAi: function (app) { return null; },
    // Numero da noite (1..7) lido do jogo, ou null para usar CONFIG.night.
    getNight: function (app) { return null; },
    // Chamado quando o jumpscare termina.
    onJumpscareEnd: function (app) { }
  };

  var state = {
    stage: 0,
    testMode: false,
    forcedCam: undefined,
    forcedDoor: undefined,
    images: {},
    loaded: 0,
    scare: null,
    wasPlaying: false,
    playStart: 0,
    door: null       // { attackLeft, leaveLeft, camWasOpen } (ms) enquanto esta na porta
  };
  var canvas = null, ctx = null, gameCanvas = null, scareAudio = null, lastT = 0;

  function getApp() {
    return window.game && window.game.application ? window.game.application : null;
  }
  function rnd(range) { return (range[0] + Math.random() * (range[1] - range[0])) * 1000; }
  function idx(id) {
    for (var i = 0; i < CONFIG.stages.length; i++) if (CONFIG.stages[i].id === id) return i;
    return -1;
  }
  function doorIdx() { return idx(CONFIG.doorStageId); }

  function loadImage(name) {
    if (!name || state.images[name]) return;
    var im = new Image();
    im.onload = function () { state.loaded++; };
    im.onerror = function () { console.warn("[endo01] imagem nao encontrada: " + CONFIG.imgDir + name); };
    im.src = CONFIG.imgDir + name;
    state.images[name] = im;
  }
  function loadAssets() {
    CONFIG.stages.forEach(function (s) { loadImage(s.img); });
    CONFIG.jumpscare.frames.forEach(loadImage);
    if (CONFIG.jumpscare.sound) {
      scareAudio = new Audio(CONFIG.imgDir + CONFIG.jumpscare.sound);
      scareAudio.preload = "auto";
    }
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
  function doorClosed() {
    if (state.forcedDoor !== undefined) return state.forcedDoor;
    var app = getApp();
    return app ? !!CONFIG.isDoorClosed(app) : false;
  }
  function night() {
    var app = getApp();
    var n = app ? CONFIG.getNight(app) : null;
    return (typeof n === "number" && n >= 1) ? n : CONFIG.night;
  }
  function aiLevel() {
    var app = getApp();
    var g = app ? CONFIG.getAi(app) : null;
    if (typeof g === "number" && g >= 0) return g;
    var t = CONFIG.aiByNight[night() - 1];
    if (typeof t === "number") return t;
    return CONFIG.ai;
  }
  function attackSeconds() {
    var t = CONFIG.attackSecByNight;
    return t[Math.min(night(), t.length) - 1];
  }
  function ready(im) { return im && im.complete && im.naturalWidth > 0; }

  // ---------- Estagios e porta ----------
  function enterStage(n) {
    state.stage = Math.max(0, Math.min(CONFIG.stages.length - 1, n | 0));
    if (state.stage === doorIdx()) {
      var sec = attackSeconds();
      state.door = {
        attackLeft: sec * 1000,
        leaveLeft: null,
        camWasOpen: currentCam() !== "office"
      };
      console.log("[endo01] na porta. jumpscare em " + sec + " s (noite " + night() + ")");
    } else {
      state.door = null;
    }
  }

  function leaveDoor() {
    var ids = CONFIG.retreatIds;
    var i = idx(ids[Math.floor(Math.random() * ids.length)]);
    console.log("[endo01] saiu da porta -> " + CONFIG.stages[i].id);
    enterStage(i);
  }

  // Roda em intervalos curtos; dt em ms.
  function updateDoor(dt) {
    var d = state.door;
    if (!d || state.scare) return;

    // Abriu a camera: o tempo ate o jumpscare cai.
    var camOpen = currentCam() !== "office";
    if (camOpen && !d.camWasOpen) {
      var pen = rnd(CONFIG.camOpenPenaltySec);
      d.attackLeft -= pen;
      console.log("[endo01] camera aberta: -" + (pen / 1000).toFixed(1) + " s (restam " +
        Math.max(0, d.attackLeft / 1000).toFixed(1) + " s)");
    }
    d.camWasOpen = camOpen;

    if (doorClosed()) {
      // Porta fechada: ele tenta sair; o tempo do jumpscare fica parado.
      if (d.leaveLeft === null) d.leaveLeft = rnd(CONFIG.leaveSec);
      d.leaveLeft -= dt;
      if (d.leaveLeft <= 0) leaveDoor();
    } else {
      // Porta aberta: cancela a saida e conta ate o jumpscare.
      d.leaveLeft = null;
      d.attackLeft -= dt;
      if (d.attackLeft <= 0) startJumpscare();
    }
  }

  // ---------- Jumpscare ----------
  function startJumpscare() {
    if (state.scare) return;
    state.scare = { start: performance.now() };
    state.door = null;
    console.log("[endo01] JUMPSCARE");
    if (scareAudio) {
      try {
        scareAudio.currentTime = 0;
        var pr = scareAudio.play();
        if (pr && pr.catch) pr.catch(function () {});
      } catch (e) {}
    }
  }

  function drawJumpscare(now) {
    var j = CONFIG.jumpscare, frames = j.frames;
    var elapsed = now - state.scare.start;
    var total = frames.length * j.loops * (1000 / j.fps);
    if (elapsed >= total) {
      state.scare = null;
      enterStage(0);
      var app = getApp();
      if (app) CONFIG.onJumpscareEnd(app);
      return;
    }
    var im = state.images[frames[Math.floor(elapsed / (1000 / j.fps)) % frames.length]];
    var dx = 0, dy = 0;
    if (j.shake > 0) {
      dx = (Math.random() * 2 - 1) * j.shake;
      dy = (Math.random() * 2 - 1) * j.shake;
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    if (ready(im)) ctx.drawImage(im, dx, dy, CONFIG.width, CONFIG.height);
  }

  // ---------- Loop de desenho (tambem atualiza o tempo da porta) ----------
  function draw(now) {
    requestAnimationFrame(draw);
    var dt = lastT ? Math.min(now - lastT, 200) : 0;
    lastT = now;
    if (!ctx) return;
    syncOverlay();
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

    if (state.scare) { drawJumpscare(now); return; }
    if (!playing()) return;

    updateDoor(dt);

    var cam = currentCam();
    var s = CONFIG.stages[state.stage];
    if (!cam || !s || s.cam !== cam) return;
    var im = state.images[s.img];
    if (ready(im)) ctx.drawImage(im, 0, 0, CONFIG.width, CONFIG.height);
  }

  // ---------- IA de movimento ----------
  // A cada intervalo sorteia 1..20; se <= nivel, avanca um estagio.
  // Na porta nao se move por aqui: quem manda e o tempo da porta.
  function tick() {
    var isP = playing();
    if (isP && !state.wasPlaying) {          // comecou uma noite
      state.playStart = performance.now();
      enterStage(0);
    }
    state.wasPlaying = isP;
    if (state.scare || !isP) return;
    if (!state.testMode && performance.now() - state.playStart < CONFIG.startDelaySec * 1000) return;
    var ai = aiLevel();
    if (ai <= 0) return;
    if (state.stage >= doorIdx()) return;
    var roll = 1 + Math.floor(Math.random() * 20);
    if (roll <= ai) {
      enterStage(state.stage + 1);
      console.log("[endo01] estagio " + state.stage + " (" + CONFIG.stages[state.stage].id + ")");
    }
  }

  function init() {
    if (!createOverlay()) { console.warn("[endo01] MMFCanvas nao encontrado"); return; }
    loadAssets();
    requestAnimationFrame(draw);
    setInterval(tick, CONFIG.moveIntervalMs);
  }

  window.endo01 = {
    config: CONFIG,
    state: state,
    test: function (on) { state.testMode = on !== false; },
    forceCamera: function (cam) { state.forcedCam = cam === undefined ? undefined : cam; },
    setDoor: function (closed) { state.forcedDoor = closed === undefined ? undefined : !!closed; },
    setNight: function (n) { CONFIG.night = Math.max(1, n | 0); },
    setStage: function (n) { enterStage(n); },
    status: function () {
      var d = state.door;
      return {
        stage: state.stage,
        id: CONFIG.stages[state.stage].id,
        night: night(),
        ai: aiLevel(),
        attackLeftSec: d ? +(d.attackLeft / 1000).toFixed(1) : null,
        leaveLeftSec: d && d.leaveLeft !== null ? +(d.leaveLeft / 1000).toFixed(1) : null
      };
    },
    jumpscare: startJumpscare,
    reset: function () { state.scare = null; enterStage(0); }
  };

  window.addEventListener("load", init, false);
})();
