# FNAF-1-HTML5
The original Five Nights At Freddy's, decompiled, then recompiled for HTML5.

## Endo-01 (fangame)

Estrutura do projeto:

```
index.html
README.md
src/
  Runtime.js        (motor do Clickteam + Endo-01 e debug F9 incorporados no final)
resources/
  FNAF1HTML5.cch
  ... imagens e sons do jogo ...
  endo_cam5_parado.png
  endo_cam5_saindo.png
  endo_cam1b.png
  endo_cam7.png
  endo_cam2a.png
  endo_cam2b.png
  endo_porta.png
  endo_jumpscare_1..4.png
  endo_jumpscare.mp3
```

As imagens do Endo-01 sao PNGs com fundo transparente, 1280x720, na pasta `resources/`.
Modo de teste (console, F12): `endo01.test(true)`, `endo01.forceCamera('cam5')`, `endo01.setStage(0..6)`.
