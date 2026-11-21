# Investigación: wallets de FOMO y datos públicos por red

Fecha de la investigación: 21-11-2026. Todo lo marcado como **verificado** se comprobó
en vivo desde el entorno de desarrollo; lo demás procede de fuentes públicas citadas.

## 1. ¿Existe una integración oficial con FOMO?

**No.** FOMO (FOMO Labs, Inc., dominio oficial `fomo.family`) no publica una API, un SDK
ni un programa para desarrolladores. Los servicios que ofrecen "FOMO API", "wallet finder"
o extensiones (fomoapi.io, fomowalletfinder.com, copyfomo, FomoScan) son **de terceros y no
oficiales**.

### Lo que dicen los Términos de FOMO (leídos el 21-11-2026 en fomo.family/terms)

En la sección de conductas prohibidas, los Términos dicen textualmente que no se puede:

> "Attempt to access or search the Services or download content from the Services using any
> unauthorized or automated means, such as bots, crawlers, or data mining tools;"

> "Use any automated tool, scraper, crawler, spider, or unauthorized third-party application
> to extract, collect, harvest, or compile data from the Services, including but not limited
> to user-generated content, transaction data, pricing information, or account information;"

> "Reverse look-up, track, or seek to track any information on any other user of or visitor
> to the Services;"

**Consecuencias de diseño en esta aplicación:**

- La app **nunca accede a fomo.family** ni a su API privada: no hace scraping ni ingeniería inversa.
- **No usa buscadores de wallets de terceros**: deducir la wallet de un usuario a partir de su
  perfil es una "búsqueda inversa", lo que los Términos prohíben.
- Solo lee **datos públicos de las blockchains** (nodos RPC públicos) y precios de mercado
  públicos (DexScreener y GeckoTerminal).

> Nota: no es asesoramiento legal. Seguir a una dirección pública en blockchain no requiere
> usar los servicios de FOMO, pero si eres usuario de FOMO estás sujeto a sus Términos. Ante
> la duda, consulta a FOMO (support@fomo.family).

## 2. Cómo identificar correctamente la wallet de un trader

La app de FOMO **no muestra la dirección de otros traders** (según varias fuentes; FOMO no lo
documenta). Cada usuario tiene una wallet de autocustodia creada con Privy. Que la misma
dirección EVM sirva en todas las redes EVM lo afirman solo fuentes de terceros: compruébalo en
tu propia pantalla de depósito.

**Fuentes válidas para asociar una wallet a un trader:**

1. **Tu propia wallet**: la ves en la app (Depositar). Es la forma más fiable de validar todo
   el flujo de principio a fin.
2. **Una wallet que el propio trader haya publicado** como suya (en su bio, en un post o en un
   canal propio).

**Proceso de verificación integrado en la app** (botón de estado de cada wallet):

| Estado | Significado | Requisito en la app |
|---|---|---|
| ⚠ No verificada | No hay certeza de a quién pertenece. Sus alertas lo avisan siempre. | — |
| ⓘ Declarada | El trader la publicó como suya. | Enlace o nota de evidencia obligatorios |
| ✓ Confirmada | Declarada **y** con 2 o más operaciones coincidentes entre su perfil de FOMO y lo detectado on-chain (token, hora e importe). | Evidencia obligatoria |

Además, una dirección **solo puede pertenecer a un trader**, para que una misma operación no
se atribuya a dos personas.

**Casos que la app no puede resolver sola:**

- Un trader con **varias wallets**: solo se ve lo que hagan las wallets añadidas.
- **Operaciones cross-chain** con el "saldo en dólares" de FOMO: si el pago sale en una red y
  el token llega en otra, en la red de destino solo se ve la llegada del token. La app lo
  registra como **ENTRADA** (no como BUY) para no inventar un precio.
- **Bots y contratos**: en muchas operaciones públicas quien firma no es quien recibe los
  tokens. Así se comprobó en Base y Robinhood Chain. Las wallets de FOMO guardan los tokens en
  su propia dirección, que es lo que mide la app.

## 3. Datos que se obtienen de cada red

Método común: se comparan los saldos de la wallet antes y después de cada transacción. Esto
da token, cantidad, moneda de pago, precio y % de la posición vendida, con cualquier DEX o
agregador.

- **Solana**: `getSignaturesForAddress` + `getTransaction` (jsonParsed) →
  `pre/postTokenBalances` y lamports. El saldo posterior a la venta es exacto, así que el % de
  posición vendida también lo es.
- **EVM**: `eth_getLogs` del evento ERC-20 `Transfer` filtrado por la wallet → recibo de la
  transacción. La moneda nativa se mide por diferencia de saldo entre bloques, y el saldo
  posterior con `balanceOf` en el bloque de la operación.

| Red | Chain ID (verificado) | RPC público | Búsqueda por wallet (`eth_getLogs`) | Moneda de pago reconocida |
|---|---|---|---|---|
| Solana | — | api.mainnet-beta.solana.com ✔ | ✔ (`getSignaturesForAddress`) | SOL, USDC, USDT |
| Base | 8453 ✔ | mainnet.base.org | ✔ pero con **límite 429** frecuente desde IPs compartidas | ETH/WETH, USDC |
| BNB Chain | 56 ✔ | bsc-dataseed.bnbchain.org | ❌ `limit exceeded` → requiere RPC propio | BNB/WBNB, USDT, USDC |
| Ethereum | 1 ✔ | ethereum-rpc.publicnode.com | ❌ exige indicar contrato → requiere RPC propio | ETH/WETH, USDC, USDT |
| Monad | 143 ✔ | rpc.monad.xyz | ✔ (máx. ~100 bloques por consulta) | MON/WMON + stablecoins |
| Robinhood Chain | 4663 ✔ | rpc.mainnet.chain.robinhood.com | ✔ | ETH/WETH, USDG |
| Arc | 5042 ✔ | rpc.mainnet.arc.io | ✔ | USDC (gas nativo = USDC; ver nota) |
| Elysium | 99901 ✔ | rpc.elysium.kinetiq.xyz | ✔ | HYPE/WHYPE, USDC |

Las direcciones de WMON, WETH y USDG (Robinhood), WHYPE y USDC (Elysium) y USDC de Arc se
verificaron on-chain (símbolo y decimales) y en GeckoTerminal (ID de CoinGecko).

**Nota sobre Arc**: el USDC es a la vez gas nativo (18 decimales) y token ERC-20
`0x3600…0000` (6 decimales). Cada movimiento emite un `Transfer` "espejo" desde
`0xffff…fffe`. La app ignora el espejo y el saldo nativo para no contar dos veces.

**Nota sobre Solana**: en 2026 Solana introdujo las transacciones "versión 1". La app las
admite y se adapta automáticamente si aparece una versión superior.

## 4. Validación con datos reales

El motor se contrastó con una fuente independiente: las operaciones que GeckoTerminal
clasifica como buy/sell con su importe en USD.

- **BNB Chain** (ARK/USDT): 10 de 10 coinciden en tipo, con importe a menos de un 0,6 %.
- **Elysium** (AGI/HYPE): 19 de 19 coinciden, con un 0,5-2 %. Una compra de 0,04 $ de
  MONTRA quedó como ENTRADA porque el pago está por debajo del umbral anti-ruido de 0,05 $.
- **Arc** (TOLLY, WETH, EURC vía USDC): coincidencia exacta al céntimo.
- **Robinhood Chain**, **Monad** y **Ethereum** (compras): coinciden, con un 0,5-3 %.
- **Solana**: precio derivado del pago real a un 1-5 % del precio de mercado. El % vendido es
  exacto, calculado a partir de saldos on-chain.

Las diferencias mayores corresponden a rutas que pasan por varios pools: GeckoTerminal solo
cuenta la parte de un pool, mientras que la app mide lo que realmente entra y sale de la wallet.

**Prueba de extremo a extremo** (wallets públicas activas usadas solo como prueba, sin
atribuirlas a ningún usuario de FOMO):

- Historial inicial cargado sin alertas.
- Operaciones nuevas detectadas y notificadas en vivo con un retraso de 4 a 30 s tras el bloque.
- Sin duplicados.

## 5. Limitaciones conocidas

1. **Ethereum y BNB Chain** necesitan un RPC que permita `eth_getLogs` por wallet (variables
   `RPC_URL_ETHEREUM` y `RPC_URL_BSC`). Muchos proveedores tienen plan gratuito con API key;
   eso requiere tu registro y aprobación.
2. **Base**: el RPC público limita con frecuencia (429). Conviene `RPC_URL_BASE` propio.
3. **Tiempo real por sondeo**: cada 6-15 s según la red, no por WebSocket. Retraso típico
   inferior a 30 s.
4. **Valor USD**: es el pago real convertido con el precio de mercado en el momento de la
   detección. En el historial cargado más tarde es aproximado.
5. **Perpetuos** (Hyperliquid / Trade[XYZ]) no están cubiertos.
6. El RPC público de Ethereum solo guarda unos 128 bloques de estado (unos 25 min). Para
   operaciones más antiguas el pago en ETH nativo puede no medirse; esto no afecta al
   monitoreo en vivo.

## Fuentes

- Términos de FOMO: https://fomo.family/terms (leído el 21-11-2026)
- FOMO en App Store: https://apps.apple.com/us/app/fomo-never-miss-out/id6741115427
- Centro de ayuda de FOMO (redes soportadas): https://help.fomo.family/en/articles/15170883-what-is-fomo
- Nota de prensa de FOMO (8 redes): https://www.globenewswire.com/news-release/2026/11/17/3404821/0/en/trading-for-the-rest-of-us-fomo-brings-beginner-friendly-crypto-trading-to-3-6-million-users-across-eight-blockchain-networks.html
- Privy y FOMO: https://privy.io/blog/turning-trading-into-a-social-experience-with-fomo
- Perfil de FOMO en APIs.io (sin API pública): https://apis.io/providers/fomo/
- API de DexScreener: https://docs.dexscreener.com/api/reference
- API de GeckoTerminal: https://apiguide.geckoterminal.com/faq
- Monad (RPC y chain ID): https://docs.monad.xyz/guides/add-monad-to-wallet/mainnet.md
- Robinhood Chain: https://www.dwellir.com/networks/robinhood
- Arc: https://blazephoenix.xyz/learn/arc-chain-explained/
- Elysium: https://www.dwellir.com/networks/elysium
