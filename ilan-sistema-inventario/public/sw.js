// Service worker mínimo: o Chrome exige um para oferecer "Instalar aplicativo".
// Não guarda páginas em cache, para ninguém ver dados desatualizados. Sem internet, mostra um aviso.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Sem conexão</title><body style="font-family:sans-serif;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:16px">' +
            '<div><h1 style="font-size:20px">Sem conexão com a internet</h1><p>O Inventário ILAN precisa de internet. Verifique a conexão e tente de novo.</p>' +
            '<button onclick="location.reload()" style="margin-top:12px;padding:10px 20px;border:0;border-radius:6px;background:#fff;color:#111827;font-size:16px">Tentar de novo</button></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
    )
  )
})
