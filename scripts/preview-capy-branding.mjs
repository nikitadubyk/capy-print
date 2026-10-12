import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = {
  "/capy-loader.json": ["public/branding/capy-loader.json", "application/json"],
  "/capy-loader.svg": ["public/branding/capy-loader.svg", "image/svg+xml"],
  "/icon.svg": ["app/icon.svg", "image/svg+xml"],
  "/favicon.ico": ["app/favicon.ico", "image/x-icon"],
};
const html = `<!doctype html>
<html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="/favicon.ico"><title>Капибара — предпросмотр</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#fafaf8;color:#53392c;font:16px/1.5 system-ui}main{max-width:780px;margin:40px auto;padding:24px}h1{font-size:28px;line-height:1.2}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{border:1px solid #dedfe2;border-radius:24px;background:white;padding:24px}.stage{display:flex;align-items:center;justify-content:center;height:220px;background:#fafaf8;border-radius:18px}.dark{background:#202c29}.loader{width:96px;height:96px}button,a{color:#2e6550}button{padding:10px 16px;border:1px solid #c6d9ca;border-radius:12px;background:#edf5eb;cursor:pointer}input{width:100%;margin:16px 0}.sizes{display:flex;gap:18px;align-items:center;min-height:80px}.sizes img{display:block}small{color:#586271}#status{min-height:24px}@media(max-width:540px){main{margin:0 auto;padding:20px}.grid{grid-template-columns:1fr}h1{font-size:24px}}
</style>
<main><h1>Капибара Capy Print</h1><p>96 × 96 px · Lottie · 30 кадров/с · цикл 3,2 секунды</p>
<div class="grid"><section class="card"><h2>Загрузка</h2><div class="stage" id="stage"><div class="loader" id="loader" role="img" aria-label="Капибара загружает приложение"></div></div><p id="status" role="status">Подключаем проигрыватель…</p><button id="play">Пауза</button> <button id="theme">Тёмный фон</button><label for="frame"><br>Кадр анимации</label><input id="frame" type="range" min="0" max="95" value="0"><a href="/capy-loader.json" download>Скачать Lottie JSON</a></section>
<section class="card"><h2>Favicon</h2><div class="stage"><img src="/icon.svg" width="128" height="128" alt="Капибара"></div><div class="sizes">${[16, 32, 48, 64].map((size) => `<div><img src="/favicon.ico" width="${size}" height="${size}" alt="Иконка ${size} px"><small>${size} px</small></div>`).join("")}</div><a href="/favicon.ico" download>Скачать ICO</a> · <a href="/icon.svg" download>Скачать SVG</a></section></div>
<p><small>При сокращении движения в настройках системы анимация изначально приостановлена.</small></p></main>
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.13.0/build/player/lottie_light.min.js"></script>
<script>
const status = document.getElementById('status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const play = document.getElementById('play');
if (!window.lottie) {
  status.textContent = 'Не удалось загрузить проигрыватель. Проверьте соединение и обновите страницу.';
  document.getElementById('loader').innerHTML = '<img src="/capy-loader.svg" width="96" height="96" alt="Капибара">';
  play.disabled = true;
} else {
  const animation = lottie.loadAnimation({container:document.getElementById('loader'), renderer:'svg', loop:true, autoplay:!reduced, path:'/capy-loader.json'});
  window.capyPreview = animation;
  play.textContent = reduced ? 'Воспроизвести' : 'Пауза';
  animation.addEventListener('DOMLoaded', () => {status.textContent = 'Анимация готова'; document.body.dataset.ready = 'true';});
  animation.addEventListener('data_failed', () => {status.textContent = 'Ошибка чтения Lottie JSON';});
  animation.addEventListener('enterFrame', () => {document.getElementById('frame').value = Math.floor(animation.currentFrame);});
  play.onclick = () => { if(animation.isPaused){animation.play();play.textContent='Пауза';}else{animation.pause();play.textContent='Воспроизвести';} };
  document.getElementById('frame').oninput = (event) => {animation.goToAndStop(Number(event.target.value),true);play.textContent='Воспроизвести';};
}
document.getElementById('theme').onclick = () => document.getElementById('stage').classList.toggle('dark');
</script></html>`;

const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://127.0.0.1").pathname;
  if (path === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }
  const file = files[path];
  if (!file) {
    response.writeHead(404);
    response.end();
    return;
  }
  try {
    response.writeHead(200, { "Content-Type": file[1] });
    response.end(await readFile(resolve(root, file[0])));
  } catch {
    response.writeHead(404);
    response.end();
  }
});
server.listen(8796, "127.0.0.1", () =>
  console.log("Предпросмотр: http://127.0.0.1:8796")
);
