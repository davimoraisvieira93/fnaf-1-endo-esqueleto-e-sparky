// debug_endo.js - despeja o estado do jogo no console ao apertar F9.
// Uso: abra o jogo, va ate a camera desejada (ex.: CAM 5), aperte F9,
// abra o console (F12) e me mande o texto que apareceu.
(function () {
  function dump() {
    var g = window.game;
    if (!g || !g.application) { console.log("[debug] window.game nao encontrado"); return; }
    var app = g.application;
    var out = {
      frameIndex: app.currentFrame,
      frameName: app.frame && app.frame.frameName,
      globalValues: (app.gValues || []).slice(0, 80),
      objects: []
    };
    var run = app.run;
    if (run && run.rhObjectList) {
      for (var i = 0; i < run.rhObjectList.length; i++) {
        var o = run.rhObjectList[i];
        if (!o) continue;
        out.objects.push({
          name: o.hoOiList ? o.hoOiList.oilName : "?",
          x: o.hoX, y: o.hoY,
          image: o.roc ? o.roc.rcImage : undefined,
          values: o.rov && o.rov.rvValues ? o.rov.rvValues.slice(0, 10) : undefined
        });
      }
    }
    console.log("[debug] " + JSON.stringify(out));
    console.log("[debug] objetos: " + out.objects.length);
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "F9") { e.preventDefault(); dump(); }
  });
})();
