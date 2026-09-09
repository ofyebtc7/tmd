# Padrão Rastreio — Cliente Novo (Cuprum Labs)

Template de referência para criar pedido + rastreio de um cliente novo.
Base: rastreado real **CPR-2026-0010** (e **CPR-2026-0011 / Akemi**).

## Regras fixas (NÃO mudam nunca)

- **Origem da rota é sempre Belo Horizonte/MG** (CTCE-BH — central padrão de saída).
- Os **3 eventos** do histórico ficam TODOS com `cidade = 'Belo Horizonte'`, `estado = 'MG'`.
- Descrições curtinhas (sem excesso de informação), usadas igual abaixo.
- Status: `pedido = 'pago'`, `rastreamento = 'preparando'`, `eventos = 'concluido'`.

## O que MUDA a cada cliente

1. **Produto** (o produto vendido)
2. **Destino** → cidade/estado do cliente (ex.: Itapetininga/SP)
3. **Horários e datas** (pago às X, preparado +1h, postado no dia seguinte)

## Eventos padrão

| Ordem | Título | Descrição (curta) |
|---|---|---|
| 1 | Pagamento aprovado | Seu pagamento foi confirmado e o pedido está sendo preparado. |
| 2 | Pedido preparado | Seu pedido foi separado, embalado e está pronto para envio. |
| 3 | Objeto postado | Seu pedido foi postado e saiu do Centro de Tratamento de Cargas Especiais rumo ao centro de distribuição de `{ESTADO}`. |

> `{ESTADO}` = estado do cliente (ex.: "São Paulo", "Rio de Janeiro"...).

## Checklist por cliente

1. Criar cliente (nome, endereço, CEP, cidade, estado, telefone, observações/ponto de referência).
2. Criar pedido do produto vendido, valor, `status` inicial `aguardando_pagamento`, `canal_venda = 'WhatsApp'`.
3. Marcar `status = 'pago'` e `updated_at` no horário do pagamento.
4. Criar rastreamento: código `CPR-2026-NNNN` (próximo disponível), `liberado_em` = horário do pagamento.
5. Criar os 3 eventos (tabela acima) com:
   - **Pagamento aprovado** = data/hora do pagamento (ex.: 07/09 17:24)
   - **Pedido preparado** = 1h depois (ex.: 07/09 18:24)
   - **Objeto postado** = dia seguinte no horário definido (ex.: 08/09 15:50)
6. Salvar o SQL final com todos os IDs reais em `pedido-<cliente>.sql`.

## Template SQL (preencher com IDs gerados)

```sql
SELECT nome, cidade, estado, cep, endereco
FROM clientes
WHERE id = '<cliente_id>';

UPDATE pedidos
SET status = 'pago'
WHERE id = '<pedido_id>'
RETURNING id, numero_pedido, status, token_rastreamento;

INSERT INTO rastreamentos (pedido_id, codigo_rastreio, liberado_em, status)
VALUES ('<pedido_id>', '<codigo>', '<YYYY-MM-DD HH:MM:00-03>', 'preparando')
RETURNING id, codigo_rastreio;

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('<rastreamento_id>', 'Pagamento aprovado', 'Seu pagamento foi confirmado e o pedido está sendo preparado.', 'Belo Horizonte', 'MG', '<YYYY-MM-DD HH:MM:00-03>', 'concluido');

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('<rastreamento_id>', 'Pedido preparado', 'Seu pedido foi separado, embalado e está pronto para envio.', 'Belo Horizonte', 'MG', '<YYYY-MM-DD HH:MM:00-03>', 'concluido');

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('<rastreamento_id>', 'Objeto postado', 'Seu pedido foi postado e saiu do Centro de Tratamento de Cargas Especiais rumo ao centro de distribuição de <Estado>.', 'Belo Horizonte', 'MG', '<YYYY-MM-DD HH:MM:00-03>', 'concluido');
```

## Exemplo real concluído

- **Cliente**: Akemi Makiyama (Itapetininga/SP)
- **Produto**: Kit TG Tirzepatida 4 ampolas de 15mg — R$ 497,00
- **Pedido #76** — pago 07/09/2026 17:24
- **Rastreio**: CPR-2026-0011
  - Pagamento aprovado: 07/09 17:24
  - Pedido preparado: 07/09 18:24
  - Objeto postado: 08/09 15:50 — "...para o centro de distribuição de São Paulo."