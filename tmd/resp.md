c9a61a69-53db-4d11-87a2-ec40eec92613 cliente
2a85c334-5b5f-485c-b71a-741ae2d184d2 pedido
ea55eb44-89b3-48d8-8825-6c9c32e7e26e produto

==================================================
FLUXO COMPLETO - CHECKOUT + PAGAMENTO + RASTREIO
==================================================

-------- PARTE 1: ANTES DO PAGAMENTO --------

LANDING PAGE (landing.html)
   |  lead clica "Comprar"
   v
POST /api/checkout  ->  gera TOKEN assinado (cor + unidades + valor)
   |                  ex.: /checkout/2bb38c8....auth
   v
CHECKOUT  /checkout/{token}
   |
   +- Passo 1: Identificacao (nome, e-mail, CPF, celular)
   +- Passo 2: Entrega (CEP auto-preenche via ViaCEP + frete)
   +- Passo 3: Pagamento (PIX ou Cartao)
             |
             +- Escolhe PIX -> POST /api/comprar -------------------+
             |                                                     v
             |                               SUPABASE: cria CLIENTE + PEDIDO
             |                               (status = aguardando_pagamento)
             |                                                     |
             |         POST /api/gerar-pix (com pedidoId)          v
             |         |                       PINPAY gera a cobranca PIX
             |         v                       + salva PAGAMENTO (pendente)
             |      QR Code + copia-e-cola      + metadata.external_reference
             |         |                          = id do pedido (linka tudo)
             |         +-- lead paga no app do banco
             |
             +- Escolhe Cartao -> POST /api/comprar -> pedido salvo + aviso
                        (fluxo ilustrativo; checkout finaliza via PIX)

-------- PARTE 2: APOS O PAGAMENTO (100% AUTOMATICO) --------

LEAD PAGA O PIX
   |
   v  (+-1-3s)
PINPAY dispara WEBHOOK  ->  POST /api/webhook-pix
   |  (valida assinatura HMAC com PINPAY_WEBHOOK_SECRET)
   v
WEBHOOK faz tudo sozinho, em sequencia:
   |
   |  1) pagamentos  -> status = pago + data_pagamento
   |  2) pedidos     -> status = pago
   |  3) GERA CODIGO PLX9DIGITOS (unico, alfabeto ABCDEFGHJKLMNPQRSTUVWXYZ23456789)
   |  4) rastreamentos -> cria: codigo PLX..., status = preparando, liberado_em = +24h
   |  5) eventos_rastreamento -> monta a ROTA LOGISTICA automaticamente:
   |        * Pagamento aprovado        (hora do pagamento)
   |        * Pedido preparado          (+3h, Praia Grande/SP)
   |        * Objeto postado            (+2h, saida do CTCE)
   |        * Chegou ao centro de distribucao (km/60km/h, min. 6h)
   |        * Em transito               (+2h, rumo a cidade do cliente)
   |  6) Meta CAPI -> evento Purchase (server-side)
   v
CHECKOUT (polling /api/status-pedido a cada 4s)
   |  detecta status = pago
   v
Tela "PAGAMENTO APROVADO!" + botao
   +- "Acompanhar pedido"  ->  VAI DIRETO PARA  /rastreio/PLX9DIGITOS
                                (sem digitar nada - a intencao do projeto)

-------- PARTE 3: PAGINA PUBLICA DE RASTREIO --------

/rastreio/{PLX-codigo}
   |
   v  RPC buscar_rastreio_por_codigo (SECURITY DEFINER - unico canal publico)
   |
   +- pedido: n., status, valor, previsoes, produto, cliente
   +- rastreamento: status atual + rastreio_liberado (false ate +24h)
   +- eventos: timeline com cidade/UF e horarios
   |     (eventos futuros ficam ocultos ate data_evento <= now())
   +- SE codigo nao existe -> notFound()

-------- DESTAQUES DA AUTOMACAO (commit 4583a05) --------

* O checkout CONTINUA no polling ate o codigo PLX... existir
  -> "Acompanhar pedido" SEMPRE leva direto ao codigo
* O rastreio e criado pelo webhook, sem acao manual
* NENHUM e-mail/SMS e enviado; o codigo e entregue na propria tela
  pos-pagamento + disponivel na URL de rastreio
* Purchase (Meta) dispara 1x por pedido

RESUMO:
Landing -> Checkout (token) -> PIX -> Webhook -> rastreio criado
-> tela aprovada -> clique e vai direto ao rastreio.
==================================================