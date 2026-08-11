-- Schema do backend de leads (Supabase / Postgres).
-- Rode no SQL Editor do seu projeto (Supabase Dashboard → SQL Editor).
--
-- Regras de segurança (RLS):
--   * anon (público): pode só INSERIR leads  -> captura no aviso de limite
--   * authenticated (você): pode LER e EXCLUIR -> página admin (leads.html)
-- Nada de chave service_role é exposta no site.

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  email text not null,
  acao text,
  capturado_em timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_anon_insert" on public.leads;
create policy "leads_anon_insert" on public.leads
  for insert to anon with check (true);

drop policy if exists "leads_auth_select" on public.leads;
create policy "leads_auth_select" on public.leads
  for select to authenticated using (true);

drop policy if exists "leads_auth_delete" on public.leads;
create policy "leads_auth_delete" on public.leads
  for delete to authenticated using (true);

-- ============================================================
-- Chaves Pro (fecha o bypass do paywall)
-- ------------------------------------------------------------
-- O site SÓ ativa uma chave se ela existir nesta tabela. A
-- consulta é feita por função RPC (retorna apenas true/false),
-- então a tabela em si não fica legível pelo anon — nada vaza.
-- ------------------------------------------------------------
-- COMO CADASTRAR UMA COMPRA (você, admin):
--  1. Gere a chave do número de transação (no Node, dentro da
--     pasta one-take-studio):
--       node -e "const c=require('./chave-core.js'); console.log(c.gerarDeCodigo('SEU-CODIGO-DA-COMPRA'))"
--  2. Insira no SQL Editor:
--       insert into public.chaves_pro (codigo, chave)
--       values ('SEU-CODIGO-DA-COMPRA', 'TAKEUM-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
--  Feito isso, o comprador recupera a chave na página de resgate
--  com o próprio código e ativa no site — agora validado online.
-- ============================================================

create table if not exists public.chaves_pro (
  id bigint generated always as identity primary key,
  codigo text not null unique,
  chave text not null unique,
  criada_em timestamptz not null default now()
);

alter table public.chaves_pro enable row level security;

drop function if exists public.validar_pro_codigo(text);
create or replace function public.validar_pro_codigo(p_codigo text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(codigo, '[^A-Za-z0-9]', '', 'g'))
        = upper(regexp_replace(p_codigo, '[^A-Za-z0-9]', '', 'g'))
  );
$$;
grant execute on function public.validar_pro_codigo(text) to anon, authenticated;

drop function if exists public.validar_pro_chave(text);
create or replace function public.validar_pro_chave(p_chave text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(chave, '[^A-Za-z0-9]', '', 'g'))
        = upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'))
  );
$$;
grant execute on function public.validar_pro_chave(text) to anon, authenticated;

-- ============================================================
-- Controle de aparelhos por chave Pro (anti-compartilhamento)
-- ------------------------------------------------------------
-- Uma chave pode estar ativa em até LIMITE (3) aparelhos. Se um
-- aparelho novo ativar além do limite, o MENOS USADO é desativado
-- (evicção LRU). Quem compartilha a chave perde os aparelhos que
-- não usa; quem pagou nunca fica preso, pois basta abrir o app
-- (revalidação a cada 48h) para registrar o aparelho de novo.
--
-- Nenhuma tabela é legível pelo anon diretamente: todo acesso
-- passa por funções RPC com security definer (a chave é a senha).
-- ============================================================

create table if not exists public.chaves_ativos (
  id bigint generated always as identity primary key,
  chave text not null,
  dispositivo text not null,
  ultimo_acesso timestamptz not null default now(),
  ativado_em timestamptz not null default now(),
  constraint uq_chave_dispositivo unique (chave, dispositivo)
);

alter table public.chaves_ativos enable row level security;

drop function if exists public.ativar_dispositivo(text, text);
create or replace function public.ativar_dispositivo(p_chave text, p_dispositivo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
  v_limite int := 3;
  v_total int;
begin
  v_chave := upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'));
  if not exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(chave, '[^A-Za-z0-9]', '', 'g')) = v_chave
  ) then
    return 'chave_invalida';
  end if;

  insert into public.chaves_ativos (chave, dispositivo, ultimo_acesso, ativado_em)
  values (v_chave, p_dispositivo, now(), now())
  on conflict (chave, dispositivo) do update
    set ultimo_acesso = now();

  select count(*) into v_total
  from public.chaves_ativos
  where chave = v_chave;

  if v_total > v_limite then
    delete from public.chaves_ativos
    where id in (
      select id from public.chaves_ativos
      where chave = v_chave and dispositivo <> p_dispositivo
      order by ultimo_acesso asc
      limit (v_total - v_limite)
    );
  end if;

  return 'ok';
end;
$$;
grant execute on function public.ativar_dispositivo(text, text) to anon, authenticated;

drop function if exists public.validar_dispositivo(text, text);
create or replace function public.validar_dispositivo(p_chave text, p_dispositivo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
  v_hit boolean;
begin
  v_chave := upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'));
  if not exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(chave, '[^A-Za-z0-9]', '', 'g')) = v_chave
  ) then
    return false;
  end if;
  select exists(
    select 1 from public.chaves_ativos
    where chave = v_chave and dispositivo = p_dispositivo
  ) into v_hit;
  if v_hit then
    update public.chaves_ativos
    set ultimo_acesso = now()
    where chave = v_chave and dispositivo = p_dispositivo;
  end if;
  return v_hit;
end;
$$;
grant execute on function public.validar_dispositivo(text, text) to anon, authenticated;

drop function if exists public.listar_dispositivos(text);
create or replace function public.listar_dispositivos(p_chave text)
returns table (dispositivo text, ultimo_acesso timestamptz, ativado_em timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.dispositivo, a.ultimo_acesso, a.ativado_em
  from public.chaves_ativos a
  where a.chave = upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'))
  order by a.ultimo_acesso desc;
$$;
grant execute on function public.listar_dispositivos(text) to anon, authenticated;

drop function if exists public.remover_dispositivo(text, text);
create or replace function public.remover_dispositivo(p_chave text, p_dispositivo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
begin
  v_chave := upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'));
  if not exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(chave, '[^A-Za-z0-9]', '', 'g')) = v_chave
  ) then
    return false;
  end if;
  delete from public.chaves_ativos
  where chave = v_chave and dispositivo = p_dispositivo;
  return found;
end;
$$;
grant execute on function public.remover_dispositivo(text, text) to anon, authenticated;

-- ============================================================
-- V1 — Token anti-forja (o servidor vira a autoridade)
-- ------------------------------------------------------------
-- Antes, qualquer pessoa podia forjar uma chave com checksum válido
-- (o algoritmo do chave-core.js é público) e gravar um record "pro"
-- no IndexedDB com revalidadoEm no futuro — Pro infinito sem nunca
-- consultar o servidor. Agora o cliente SÓ aceita Pro com um token
-- emitido pelo servidor para aquele aparelho. O token é aleatório
-- (128 bits), gerado somente dentro das RPCs security definer, e
-- tem expiração curta (7 dias) que renova a cada revalidação (48h).
-- Um record forjado sem token não passa no ehPro().
-- ------------------------------------------------------------

alter table public.chaves_ativos
  add column if not exists token text,
  add column if not exists token_expira_em timestamptz;

drop function if exists public.ativar_dispositivo(text, text);
create or replace function public.ativar_dispositivo(p_chave text, p_dispositivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
  v_limite int := 3;
  v_total int;
  v_token text := gen_random_uuid()::text || gen_random_uuid()::text;
  v_exp timestamptz := now() + interval '7 days';
begin
  v_chave := upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'));
  if not exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(chave, '[^A-Za-z0-9]', '', 'g')) = v_chave
  ) then
    return jsonb_build_object('status', 'chave_invalida');
  end if;

  insert into public.chaves_ativos (chave, dispositivo, ultimo_acesso, ativado_em, token, token_expira_em)
  values (v_chave, p_dispositivo, now(), now(), v_token, v_exp)
  on conflict (chave, dispositivo) do update
    set ultimo_acesso = now(), token = v_token, token_expira_em = v_exp;

  select count(*) into v_total
  from public.chaves_ativos
  where chave = v_chave;

  if v_total > v_limite then
    delete from public.chaves_ativos
    where id in (
      select id from public.chaves_ativos
      where chave = v_chave and dispositivo <> p_dispositivo
      order by ultimo_acesso asc
      limit (v_total - v_limite)
    );
  end if;

  return jsonb_build_object('status', 'ok', 'token', v_token, 'exp', v_exp);
end;
$$;
grant execute on function public.ativar_dispositivo(text, text) to anon, authenticated;

drop function if exists public.validar_dispositivo(text, text);
create or replace function public.validar_dispositivo(p_chave text, p_dispositivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
  v_hit boolean;
  v_token text := gen_random_uuid()::text || gen_random_uuid()::text;
  v_exp timestamptz := now() + interval '7 days';
begin
  v_chave := upper(regexp_replace(p_chave, '[^A-Za-z0-9]', '', 'g'));
  if not exists(
    select 1 from public.chaves_pro
    where upper(regexp_replace(chave, '[^A-Za-z0-9]', '', 'g')) = v_chave
  ) then
    return jsonb_build_object('ok', false);
  end if;
  select exists(
    select 1 from public.chaves_ativos
    where chave = v_chave and dispositivo = p_dispositivo
  ) into v_hit;
  if not v_hit then
    return jsonb_build_object('ok', false);
  end if;
  update public.chaves_ativos
  set ultimo_acesso = now(), token = v_token, token_expira_em = v_exp
  where chave = v_chave and dispositivo = p_dispositivo;
  return jsonb_build_object('ok', true, 'token', v_token, 'exp', v_exp);
end;
$$;
grant execute on function public.validar_dispositivo(text, text) to anon, authenticated;
