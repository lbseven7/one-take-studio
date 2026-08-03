(function(){
  // ============================================================
  // GOOGLE ANALYTICS 4 (GA4) — Take Um Studio
  // ============================================================
  // COLE AQUI o seu Measurement ID do GA4:
  //   GA4 -> Administrador -> Fluxos de dados -> Web -> ID de medida
  var GA_ID = 'G-XXXXXXXXXX';
  // ============================================================

  var gtag = function(){ (window.dataLayer = window.dataLayer || []).push(arguments); };
  window.gtag = gtag;

  if(GA_ID && GA_ID.indexOf('G-') === 0){
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: true });
  }

  // Eventos de conversão disparados pelo site:
  //   tuTrack('begin_checkout')     - clicou em "Comprar" (Hotmart)
  //   tuTrack('pro_activated')      - ativou uma chave Pro com sucesso
  //   tuTrack('newsletter_signup')  - assinou a newsletter
  //   tuTrack('pix_click')          - copiou a chave Pix (apoio)
  function tuTrack(name, params){
    try{
      if(GA_ID && GA_ID.indexOf('G-') === 0){
        window.gtag('event', name, params || {});
      }
    }catch(e){}
  }
  window.tuTrack = tuTrack;

  // ============================================================
  // PARA MARCAR COMO CONVERSAO NO GA4:
  //   Administrador -> Eventos -> clique no evento ->
  //   "Marcar como conversão" em: begin_checkout, pro_activated,
  //   newsletter_signup
  // ============================================================
})();
