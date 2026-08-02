(function(){
  const STORE = 'ia_state';
  const CONFIG_ID = 'config';
  const DEFAULT_MODEL = 'gemini-3.6-flash';

  async function getConfig(){
    const defaults = { provider: 'gemini', model: DEFAULT_MODEL, apiKey: '' };
    try{
      const c = await OneTakeDB.get(STORE, CONFIG_ID);
      return Object.assign({}, defaults, c || {});
    }catch(e){
      return defaults;
    }
  }

  async function setConfig(config){
    await OneTakeDB.put(STORE, { id: CONFIG_ID, provider: 'gemini', ...config });
  }

  async function hasKey(){
    const c = await getConfig();
    return !!(c.apiKey && c.apiKey.trim());
  }

  function notConfiguredError(){
    return new Error('IA ainda não configurada. Abra "Configuração da IA" na home e cole sua chave do Google Gemini.');
  }

  async function callGemini({ system, prompt, json = false }){
    const config = await getConfig();
    const apiKey = (config.apiKey || '').trim();
    if(!apiKey) throw notConfiguredError();
    const model = (config.model || DEFAULT_MODEL).trim();
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

    const body = {
      contents: [{ role: 'user', parts: [{ text: system + '\n\n---\n\n' + prompt }] }],
      generationConfig: json ? { responseMimeType: 'application/json' } : {}
    };

    let res;
    try{
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }catch(e){
      throw new Error('Sem conexão com a internet. Verifique sua rede e tente de novo.');
    }

    if(!res.ok){
      if(res.status === 429){
        throw new Error('Cota do modelo "' + model + '" esgotada (429). Abra Configuração da IA e troque o modelo, ou aguarde o reset diário da cota.');
      }
      let msg = 'Erro ' + res.status + ' na API do Gemini';
      try{
        const err = await res.json();
        if(err.error && err.error.message) msg = err.error.message;
      }catch(e){}
      throw new Error(msg);
    }

    const data = await res.json();
    const text = (data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text) || '';
    if(!text.trim()) throw new Error('A IA não retornou resposta. Tente de novo.');

    if(json){
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      try{ return JSON.parse(cleaned); }
      catch(e){ throw new Error('A IA não retornou um formato válido. Tente de novo.'); }
    }
    return text.trim();
  }

  async function testConnection(){
    const text = await callGemini({
      system: 'Responda apenas com a palavra: OK',
      prompt: 'teste de conexão'
    });
    return text;
  }

  window.TakeUmAI = { getConfig, setConfig, hasKey, callGemini, testConnection };
})();
