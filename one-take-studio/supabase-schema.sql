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
