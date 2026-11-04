# Pagos, pedidos y notificaciones con GitHub Pages

GitHub Pages solo sirve archivos estáticos: **no hay servidor, ni secretos, ni captura de pagos en el navegador.**
El sitio ya tiene los puntos de conexión preparados en `src/config/commerce.ts` (`checkoutEnabled: false`).

## Opción A: botón alojado de PayPal (recomendada para empezar)

- El precio (32,40 €), el envío (0 €) y la descripción del pack **se definen en la cuenta de PayPal** y no pueden manipularse desde el navegador.
- Admite PayPal y tarjeta bancaria (pago como invitado, según la elegibilidad de la cuenta).
- **Registro de ventas fiable:** el historial de transacciones de PayPal, que es la fuente de verdad del pago.
- **Notificación:** PayPal envía un email por cada pago al correo de la cuenta. Hay que configurarlo en `corpusenigma4@gmail.com`.
- **Activación:**
  1. Crear el botón en PayPal (primero en sandbox).
  2. Indicar `provider: "paypal-hosted-button"`, `clientId` (público) y `hostedButtonId`.
  3. Poner `checkoutEnabled: true`.
- **Límite:** sin base de datos propia. Para conservar cada pedido fuera de PayPal hace falta añadir la opción B, al menos su webhook.

## Opción B: pequeña API externa (función serverless)

Se aloja aparte, por ejemplo en `api.revivegrow.store`. Los secretos quedan en variables de entorno del proveedor.

| Ruta | Función |
|---|---|
| `POST /orders` | Calcula el total en el servidor desde el catálogo y crea la orden PayPal (Orders v2) |
| `POST /orders/:id/capture` | Captura el pago y registra el pedido |
| `POST /webhooks/paypal` | Verifica la firma de `PAYMENT.CAPTURE.COMPLETED` y marca el pedido como pagado (fuente de verdad) |

- **Almacenamiento:** una base de datos (pedido, artículos, dirección, estado, ID de captura PayPal).
- **Emails:** confirmación al cliente y aviso a `corpusenigma4@gmail.com`, enviados **después** de verificar el pago.

> Un email nunca es el registro definitivo de una venta. La referencia es la captura verificada por PayPal, guardada en PayPal (A) o en la base de datos (B).

## Formulario de contacto

- **Servicio:** Formspree (compatible con sitios estáticos, filtro antispam, campo trampa `_gotcha` ya incluido).
- **Activación:** crear el formulario con `corpusenigma4@gmail.com` y pegar la URL en `CONTACT.formEndpoint`.
- **Mientras tanto:** el formulario se muestra desactivado y lo indica. La dirección de email está siempre disponible.
- **Pendiente:** añadir el servicio elegido a la política de privacidad (transferencia fuera de la UE).

## Publicación (cuando lo autorices)

1. Settings → Pages → Source: **GitHub Actions**. Hasta ese momento, el sitio actual sigue en línea.
2. Actions → «Publier sur GitHub Pages» → escribir `PUBLIER`.
3. El dominio `revivegrow.store` está configurado (`public/CNAME`). Se mantiene el DNS existente de GitHub Pages.
