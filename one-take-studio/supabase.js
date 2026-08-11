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

  const SupabaseChaves = {
    configured: configured,

    // ID persistente deste navegador/aparelho. Usado para registrar a
    // ativação no servidor e controlar o limite de aparelhos por chave.
    dispositivoId: function(){
      try{
        let id = localStorage.getItem('tu-dispositivo-id');
        if(!id){
          id = 'dev-' + (window.crypto && window.crypto.randomUUID
            ? window.crypto.randomUUID()
            : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
          localStorage.setItem('tu-dispositivo-id', id);
        }
        return id;
      }catch(e){
        return 'dev-' + Date.now().toString(36);
      }
    },

    async validarCodigo(codigo){
      if(!configured()) return false;
      const r = await api('/rest/v1/rpc/validar_pro_codigo', {
        method: 'POST',
        body: { p_codigo: String(codigo || '').trim() }
      });
      return !!r;
    },

    async validarChave(chave){
      if(!configured()) return false;
      const r = await api('/rest/v1/rpc/validar_pro_chave', {
        method: 'POST',
        body: { p_chave: String(chave || '').trim() }
      });
      return !!r;
    },

    async ativarDispositivo(chave, dispositivo){
      if(!configured()) return { status: 'indisponivel' };
      try{
        const r = await api('/rest/v1/rpc/ativar_dispositivo', {
          method: 'POST',
          body: { p_chave: String(chave || '').trim(), p_dispositivo: String(dispositivo || '') }
        });
        if(r && typeof r === 'object' && ('status' in r)) return r;
        return { status: 'erro' };
      }catch(e){
        return { status: 'erro' };
      }
    },

    async validarDispositivo(chave, dispositivo){
      if(!configured()) return { ok: false };
      try{
        const r = await api('/rest/v1/rpc/validar_dispositivo', {
          method: 'POST',
          body: { p_chave: String(chave || '').trim(), p_dispositivo: String(dispositivo || '') }
        });
        if(r && typeof r === 'object' && ('ok' in r)) return r;
        return { ok: false };
      }catch(e){
        return { ok: false };
      }
    },

    async listarDispositivos(chave){
      if(!configured()) return [];
      try{
        const r = await api('/rest/v1/rpc/listar_dispositivos', {
          method: 'POST',
          body: { p_chave: String(chave || '').trim() }
        });
        return Array.isArray(r) ? r : [];
      }catch(e){
        return [];
      }
    },

    async removerDispositivo(chave, dispositivo){
      if(!configured()) return false;
      try{
        const r = await api('/rest/v1/rpc/remover_dispositivo', {
          method: 'POST',
          body: { p_chave: String(chave || '').trim(), p_dispositivo: String(dispositivo || '') }
        });
        return !!r;
      }catch(e){
        return false;
      }
    }
  };

  window.SupabaseLeads = SupabaseLeads;
  window.SupabaseChaves = SupabaseChaves;
})();
