-- ============================================================
-- 20260909_05_criar_rpc_rastreio.sql
-- buscar_rastreio_por_codigo: único canal público de consulta.
-- SECURITY DEFINER + search_path vazio. Retorna pedido + produto +
-- cliente + rastreamento + eventos (data_evento <= now()).
-- ============================================================
CREATE OR REPLACE FUNCTION public.buscar_rastreio_por_codigo(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pedido_id        uuid;
  v_rastreamento_id  uuid;
  v_rastreamento_status text;
  v_previsao_inicio  timestamptz;
  v_previsao_fim     timestamptz;
  v_liberado_em      timestamptz;
  v_resultado        jsonb;
  v_rastreio_liberado boolean;
BEGIN
  SELECT id, pedido_id, status, previsao_inicio, previsao_fim, liberado_em
  INTO v_rastreamento_id, v_pedido_id, v_rastreamento_status, v_previsao_inicio, v_previsao_fim, v_liberado_em
  FROM public.rastreamentos
  WHERE codigo_rastreio = upper(p_codigo);

  IF v_rastreamento_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_rastreio_liberado :=
    v_liberado_em IS NOT NULL
    AND now() >= v_liberado_em;

  SELECT jsonb_build_object(
    'pedido', jsonb_build_object(
      'id',                      p.id,
      'numero_pedido',           p.numero_pedido,
      'status',                  p.status,
      'token_rastreamento',      p.token_rastreamento,
      'previsao_entrega_inicio', p.previsao_entrega_inicio,
      'previsao_entrega_fim',    p.previsao_entrega_fim,
      'produto', jsonb_build_object(
        'nome',       pr.nome,
        'imagem_url', pr.imagem_url
      ),
      'cliente', jsonb_build_object(
        'nome',   c.nome,
        'cidade', c.cidade,
        'estado', c.estado
      )
    ),
    'rastreamentos', jsonb_build_array(
      jsonb_build_object(
        'id',                v_rastreamento_id,
        'status',            v_rastreamento_status,
        'previsao_inicio',   v_previsao_inicio,
        'previsao_fim',      v_previsao_fim,
        'liberado_em',       v_liberado_em,
        'rastreio_liberado', v_rastreio_liberado,
        'eventos', CASE
          WHEN v_rastreio_liberado
          THEN COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id',          e.id,
                  'titulo',      e.titulo,
                  'descricao',   e.descricao,
                  'cidade',      e.cidade,
                  'estado',      e.estado,
                  'status',      e.status,
                  'data_evento', e.data_evento
                )
                ORDER BY e.data_evento ASC
              )
              FROM public.eventos_rastreamento e
              WHERE e.rastreamento_id = v_rastreamento_id
                AND e.data_evento <= now()
            ),
            '[]'::jsonb
          )
          ELSE '[]'::jsonb
        END
      )
    )
  )
  INTO v_resultado
  FROM public.pedidos p
  LEFT JOIN public.produtos pr ON pr.id = p.produto_id
  LEFT JOIN public.clientes c  ON c.id  = p.cliente_id
  WHERE p.id = v_pedido_id;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_rastreio_por_codigo(text) TO anon;

-- ============================================================
-- buscar_rastreio_por_pedido: usado pelo checkout pós-pagamento
-- para exibir o código de rastreio na tela de "Pedido pago".
-- ============================================================
CREATE OR REPLACE FUNCTION public.buscar_rastreio_por_pedido(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_resultado jsonb;
BEGIN
  SELECT jsonb_build_object(
    'codigo_rastreio', r.codigo_rastreio,
    'status',          r.status,
    'liberado_em',     r.liberado_em
  )
  INTO v_resultado
  FROM public.rastreamentos r
  WHERE r.pedido_id = p_pedido_id
  LIMIT 1;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_rastreio_por_pedido(uuid) TO anon;