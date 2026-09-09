-- Pedido #7 - Iolanda Patrícia dos Santos Henz (Campo Largo/PR) - TESTE
-- Produto: Tomada Inteligente Plugmax - Preto | R$ 89.90 | 2026-09-09T20:02:07.750Z

SELECT nome, cidade, estado, cep, endereco, numero, complemento, bairro, telefone, email
FROM clientes WHERE id = '8eda9f20-e87c-4899-8f4e-eb28a6837e9b';

UPDATE pedidos SET status='pago', updated_at='2026-09-07T20:02:04.229Z'
WHERE id='ed8a334e-8a77-46ad-95fa-ad4f061530bd' RETURNING id, numero_pedido, status, token_rastreamento;

INSERT INTO rastreamentos (pedido_id, codigo_rastreio, liberado_em, status)
VALUES ('ed8a334e-8a77-46ad-95fa-ad4f061530bd', 'PLXBXV7Z5KCN', '2026-09-07T20:02:04.229Z', 'em_transito')
RETURNING id, codigo_rastreio;

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('22f18afb-0463-454a-923d-05960217c2ea', 'Pagamento aprovado', 'Seu pagamento foi confirmado e o pedido está sendo preparado.', 'Praia Grande', 'SP', '2026-09-07T20:02:04.229Z', 'concluido');

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('22f18afb-0463-454a-923d-05960217c2ea', 'Pedido preparado', 'Seu pedido foi separado, embalado e está pronto para envio.', 'Praia Grande', 'SP', '2026-09-07T21:02:04.229Z', 'concluido');

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('22f18afb-0463-454a-923d-05960217c2ea', 'Objeto postado', 'Seu pedido foi postado e saiu do Centro de Tratamento de Cargas Especiais rumo ao centro de distribuição de Curitiba.', 'Praia Grande', 'SP', '2026-09-08T01:02:04.229Z', 'concluido');

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('22f18afb-0463-454a-923d-05960217c2ea', 'Chegou ao centro de distribuição de Curitiba', 'Seu pedido chegou ao centro de distribuição de Curitiba e segue para o endereço de entrega.', 'Curitiba', 'PR', '2026-09-08T07:02:04.229Z', 'concluido');

INSERT INTO eventos_rastreamento (rastreamento_id, titulo, descricao, cidade, estado, data_evento, status)
VALUES ('22f18afb-0463-454a-923d-05960217c2ea', 'Em trânsito', 'Seu pedido saiu do centro de distribuição e está a caminho do seu endereço em Campo Largo.', 'Curitiba', 'PR', '2026-09-08T09:02:04.229Z', 'concluido');
