-- ============================================================
-- 20260909_03_criar_cidades_rota.sql
-- Hub logísticos: ORIGEM = Praia Grande/SP (CTCE-PG) e capitais
-- como centrais de distribuição dos estados.
-- ============================================================
CREATE TABLE public.cidades_rota (
  id         uuid    NOT NULL DEFAULT gen_random_uuid(),
  nome       text    NOT NULL,
  uf         text    NOT NULL,
  regiao     text    NOT NULL,
  nome_local text,
  latitude   double precision NOT NULL,
  longitude  double precision NOT NULL,

  CONSTRAINT cidades_rota_pk PRIMARY KEY (id),
  CONSTRAINT cidades_rota_nome_uf_uniq UNIQUE (nome, uf)
);

INSERT INTO public.cidades_rota (nome, uf, regiao, nome_local, latitude, longitude) VALUES
  ('Praia Grande',          'SP', 'Sudeste',     'CTCE-PG',  -24.0058, -46.4028),
  ('Sao Paulo',             'SP', 'Sudeste',     NULL,       -23.5505, -46.6333),
  ('Rio de Janeiro',        'RJ', 'Sudeste',     NULL,       -22.9068, -43.1729),
  ('Vitoria',               'ES', 'Sudeste',     NULL,       -20.2976, -40.2958),
  ('Belo Horizonte',        'MG', 'Sudeste',     NULL,       -19.9167, -43.9333),
  ('Brasilia',              'DF', 'Centro-Oeste',NULL,       -15.7975, -47.8919),
  ('Goiania',               'GO', 'Centro-Oeste',NULL,       -16.6864, -49.2643),
  ('Campo Grande',          'MS', 'Centro-Oeste',NULL,       -20.4697, -54.6201),
  ('Cuiaba',                'MT', 'Centro-Oeste',NULL,       -15.6010, -56.0974),
  ('Curitiba',              'PR', 'Sul',         NULL,       -25.4290, -49.2671),
  ('Florianopolis',         'SC', 'Sul',         NULL,       -27.5969, -48.5495),
  ('Porto Alegre',          'RS', 'Sul',         NULL,       -30.0346, -51.2177),
  ('Salvador',              'BA', 'Nordeste',    NULL,       -12.9704, -38.5124),
  ('Recife',                'PE', 'Nordeste',    NULL,       -8.0476,  -34.8770),
  ('Fortaleza',             'CE', 'Nordeste',    NULL,       -3.7172,  -38.5433),
  ('Sao Luis',              'MA', 'Nordeste',    NULL,       -2.5307,  -44.3068),
  ('Natal',                 'RN', 'Nordeste',    NULL,       -5.7939,  -35.2108),
  ('Joao Pessoa',           'PB', 'Nordeste',    NULL,       -7.1150,  -34.8640),
  ('Maceio',                'AL', 'Nordeste',    NULL,       -9.6663,  -35.7354),
  ('Aracaju',               'SE', 'Nordeste',    NULL,       -10.9472, -37.0731),
  ('Teresina',              'PI', 'Nordeste',    NULL,       -5.0920,  -42.8038),
  ('Belem',                 'PA', 'Norte',       NULL,       -1.4558,  -48.5044),
  ('Manaus',                'AM', 'Norte',       NULL,       -3.1190,  -60.0217),
  ('Porto Velho',           'RO', 'Norte',       NULL,       -8.7608,  -63.9020),
  ('Palmas',                'TO', 'Norte',       NULL,       -10.1653, -48.3469),
  ('Macapa',                'AP', 'Norte',       NULL,       0.0349,   -51.0694),
  ('Boa Vista',             'RR', 'Norte',       NULL,       2.8195,   -60.6733),
  ('Rio Branco',            'AC', 'Norte',       NULL,       -9.9795,  -67.8230);