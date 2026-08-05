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
