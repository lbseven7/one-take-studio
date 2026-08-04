// Supabase backend helper for Take Um Studio — REST puro, sem SDK.
// Tudo chama direto a API do Supabase, então continua 100% estático.
//
// COMO CONFIGURAR:
//  1. Crie um projeto em supabase.com (plano grátis) e rode o script
//     supabase-schema.sql no SQL Editor.
//  2. Em Settings → API, copie o Project URL e a anon key.
//  3. Cole abaixo. A anon key é pública por design (RLS protege a leitura).
//  4. Crie seu usuário admin em Authentication → Users → Add user.
(function(){
  const SUPA_URL = 'https://hnhzdfrysbtmyrzfeiep.supabase.co';
  const SUPA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHpkZnJ5c2J0bXlyemZlaWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzgxNjUsImV4cCI6MjEwMTQ1NDE2NX0.m-1k8QVaUWWYV4QeoOCLrF5YAB78aDiT0MNN2yJtot4';
  const LEADS_TABLE = 'leads';
  const SESSION_KEY = 'tu-supa-session';

  function configured(){
    return SUPA_URL.indexOf('SEU-PROJETO') === -1 &&
           SUPA_ANON_KEY.indexOf('sua-anon') === -1;
  }

  function getSession(){
    try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch(e){ return null; }
  }

  function setSession(s){
    if(s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  async function api(path, opts){
    opts = opts || {};
    const headers = {
      'apikey': SUPA_ANON_KEY,
      'Content-Type': 'application/json'
    };
    const s = getSession();
    if(s && s.access_token) headers['Authorization'] = 'Bearer ' + s.access_token;
    const res = await fetch(SUPA_URL + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if(!res.ok){
      let m = res.statusText;
      try{
        const j = await res.json();
        m = j.message || j.msg || j.error_description || m;
      }catch(e){}
      throw new Error(m);
    }
    if(res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    return ct.indexOf('json') !== -1 ? res.json() : res.text();
  }

  const SupabaseLeads = {
    configured: configured,
    session: getSession,

    async login(email, senha){
      const data = await api('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email: email, password: senha }
      });
      setSession(data);
      return data;
    },

    logout(){
      setSession(null);
    },

    async listar(){
      if(!configured()) return [];
      if(!getSession()) return [];
      const rows = await api('/rest/v1/' + LEADS_TABLE + '?select=*&order=capturado_em.desc');
      return (rows || []).map(r => ({
        id: r.id,
        email: r.email,
        acao: r.acao,
        capturadoEm: r.capturado_em
      }));
    },

    async capture(email, acao){
      if(!configured()) return;
      await api('/rest/v1/' + LEADS_TABLE, {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: { email: email, acao: acao || null, capturado_em: new Date().toISOString() }
      });
    },

    async excluir(id){
      if(!configured()) return;
      await api('/rest/v1/' + LEADS_TABLE + '?id=eq.' + id, { method: 'DELETE' });
    }
  };

  window.SupabaseLeads = SupabaseLeads;
})();
