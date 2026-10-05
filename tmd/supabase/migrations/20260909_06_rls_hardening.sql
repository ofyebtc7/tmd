-- ============================================================
-- 20260909_06_rls_hardening.sql
-- Fechamento de acesso: anon SÓ pode executar as RPCs de rastreio.
-- Todas as tabelas ficam protegidas; nenhum INSERT/UPDATE/SELECT
-- anônimo em clientes/pedidos/pagamentos é permitido.
-- ============================================================

-- revoga tudo das tabelas para anon
REVOKE ALL ON TABLE
  public.clientes,
  public.produtos,
  public.pedidos,
  public.pagamentos,
  public.cartoes,
  public.rastreamentos,
  public.eventos_rastreamento,
  public.cidades_rota,
  public.emails_enviados
FROM anon;

-- revoga até as sequences para anon
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT sequence_schema || '.' || sequence_name AS seq
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon', r.seq);
  END LOOP;
END $$;

-- habilita RLS em todas as tabelas
ALTER TABLE public.clientes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_rastreamento  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades_rota          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails_enviados       ENABLE ROW LEVEL SECURITY;

-- FORCE RLS para o service role não poder inserir via regras (opcional)
-- ALTER TABLE ... FORCE ROW LEVEL SECURITY;

-- Home do banco deixa os SELECT públicos serem bloqueados por RLS
-- Sem policies criadas => anon/mínimo = negação total por RLS.