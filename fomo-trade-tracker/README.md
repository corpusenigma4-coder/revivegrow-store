# FOMO Trade Tracker

Monitor **de solo lectura** que avisa en tiempo real cuando los traders que sigues compran
(BUY) o venden (SELL) una criptomoneda. Lee únicamente transacciones públicas de las
blockchains donde opera FOMO: Solana, Base, BNB Chain, Monad, Ethereum, Robinhood Chain, Arc
y Elysium.

**Restricciones de diseño:**

- No compra ni vende.
- No conecta wallets ni firma transacciones.
- Nunca pide claves privadas.
- No automatiza operaciones.
- No accede a fomo.family ni a ningún servicio no autorizado.

La decisión de operar es siempre tuya. No es asesoría financiera.

Antes de usarla, lee la investigación en [`docs/INVESTIGACION.md`](docs/INVESTIGACION.md):
explica cómo identificar wallets sin infringir los Términos de FOMO y qué limitaciones tiene
cada red.

## Requisitos y arranque

- Python 3.10 o superior. **No hay dependencias**: solo se usa la biblioteca estándar.
- Conexión a internet para los RPC públicos y para DexScreener/GeckoTerminal.

```bash
cd fomo-trade-tracker
```

```bash
python3 run.py
```

Después abre http://127.0.0.1:8787. Los datos se guardan en `data/tracker.db` (SQLite).

## Uso

1. **+ Agregar** un trader: nombre y usuario de FOMO.
2. **+ Wallet**: pega su dirección pública. La app detecta si es Solana o EVM. Una dirección
   EVM se puede vigilar en todas las redes EVM o solo en las que marques.
3. Indica el **estado de verificación** con su evidencia (ver tabla abajo). Si no tienes
   certeza, déjala como **No verificada**: sus alertas lo indicarán siempre.
4. Al añadir una wallet se carga su actividad reciente **como historial, sin alertas**. Desde
   ese momento, cada BUY/SELL nuevo genera:
   - aviso en pantalla (verde = BUY, rojo = SELL),
   - sonido (desactivable),
   - notificación del sistema, si la activas.
5. Pulsa cualquier operación para ver el detalle:
   - token y contrato, red, cantidad, precio (en la moneda de pago y en USD) y valor USD,
   - % de la posición vendida, liquidez y capitalización,
   - fecha, retraso de detección y enlace a la transacción en el explorador.
6. Activa o pausa el seguimiento de cada trader o de cada wallet con su interruptor.

### Verificación de wallets

| Estado | Cuándo usarlo |
|---|---|
| ⚠ No verificada | No sabes con certeza de quién es. |
| ⓘ Declarada | El trader la publicó como suya. Guarda el enlace. |
| ✓ Confirmada | Declarada y comparaste 2 o más operaciones de su perfil de FOMO con las detectadas aquí. |

La forma más fiable de probar todo el sistema es **añadir tu propia wallet de FOMO** (la ves
en Depositar) y comprobar que tus operaciones aparecen.

## Configuración (variables de entorno opcionales)

| Variable | Uso |
|---|---|
| `RPC_URL_<RED>` (p. ej. `RPC_URL_BSC`, `RPC_URL_ETHEREUM`, `RPC_URL_BASE`, `RPC_URL_SOLANA`) | Sustituye el RPC público de esa red. **Necesario en Ethereum y BNB Chain**, cuyos RPC públicos no permiten buscar transferencias por wallet. |
| `FTT_DISABLE_<RED>=1` | Desactiva una red. |
| `FTT_PORT`, `FTT_HOST` | Puerto (8787) e interfaz (127.0.0.1). |
| `FTT_NOTIFY_MAX_AGE_S` | Antigüedad máxima para alertar (300 s por defecto). |
| `FTT_SOLANA_BACKFILL` | Transacciones de historial al añadir una wallet Solana (25). |
| `FTT_DATA_DIR`, `FTT_DB_PATH` | Ubicación de la base de datos. |

Ejemplo:

```bash
RPC_URL_BSC="https://tu-proveedor/tu-endpoint" python3 run.py
```

## Cómo funciona

```
Wallets (SQLite) ──► Monitor (1 hilo por red, sondeo cada 6-15 s)
                        ├─ Solana: getSignaturesForAddress → getTransaction
                        └─ EVM:    eth_getLogs(Transfer por wallet) → recibo + saldos
                     ──► Clasificador: cambios de saldo → BUY / SELL / ENTRADA / SALIDA
                     ──► Precios: DexScreener (GeckoTerminal como respaldo)
                     ──► SQLite (sin duplicados) ──► SSE ──► Panel web + notificaciones
```

| Ruta | Contenido |
|---|---|
| `tracker/config.py` | Redes, RPC, monedas de pago verificadas y exploradores. |
| `tracker/solana.py`, `tracker/evm.py` | Lectura de transacciones. |
| `tracker/classify.py` | Reglas BUY/SELL/ENTRADA/SALIDA y valoración en USD. |
| `tracker/monitor.py` | Bucle en tiempo real, historial inicial y eventos. |
| `tracker/server.py` | API REST + Server-Sent Events + archivos web. |
| `web/` | Interfaz (HTML/CSS/JS sin frameworks). |
| `tests/` | 28 tests; usan transacciones reales guardadas en `tests/fixtures/`. |
| `tools/capture_fixture.py` | Guarda una transacción real como fixture. |

Los tests no necesitan red:

```bash
python3 -m unittest discover -s tests -v
```

## Limitaciones

Están detalladas en [`docs/INVESTIGACION.md`](docs/INVESTIGACION.md#5-limitaciones-conocidas):

- Ethereum y BNB necesitan un RPC propio.
- El RPC público de Base limita con frecuencia.
- El tiempo real es por sondeo (normalmente menos de 30 s).
- Las compras cross-chain aparecen como ENTRADA.
- Los perpetuos no están cubiertos.
