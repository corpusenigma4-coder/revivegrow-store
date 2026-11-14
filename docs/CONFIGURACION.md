# Configuración: publicación y recepción de pedidos

La landing funciona **sin configurar nada**: los pedidos llegan por WhatsApp con mensaje
prellenado (modalidad A). Para registrar pedidos en un servidor y recibir el aviso
automático en tu WhatsApp (modalidad B) hay que conectar Cloudflare y Meta.

| | Modalidad A (activa hoy) | Modalidad B (preparada) |
|---|---|---|
| Qué ocurre | Se abre WhatsApp con el pedido escrito; el cliente pulsa **Enviar** | El pedido se guarda en una base de datos y te llega un aviso a WhatsApp |
| ¿Depende del cliente? | Sí: si no pulsa Enviar, el pedido no existe | No |
| Qué ve el cliente | «Falta un paso: pulsa Enviar en WhatsApp» (nunca «pedido registrado») | «¡Pedido registrado! N.º RG-…» solo si el servidor lo guardó |
| Requisitos | Ninguno | Cloudflare Pages + D1 (gratis) y WhatsApp Cloud API (Meta) |

La página detecta sola la modalidad: consulta `GET /api/pedido`; si responde `{"activo": true}`
usa la B y, si el servidor falla, vuelve a ofrecer WhatsApp sin decir que el pedido se guardó.

---

## 1. Publicar en Cloudflare Pages (sin claves en el repositorio)

1. Entra en <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza a Cloudflare en GitHub y elige el repositorio `corpusenigma4-coder/revivegrow-store`.
3. Ajustes de compilación:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Production branch: `main`.
   - Variable de entorno: `NODE_VERSION = 22.23.4` (por si la imagen de compilación no lee `.nvmrc`).
4. Guarda. Cloudflare publica en `https://<proyecto>.pages.dev` y recompila con cada cambio en GitHub.

> La carpeta `functions/` se despliega automáticamente como `/api/pedido`.

### Dominio revivegrow.ec
Pages → tu proyecto → **Custom domains** → `revivegrow.ec` (y `www.revivegrow.ec`).
Si el DNS del dominio está en Cloudflare, se configura solo; si no, crea el CNAME que indique Cloudflare.

## 2. Base de datos de pedidos (Cloudflare D1)

1. **Workers & Pages → D1 → Create database** → nombre `revivegrow-pedidos`.
2. Pages → proyecto → **Settings → Bindings → Add → D1 database**: nombre de variable **`DB`**, base `revivegrow-pedidos` (en *Production* y *Preview*).
3. Vuelve a desplegar. La tabla se crea sola en el primer pedido (o ejecuta `migrations/0001_pedidos.sql` en la consola de D1).
4. Ver pedidos: D1 → `revivegrow-pedidos` → **Console**:
   ```sql
   SELECT numero, creado_en, nombre, celular, provincia, ciudad, paquete, total_centavos, notificado_en, prueba
   FROM pedidos ORDER BY id DESC LIMIT 50;
   ```

No existe ninguna URL pública para leer pedidos: los datos personales solo se ven desde tu cuenta de Cloudflare.

Protecciones incluidas: campo trampa, tiempo mínimo de llenado, verificación de origen, límite de 5 pedidos
por IP cada 30 min (IP anonimizada con sal), clave anti-doble-clic y detección de duplicados
(mismo celular y paquete en 30 min devuelve el mismo número de pedido). Precio calculado siempre en el servidor.

Añade también en **Settings → Variables and secrets** (tipo *Secret*):
- `IP_SALT`: un texto aleatorio largo (anonimiza las IP).

## 3. Aviso automático a tu WhatsApp (API oficial de WhatsApp Cloud)

**Importante:** la API envía mensajes **desde** un número registrado en WhatsApp Cloud API **hacia** otro número.
Un número no puede enviarse avisos a sí mismo. Opciones:
- **Recomendada:** registra en la API un número distinto (o el número de prueba gratuito de Meta para empezar) como *emisor*, y deja tu 096 070 2682 como *destinatario* de los avisos.
- Si migras el 096 070 2682 a la API (modo *coexistencia* con la app WhatsApp Business), los avisos deben ir a otro número tuyo (variable `WHATSAPP_NOTIFY_TO`).

Pasos en Meta:
1. <https://developers.facebook.com> → **Crear app** → tipo *Business* → añade el producto **WhatsApp**.
2. En **WhatsApp → API Setup** anota el **Phone number ID** del número emisor y añade tu 593960702682 como destinatario de prueba.
3. **Business Settings → Usuarios del sistema** → crea un usuario del sistema, asígnale la app y genera un **token permanente** con permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
4. **WhatsApp Manager → Plantillas → Crear**: nombre `nuevo_pedido`, categoría **Utilidad**, idioma **Español (es)**, cuerpo:
   ```
   Nuevo pedido REVIVE GROW {{1}}
   Fecha: {{2}}
   Cliente: {{3}}
   Celular: {{4}}
   Destino: {{5}}
   Dirección: {{6}}
   Referencia: {{7}}
   Producto: {{8}}
   Envío: {{9}}
   Total: {{10}}
   ```
   Espera la aprobación de Meta. Los mensajes de plantilla tienen costo según la tarifa de Meta para Ecuador.
5. En Cloudflare Pages → **Settings → Variables and secrets**:

| Variable | Tipo | Valor |
|---|---|---|
| `WHATSAPP_TOKEN` | Secret | token permanente del paso 3 |
| `WHATSAPP_PHONE_NUMBER_ID` | Texto | Phone number ID del emisor |
| `WHATSAPP_NOTIFY_TO` | Texto | número que recibe el aviso, ej. `593960702682` |
| `WHATSAPP_TEMPLATE` | Texto | `nuevo_pedido` (opcional) |
| `WHATSAPP_TEMPLATE_LANG` | Texto | `es` (opcional; usa el código exacto de la plantilla) |

Si el aviso falla, el pedido **queda guardado igualmente** (columna `error_notificacion`) y la página
ofrece al cliente enviar también su pedido por WhatsApp.

## 4. Anti-spam reforzado (opcional): Cloudflare Turnstile
Cloudflare → **Turnstile → Add widget** (dominios: el `.pages.dev` y `revivegrow.ec`), modo *Managed*.
Añade `TURNSTILE_SITE_KEY` (texto) y `TURNSTILE_SECRET_KEY` (secret) en Pages. La página lo activa sola.

## 5. Píxel de Meta (inactivo)
Escribe el ID en `src/config/tienda.ts` → `metaPixelId`. Eventos enviados: `PageView`, `InitiateCheckout`
(abrir el formulario), `Lead` (pedido enviado a WhatsApp), `Purchase` (pedido registrado en servidor, con
valor y moneda) y `Contact` (botones de WhatsApp). No se envían datos personales. Actualiza la sección
de cookies de la política de privacidad al activarlo (se actualiza sola con el ID).

## 6. Editar la tienda
- Precios, envío, datos de la empresa, estado: `src/config/tienda.ts`.
- Unidades disponibles reales: `src/config/inventario.ts` (nunca baja sola; se oculta si tiene más de 3 días).
- Desde GitHub puedes editar estos archivos en el navegador; Cloudflare recompila en ~1 minuto.
- `npm run check:launch` lista lo que falta para el lanzamiento. Con `estado: "operativa"` la compilación
  **falla** mientras quede algún pendiente.
