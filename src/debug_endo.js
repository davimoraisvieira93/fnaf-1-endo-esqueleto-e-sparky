// debug_endo.js - coleta o estado do jogo em varias situacoes e gera um relatorio compacto.
//   F9  -> tira uma "foto" do estado (pergunta o nome da situacao: A, B, C...)
//   F10 -> copia o relatorio para a area de transferencia (cole no chat)
//   F8  -> apaga todas as fotos e recomeca
// O relatorio traz a foto completa so quando a tela (frame) muda; nas demais
// traz apenas o que MUDOU em relacao a foto anterior. Assim o texto fica pequeno.
(function () {
  var snaps = [];

  function getApp() { return window.game && window.game.application; }

  function take() {
    var a = getApp();
    if (!a || !a.run) { console.log("[debug] jogo ainda nao esta pronto"); return null; }
    var s = {
      frame: a.currentFrame,
      frameName: a.frame && a.frame.frameName,
      g: (a.gValues || []).slice(0, 80),
      o: [],
      ocultos: 0
    };
    var L = a.run.rhObjectList || [];
    for (var i = 0; i < L.length; i++) {
      var o = L[i];
      if (!o || (o.hoFlags & 1)) continue;              // destruido
      if (o.ros && (o.ros.rsFlags & 1)) { s.ocultos++; continue; }  // escondido
      s.o.push({
        i: i,
        n: o.hoOiList ? o.hoOiList.oilName : "?",
        t: o.hoType,
        x: o.hoX, y: o.hoY,
        img: o.roc ? o.roc.rcImage : undefined,
        an: o.roc ? o.roc.rcAnim : undefined,
        v: o.rov && o.rov.rvValues ? o.rov.rvValues.slice(0, 8) : undefined
      });
    }
    return s;
  }

  function diff(a, b) {
    var d = { g: [], novos: [], sumiram: [], mudou: [] };
    var n = Math.max(a.g.length, b.g.length);
    for (var i = 0; i < n; i++) if (a.g[i] !== b.g[i]) d.g.push([i, a.g[i], b.g[i]]);
    var ma = {}, mb = {}, k;
    a.o.forEach(function (o) { ma[o.i] = o; });
    b.o.forEach(function (o) { mb[o.i] = o; });
    for (k in mb) {
      if (!ma[k]) d.novos.push(mb[k]);
      else if (JSON.stringify(ma[k]) !== JSON.stringify(mb[k])) d.mudou.push({ de: ma[k], para: mb[k] });
    }
    for (k in ma) if (!mb[k]) d.sumiram.push(ma[k]);
    return d;
  }

  function report() {
    var out = [];
    for (var k = 0; k < snaps.length; k++) {
      var cur = snaps[k], prev = snaps[k - 1];
      if (!prev || prev.s.frame !== cur.s.frame) out.push({ situacao: cur.label, completo: cur.s });
      else out.push({ situacao: cur.label, comparado_com: prev.label, dif: diff(prev.s, cur.s) });
    }
    return JSON.stringify(out);
  }

  function nextLabel() { return String.fromCharCode(65 + snaps.length); }

  function snapshot() {
    var s = take();
    if (!s) return;
    var label = prompt("Nome da situacao (ex.: A menu, B escritorio, C porta fechada...):", nextLabel());
    if (!label) return;
    snaps = snaps.filter(function (x) { return x.label !== label; });
    snaps.push({ label: label, s: s });
    console.log("[debug] '" + label + "' salvo: frame " + s.frame + " (" + s.frameName + "), " +
      s.o.length + " objetos visiveis, " + s.ocultos + " ocultos. Fotos: " + snaps.length);
  }

  function copyReport() {
    if (!snaps.length) { console.log("[debug] nenhuma foto ainda (aperte F9 primeiro)"); return; }
    var txt = report();
    console.log("[debug] relatorio: " + txt.length + " caracteres");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        function () { console.log("[debug] COPIADO. Cole no chat."); },
        function () { console.log("[debug] nao consegui copiar; texto abaixo:"); console.log(txt); });
    } else { console.log(txt); }
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "F9") { e.preventDefault(); snapshot(); }
    else if (e.key === "F10") { e.preventDefault(); copyReport(); }
    else if (e.key === "F8") { e.preventDefault(); snaps = []; console.log("[debug] fotos apagadas"); }
  });

  window.endoDebug = { snaps: snaps, take: take, diff: diff, report: report };
})();
