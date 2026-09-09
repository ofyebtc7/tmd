-- ============================================================
-- Função: buscar_rastreio_por_codigo(p_codigo text)
-- Atualizada para retornar a imagem do produto (imagem_url)
-- Busca rastreamento pelo codigo_rastreio curto (ex: CBR7X9K2M4Q)
-- SECURITY DEFINER → roda como owner, ignora RLS
-- SET search_path = '' → previne search-path injection
-- Retorna jsonb com pedido + rastreamentos + eventos
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
  -- 1. Localizar rastreamento pelo codigo_rastreio
  SELECT id, pedido_id, status, previsao_inicio, previsao_fim, liberado_em
  INTO v_rastreamento_id, v_pedido_id, v_rastreamento_status, v_previsao_inicio, v_previsao_fim, v_liberado_em
  FROM public.rastreamentos
  WHERE codigo_rastreio = p_codigo;

  IF v_rastreamento_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Determinar se o rastreio está liberado para exibição
  v_rastreio_liberado :=
    v_liberado_em IS NOT NULL
    AND now() >= v_liberado_em;

  -- 3. Montar JSON
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

-- ============================================================
-- Grant EXECUTE para anon (único acesso público)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.buscar_rastreio_por_codigo(text) TO anon;
