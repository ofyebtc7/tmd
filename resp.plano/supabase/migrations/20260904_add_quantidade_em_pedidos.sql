-- Quantidade de unidades do mesmo produto no pedido (compra direta multiunidades)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1;