ALTER TABLE produtos  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'P1';
ALTER TABLE produtos  ADD CONSTRAINT produtos_categoria_check  CHECK (categoria IN ('P1', 'P2', 'P3'));
