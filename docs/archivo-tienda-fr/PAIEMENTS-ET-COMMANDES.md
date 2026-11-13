# Pagos y pedidos: estado actual

## Recorrido de compra (en producción)

«Obtenir l’offre» → `/commande/`: 1. Commande (resumen) → «Suivant» → 2. Livraison (email + dirección) → «Suivant» → 3. Paiement sécurisé.

- **Pago:** botones oficiales de PayPal (`paypal.Buttons`, SDK JS) con el mismo client-id público que el PR #15. Se muestra un botón PayPal y un botón «Carte bancaire — débit ou crédit», este último solo si PayPal lo declara disponible (`isEligible()`).
- **Datos que llegan a PayPal con cada pedido** (`src/lib/order.ts`):
  - email del cliente (`payer.email_address` y `custom_id`);
  - dirección de envío impuesta (`SET_PROVIDED_ADDRESS`);
  - referencia `RG-…` (`invoice_id`);
  - artículo «Pack Sommeil REVIVE GROW», 32,40 €, envío 0,00 €.

  Todo esto aparece en el detalle de la transacción en PayPal, que también avisa al vendedor por email.
- **Confirmación:** solo se muestra si PayPal devuelve la captura `COMPLETED` por 32,40 € EUR.
- **Por qué no el botón alojado:** el botón alojado (`SZCKF3B62AX6A`) no acepta email ni dirección prerrellenados, así que PayPal los pediría otra vez. Se conserva en el código (`provider: "paypal-hosted-button"` lo reactiva).

## Límite de seguridad que debes conocer

En un sitio estático (GitHub Pages) el importe se crea en el navegador, así que alguien con conocimientos técnicos podría manipularlo. **Antes de cada envío, comprueba en PayPal que el importe cobrado es 32,40 € y que la referencia empieza por RG-.** Para eliminar ese riesgo hace falta un pequeño servidor (opción B, más abajo).

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
