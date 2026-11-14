-- Tabla de pedidos (D1). La función también la crea sola si no existe;
-- este archivo sirve para crearla a mano: npx wrangler d1 execute revivegrow-pedidos --remote --file migrations/0001_pedidos.sql
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL UNIQUE,
  clave TEXT NOT NULL UNIQUE,
  creado_en TEXT NOT NULL,
  nombre TEXT NOT NULL,
  celular TEXT NOT NULL,
  provincia TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  direccion TEXT NOT NULL,
  referencia TEXT NOT NULL,
  paquete TEXT NOT NULL,
  frascos INTEGER NOT NULL,
  precio_centavos INTEGER NOT NULL,
  envio_centavos INTEGER,
  total_centavos INTEGER,
  estado TEXT NOT NULL DEFAULT 'nuevo',
  producto TEXT NOT NULL DEFAULT 'testo-gh',
  prueba INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  notificado_en TEXT,
  error_notificacion TEXT
);
CREATE INDEX IF NOT EXISTS idx_pedidos_celular ON pedidos (celular, creado_en);
CREATE INDEX IF NOT EXISTS idx_pedidos_ip ON pedidos (ip_hash, creado_en);
