-- ============================================================
-- HARDENING DE SEGURANÇA (2026-09-06)
-- ------------------------------------------------------------
-- Motivo: auditoria encontrou RLS DESATIVADO em todas as tabelas.
-- Como a Supabase anon key fica no bundle público do Next.js,
-- qualquer visitante conseguia LER e ESCREVER em cartões, clientes
-- (CPF/email/telefone), pedidos, pagamentos, produtos etc. via REST.
--
-- Esta migration:
--   1. Habilita ROW LEVEL SECURITY em todas as tabelas.
--   2. Revoga privilégios de escrita para o papel anon (defesa em
--      profundidade; RLS é a camada primária).
--   3. Produtos: leitura pública mantida (catálogo da loja precisa).
--   4. Tabelas internas: acesso somente via role authenticated
--      (painel admin autenticado) ou service_role (APIs de servidor,
--      que ignoram RLS e continuam funcionando).
--   5. As funções buscar_rastreio_por_* são SECURITY DEFINER e
--      continuam funcionando para anon sem expor as tabelas.
--
-- Aplicar no projeto Supabase:  supabase db push  (com CLI linkado)
-- ============================================================

-- Convenções:
--   * to_regclass() evita erro se a tabela ainda não existir
--     em algum ambiente (ex.: local).
--   * DROP POLICY IF EXISTS torna a migração idempotente.
--   * GRANT/REVOKE só afetam quem não é superusuário; service_role
--     e postgres continuam ilesos.

DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'clientes',
    'pedidos',
    'pagamentos',
    'cartoes',
    'rastreamentos',
    'eventos_rastreamento',
    'cidades_rota',
    'emails_enviados',
    'enderecos_entrega'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      -- 1. RLS on + revoga acesso anon (defesa em profundidade)
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

      -- 2. Acesso total apenas para usuários autenticados (admin).
      --    No checkout público as APIs usam service_role (ignora RLS),
      --    então o fluxo de loja continua funcionando sem login.
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_authenticated_all', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        t || '_authenticated_all',
        t
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Produtos: catálogo público de leitura, escrita só autenticado
-- ============================================================
DO $$
BEGIN
  IF to_regclass('public.produtos') IS NOT NULL THEN
    ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

    REVOKE ALL ON public.produtos FROM anon;
    GRANT SELECT ON public.produtos TO anon;

    DROP POLICY IF EXISTS produtos_anon_select ON public.produtos;
    CREATE POLICY produtos_anon_select
      ON public.produtos
      FOR SELECT
      TO anon
      USING (true);

    DROP POLICY IF EXISTS produtos_authenticated_all ON public.produtos;
    CREATE POLICY produtos_authenticated_all
      ON public.produtos
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;