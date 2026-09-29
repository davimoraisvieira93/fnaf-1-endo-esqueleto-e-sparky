# FNAF-1-HTML5
The original Five Nights At Freddy's, decompiled, then recompiled for HTML5.

## Endo-01 (fangame)

Estrutura do projeto:

```
index.html
README.md
src/
  Runtime.js        (motor do Clickteam, sem alteracoes)
  endo01.js         (IA e imagens do Endo-01)
  debug_endo.js     (opcional: F9 despeja o estado do jogo no console)
resources/
  FNAF1HTML5.cch
  ... imagens e sons do jogo ...
  endo_cam5_parado.png
  endo_cam5_saindo.png
  endo_cam1b.png
  endo_cam2a.png
  endo_cam2b.png
```

As imagens do Endo-01 sao PNGs com fundo transparente, 1280x720, na pasta `resources/`.
Modo de teste (console, F12): `endo01.test(true)`, `endo01.forceCamera('cam5')`, `endo01.setStage(0..4)`.
