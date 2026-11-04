# REVIVE GROW — Plan maestro v2 (actualizado el 04/11/2026)

Integra la actualización de la marca: nuevas imágenes, especificaciones, oferta, calendario, envíos y garantía.

## 1. Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Identidad | 100 % nueva. Nada de Mini Dreams: ni paleta, ni tipografías (Fraunces/DM Sans), ni estructura. |
| Dirección | «Le calme, pensé dans le détail»: marfil, lino, arena, salvia y noche grafito. Editorial, sobria. |
| Oferta | Pack Sommeil = oreiller + masque + bandelettes, **32,40 € TTC**, un único SKU (`RG-PACK-SOMMEIL`). Regalos indisociables. |
| Descuento | 54,00 € de referencia **no se muestra** hasta tener prueba del precio más bajo de los 30 días anteriores. |
| Campaña | Del 04/11/2026 00:00 al **11/11/2026 23:59 (Europe/Paris)**. Cuenta atrás real, «Derniers jours» a 48 h, «Dernier jour» a 24 h, bloqueo automático al final. |
| Entrega | «Livraison sous 3 à 5 jours ouvrés», Francia metropolitana. Sin transportista ni gratuidad anunciados. |
| Garantía | 90 días «satisfait ou remboursé», comercial, **además** de los derechos legales. |
| Prueba social | 4,9/5 y +3.000 clientes atribuidos al fabricante, con espacio para la fuente. Bloque aparte para las opiniones REVIVE GROW. |

## 2. Inventario de imágenes

| Archivo original | Uso | Observaciones |
|---|---|---|
| 05-pack-2-cadeaux | **Hero** + galería (recorte sin el texto «2 cadeaux offerts», que se reproduce en HTML) | 1672 px, correcto en móvil, justo en retina de escritorio. |
| 06-masque-collage | 3 recortes: masque, perfiles, cavidades | Es un collage: harían falta las fotos individuales originales. |
| 07-bandelettes-banniere | Recortes: caja, bandeleta colocada | Banner con texto integrado y pictogramas («Meilleure respiration», «Sans médicament»): **no se usan** (alegación de salud). La caja dice «Bandes Nasales», distinto de «Bandelettes Nasales». La foto de la bandeleta colocada mide solo 350 px. |
| 01-oreiller-couches | Recorte de la almohada abierta con sus capas | **Muestra 3 capas bajo el núcleo, mientras que la especificación indica 2 insertos de 3 cm.** Hay que aclararlo. Lleva texto integrado. 736 px de ancho útil. |
| 02, 04 | No se usan | Pictogramas de salud («Douleur dorsale», «Fatigue chronique», «Alignement parfait»). |
| 03-coloris | No se usa | 12 colores con etiquetas Homme/Femme/Enfants. ¿Colores reales en stock? |

**Faltan:** una foto de la almohada sola sin texto (≥ 2400 px), la secuencia de apertura de la funda y una vista lateral con 0, 1 y 2 insertos para el configurador fotográfico (fase 2).

## 3. Puntos de vigilancia legales y de producto

1. **Bandelettes nasales**: en la UE, los dilatadores nasales suelen ser **productos sanitarios de clase I (MDR 2017/745)**. Hay que obtener del proveedor el marcado CE, la declaración de conformidad y los datos del fabricante y del responsable en la UE antes de venderlas, aunque sean un regalo. La redacción se mantiene mecánica, sin promesas sobre ronquidos ni respiración.
2. **Producto (GPSR 2023/988)**: fabricante, responsable en la UE, advertencias e instrucciones de los 3 artículos.
3. **Especificaciones**: 8/11/14 cm, mousse viscoélastique, cavidades de 11 mm y 30 bandelettes van marcadas como **«À confirmer»** hasta tener la ficha del proveedor.
4. **Higiene**: posible excepción al desistimiento para la bandelettes y el antifaz una vez desprecintados. Requiere validación jurídica y mención clara.
5. **11 de noviembre** es festivo en Francia: no cuenta como día hábil para el plazo de entrega.

## 4. Riesgo de calendario

La campaña termina el **11/11/2026 a las 23:59**. Un checkout seguro (fase 3) exige credenciales PayPal sandbox y live, la cuenta de hosting, la identidad del vendedor y las páginas legales completas.
- **Si estos elementos no están disponibles a tiempo**, la tienda no puede abrir de forma conforme antes del final de la oferta. En ese caso hay que **confirmar un nuevo calendario**; la cuenta atrás nunca simula días ya transcurridos.
- `npm run check:launch` bloquea mientras la campaña ya haya empezado sin confirmación explícita.

## 5. Fases

| Fase | Contenido | Estado |
|---|---|---|
| F0 | Ramas de archivo `archive/mini-dreams` y `archive/revivegrow-uk` + bundle git verificado | ✅ |
| F1 | Astro, sistema de diseño, componentes, navegación, estructura de inicio/ficha/legal, tests, CI | ✅ vista previa |
| F2 | Configurador fotográfico (cuando lleguen las fotos), comparador antes/después con imágenes conformes, textos definitivos, animaciones finas | — |
| F3 | Cloudflare Pages + Functions, PayPal Orders v2 en servidor (sandbox), D1, emails Brevo, carrito/checkout, desistimiento online | — |
| F4 | Textos legales con los datos reales, SEO (Product/Offer/shipping/return), mediación, cookies | — |
| F5 | QA: Lighthouse, axe, e2e móvil, escenarios de error de pago | — |
| F6 | DNS, PayPal live, pedido real con reembolso, monitorización (con tu «go») | — |

## 6. Información todavía necesaria

- **Vendedor:** razón social, forma jurídica, dirección, SIREN/RCS, IVA, director de publicación, contacto y mediador de consumo.
- **Proveedor:** fichas técnicas de los 3 artículos (medidas, materiales, número real de capas, cantidad de bandelettes), documentos CE/MDR de las bandelettes y GPSR.
- **Envío:** gastos de envío, transportista, dirección de devolución y quién paga la devolución dentro de los 90 días.
- **Oferta:** precio y oferta después del 11/11; prueba del precio de referencia, si existe.
- **Prueba social:** fuente de 4,9/5 y +3.000 (enlace + captura fechada).
- **Técnico:** cuenta PayPal Business (sandbox + live, elegibilidad para tarjeta), cuenta de Cloudflare y acceso al registrador del dominio.
- **Recursos:** logo vectorial y las fotos listadas en el punto 2.
