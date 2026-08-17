(function () {
  // Dentro do app (iframe do index.html) o botão de voltar já existe no topo.
  try {
    if (window.parent && window.parent !== window && window.parent.TakeUmShell) return;
  } catch (e) {}

  // No desktop o usuário tem o voltar do navegador.
  if (window.matchMedia('(min-width: 861px)').matches) return;

  // Páginas que já têm um link de volta (ex.: blog).
  if (document.querySelector('.back a')) return;

  var dirs = location.pathname.split('/').filter(Boolean);
  dirs.pop();
  var home = dirs.length ? '../'.repeat(dirs.length) + 'index.html' : 'index.html';

  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M15 18l-6-6 6-6"/></svg>';

  var btn = document.createElement('a');
  btn.className = 'tu-back';
  btn.href = home;
  btn.setAttribute('aria-label', 'Voltar ao Take Um Studio');
  btn.addEventListener('click', function (e) {
    if (history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  var host = document.querySelector('header') || document.querySelector('.topbar');
  if (host) {
    btn.textContent = '← Voltar';
    host.insertBefore(btn, host.firstChild);
  } else {
    btn.classList.add('tu-back--float');
    btn.innerHTML = ARROW_SVG;
    document.body.appendChild(btn);
  }
})();
