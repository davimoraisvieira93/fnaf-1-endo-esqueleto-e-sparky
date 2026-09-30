# FNAF-1-HTML5
The original Five Nights At Freddy's, decompiled, then recompiled for HTML5.

## Endo-01 (fangame)

Estrutura do projeto:

```
index.html
preloader.png       (tela de carregamento)
README.md
src/
  Runtime.js        (motor do Clickteam, sem alteracoes)
  endo01.js         (IA e imagens do Endo-01)
  debug_endo.js     (opcional: F9 despeja o estado do jogo no console)
resources/
  FNAF1HTML5.cch
  ... imagens e sons do jogo ...
  endo_cam5_parado.png      (estagio 0: CAM 5, parado)
  endo_cam5_saindo.png      (estagio 1: CAM 5, saindo)
  endo_cam1b.png            (estagio 2: CAM 1B)
  endo_cam7.png             (estagio 3: CAM 7)
  endo_cam2a.png            (estagio 4: CAM 2A)
  endo_cam2b.png            (estagio 5: CAM 2B)
  endo_porta.png            (estagio 6: escritorio, Endo na porta)
  endo_jumpscare_1.png      (jumpscare, frame 1)
  endo_jumpscare_2.png      (jumpscare, frame 2)
  endo_jumpscare_3.png      (jumpscare, frame 3)
  endo_jumpscare_4.png      (jumpscare, frame 4)
  endo_jumpscare.mp3        (som do jumpscare, opcional)
```

As imagens do Endo-01 sao PNGs com fundo transparente, 1280x720, na pasta `resources/`.
Os quatro frames do jumpscare podem ser so um (repita o mesmo nome ou edite a lista `jumpscare.frames` em `endo01.js`).

Comandos de teste (console, F12):

```
endo01.test(true)              liga o modo de teste (ignora o atraso de inicio)
endo01.forceCamera('cam5')     'cam5','cam1b','cam7','cam2a','cam2b','office' ou null
endo01.setStage(0..6)          move o Endo (6 = porta)
endo01.setDoor(true/false)     finge porta fechada/aberta
endo01.setNight(1..7)          muda a noite
endo01.status()                estagio, IA e tempos restantes
endo01.jumpscare()             dispara o jumpscare (e mata o jogador no fim)
endo01.kill(n)                 vai direto para o frame n do jogo (teste da morte)
```
