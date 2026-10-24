/* =============================================================
   MINI DREAMS — INTEGRACIÓN PAYPAL (recuperada de ReviveGrow)
   -------------------------------------------------------------
   Adaptada a: carrito con múltiples artículos, tallas, cantidades
   y precios en USD. Reutiliza el enfoque client-side del SDK
   PayPal Buttons que ya usaba la tienda anterior.

   ⚠️ SEGURIDAD — LEER:
   Esta integración es 100% del lado del cliente: el total del
   pedido se calcula en el navegador. Eso significa que NO hay
   verificación fiable del precio en servidor. Para producción se
   necesita una función de servidor que cree y capture la orden
   validando precios contra el catálogo (ver NOTA_SERVIDOR abajo).

   Por eso, en esta previsualización PayPal arranca DESACTIVADO
   (MD_PAYPAL.enabled = false): se muestra el botón de pago como
   "en preparación" y no se inicia ninguna transacción real.
   Para habilitarlo en entorno de prueba (sandbox), cambia el
   client-id por uno de sandbox y pon enabled = true.
   ============================================================= */
(function () {
  "use strict";

  var MD = window.MD;
  if (!MD) return;

  /* Interruptor de seguridad: desactivado en previsualización.
     No se carga el SDK ni se renderizan botones de pago reales. */
  var CONFIG = {
    enabled: false,          // poner true solo con client-id de sandbox + servidor
    currency: "USD",
    contactEmail: "corpusenigma4@gmail.com"
    // clientId: "<SOLO SANDBOX AQUÍ>"   // nunca pegar secretos; el client-id del SDK es público
  };

  function mount(t) {
    var host = MD.$("#cartPay");
    var note = MD.$("#cartNote");
    if (!host) return;

    if (!CONFIG.enabled) {
      // Estado de previsualización: botón visible pero inactivo, mensaje claro.
      host.innerHTML =
        '<button class="btn btn--primary btn--block btn--lg" type="button" disabled aria-disabled="true">' +
          'Pagar con PayPal · en preparación</button>';
      if (note) {
        note.innerHTML = 'El pago está preparado técnicamente pero desactivado en esta previsualización. ' +
          'Se activará con verificación de pedido en servidor. No se cobra nada.';
      }
      return;
    }

    // --- Camino activo (solo si enabled=true y el SDK cargó) ---
    if (typeof paypal === "undefined" || !paypal.Buttons) {
      host.innerHTML = '<p class="pp-fallback">No se pudo cargar el pago seguro ahora mismo. ' +
        'Actualiza la página o escríbenos a <a href="mailto:' + CONFIG.contactEmail + '">' + CONFIG.contactEmail + '</a>.</p>';
      return;
    }

    host.innerHTML = '<div id="paypal-buttons"></div><p class="pp-fallback" id="ppFallback"></p>';
    var fallback = MD.$("#ppFallback");

    try {
      paypal.Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },

        createOrder: function (data, actions) {
          var cart = MD.getCart();
          var items = cart.map(function (l) {
            var p = MD.getProduct(l.id);
            return {
              name: (p.name + " · Talla " + l.size).slice(0, 127),
              quantity: String(l.qty),
              unit_amount: { currency_code: CONFIG.currency, value: p.price.toFixed(2) }
            };
          });
          var total = MD.totals().sub.toFixed(2);
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: CONFIG.currency,
                value: total,
                breakdown: { item_total: { currency_code: CONFIG.currency, value: total } }
              },
              items: items
            }]
          });
        },

        onApprove: function (data, actions) {
          if (fallback) fallback.textContent = "";
          return actions.order.capture().then(function (details) {
            if (window.MD_PAYPAL && typeof window.MD_PAYPAL.onPaid === "function") window.MD_PAYPAL.onPaid(details);
          }).catch(function (e) {
            console.error("Capture failed:", e);
            if (fallback) fallback.innerHTML = "El pago no pudo completarse. No se realizó ningún cargo. " +
              'Inténtalo de nuevo o escríbenos a <a href="mailto:' + CONFIG.contactEmail + '">' + CONFIG.contactEmail + '</a>.';
          });
        },

        onCancel: function () { if (fallback) fallback.textContent = "Pago cancelado — puedes intentarlo cuando quieras."; },
        onError: function (err) {
          console.error("PayPal error:", err);
          if (fallback) fallback.innerHTML = "Hubo un problema al iniciar el pago. Inténtalo de nuevo.";
        }
      }).render("#paypal-buttons").catch(function (e) {
        console.error("PayPal render failed:", e);
        if (fallback) fallback.textContent = "No se pudo cargar el pago seguro. Actualiza la página.";
      });
    } catch (e) {
      console.error(e);
      if (fallback) fallback.textContent = "No se pudo cargar el pago seguro. Actualiza la página.";
    }
  }

  window.MD_PAYPAL = {
    enabled: CONFIG.enabled,
    mount: mount,
    onPaid: function (details) {
      // Sitio para la confirmación post-pago cuando esté activo + verificado en servidor.
      try { MD.showToast("¡Gracias! Pedido " + ((details && details.id) || "") + " recibido."); } catch (e) {}
    }
  };

  /* ----------------------------------------------------------------
     NOTA_SERVIDOR (propuesta para producción, punto 6 del encargo):
     1. Backend (p.ej. función serverless) con dos endpoints:
          POST /orders        -> crea la orden calculando el total en
                                 servidor desde el catálogo (no confía
                                 en el navegador).
          POST /orders/:id/capture -> captura y verifica el pago con la
                                 API REST de PayPal usando CLIENT_ID +
                                 SECRET guardados como variables de
                                 entorno (NUNCA en el frontend).
     2. El frontend solo llama a esos endpoints; el secreto jamás sale
        del servidor. Así el precio no se puede manipular desde el
        cliente y el pedido se marca pagado solo con confirmación real.
     ---------------------------------------------------------------- */
})();
