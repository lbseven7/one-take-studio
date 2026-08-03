(function(root){
  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var SALT = 'takeum-pro-solo-2026';

  function fnv1a(str, seed){
    var h = (seed >>> 0) || 2166136261;
    for(var i = 0; i < str.length; i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function checksum(payload){
    var h1 = fnv1a(payload + SALT);
    var h2 = fnv1a(SALT + payload);
    var out = '';
    for(var i = 0; i < 5; i++){
      var b1 = (h1 >>> ((i * 3) % 29)) & 31;
      var b2 = (h2 >>> ((i * 7) % 31)) & 31;
      out += ALPHABET[(b1 ^ b2) % 32];
    }
    return out;
  }

  function randomGroup(){
    var g = '';
    for(var i = 0; i < 5; i++) g += ALPHABET[Math.floor(Math.random() * 32)];
    return g;
  }

  function normalize(key){
    return String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function gerar(){
    var p = randomGroup() + randomGroup() + randomGroup() + randomGroup();
    return 'TAKEUM-' + p.slice(0,5) + '-' + p.slice(5,10) + '-' + p.slice(10,15) + '-' + p.slice(15,20) + '-' + checksum(p);
  }

  function validar(key){
    var n = normalize(key);
    if(n.slice(0, 6) !== 'TAKEUM') return false;
    var rest = n.slice(6);
    if(rest.length !== 25) return false;
    var payload = rest.slice(0, 20);
    var expected = checksum(payload);
    var got = rest.slice(20, 25);
    var diff = 0;
    for(var i = 0; i < 5; i++) diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
    return diff === 0;
  }

  var api = { gerar: gerar, validar: validar, normalize: normalize, checksum: checksum };
  if(typeof module !== 'undefined' && module.exports){ module.exports = api; }
  if(typeof window !== 'undefined'){ window.TakeUmChave = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
