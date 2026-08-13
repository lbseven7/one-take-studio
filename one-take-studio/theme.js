(function () {
  var KEY = 'tu-theme';
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) {}
    return null;
  }

  function apply(t) {
    var light = t === 'light';
    root.classList.toggle('light', light);
    if (meta) meta.setAttribute('content', light ? '#ffffff' : '#0d0c0a');
  }

  apply(read() || 'dark');

  window.TuTheme = {
    get: function () { return root.classList.contains('light') ? 'light' : 'dark'; },
    set: function (t) {
      apply(t);
      try { localStorage.setItem(KEY, t); } catch (e) {}
    },
    toggle: function () {
      window.TuTheme.set(window.TuTheme.get() === 'light' ? 'dark' : 'light');
    }
  };

  // Sincroniza shell <-> iframes e abas abertas do mesmo site
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) apply(e.newValue || 'dark');
  });
})();
