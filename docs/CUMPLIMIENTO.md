# Análisis de materiales, afirmaciones y cumplimiento

> **Producto actual: TESTO-GH (GENETICS Nutrition & Business).** La landing se adaptó desde la versión
> de Maca Negra + L-Arginina (commit `b55c634`, cuyo análisis se conserva más abajo como referencia).

## TESTO-GH — materiales recibidos (`assets-sources/testo-gh/`)

| Archivo | Qué es | Uso |
|---|---|---|
| 07-frasco-frontal.webp (1024×1536) | Foto del frasco sobre fondo blanco | Foto principal y oferta, sin modificar |
| 06-poster-promocional-NO-USAR.webp | Póster con culturista, rayos y afirmaciones | **No se usa** |
| 08-anuncio-antes-despues-NO-USAR.webp | Antes/después con el frasco pegado | **No se usa** |

### Lo que se puede afirmar con los materiales
Solo lo que muestra el frente del envase: **TESTO-GH**, marca **GENETICS Nutrition & Business**,
**Multi Vitamin For Men** (multivitamínico para hombres), **60 cápsulas**. Precios iguales a la versión anterior:
1 frasco $27,40 · 2 frascos $37,40 (120 cápsulas, ahorro $17,40 / 31,8 %).

### Lo que falta y NO se inventó
No hay etiqueta posterior: **composición, cantidades, dosis, días por frasco, fabricante, advertencias,
Notificación Sanitaria y lote/caducidad son desconocidos.** La página lo dice con honestidad y ofrece
«Pedir foto de la etiqueta» por WhatsApp. Al completar `src/config/producto.ts`, la tabla nutricional,
el modo de uso, la duración (días por frasco, costo por día) y las advertencias aparecen solos.

### Alertas importantes
1. **La foto del frasco parece generada por IA:** contiene textos sin sentido («PITASETINE NERIM GRTON»,
   «INCENDIALE», «Contimae:», sello «GEENTICS»). Pide al proveedor **fotos reales del frasco físico**
   (frente, laterales, etiqueta posterior, lote y caducidad) antes de vender o anunciar.
2. **Leyendas del envase:** «Increase Testosterone», «Increase Muscle Mass», «Support Libido»,
   «Support Sport Strength». Son afirmaciones que no se repiten en la landing y que la etiqueta aprobada por
   ARCSA debe respaldar; si la Notificación Sanitaria no las incluye, el producto podría no ser comercializable.
3. **Nombre «GH»:** puede sugerir hormona de crecimiento. Verificar en la composición que no contiene hormonas
   ni sustancias prohibidas.
4. **El póster y el antes/después** prometen testosterona, masa muscular, fuerza, libido, «resultados comprobados»
   y «calidad certificada», sin sustento. El antes/después reutiliza las mismas personas del anuncio de maca
   (incluso con raíces de maca en la mesa): no son resultados reales de TESTO-GH. No deben usarse en la web
   ni en anuncios de Meta (además, Meta restringe anuncios de suplementos con antes/después y promesas corporales).

### Copia usada en la landing
Descriptiva y verificable: «Multivitamínico para hombres», «60 cápsulas», «pensado para hombres con una rutina
activa» (posicionamiento, sin efecto prometido), formato práctico, oferta x2, pago contra entrega.
Evitado: testosterona, masa muscular, fuerza, rendimiento, libido, energía, resultados, certificaciones.

Las verificaciones de producto están en `VERIFICACION_PRODUCTO` (`src/config/producto.ts`) y bloquean
el paso a «operativa» junto con el resto de pendientes (`npm run check:launch`).

---

# Referencia: versión anterior (Maca Negra + L-Arginina)

## 1. Materiales recibidos (copias sin modificar en `assets-sources/maca-negra/`)

| Archivo | Qué es | Uso |
|---|---|---|
| 01-frasco-promocional-proveedor.png (700×700) | Imagen promocional del proveedor (render de estudio) | Foto principal, oferta e imagen para compartir. Etiqueta sin alterar. |
| 02-etiqueta-modo-de-uso-advertencias.webp | Foto real del frasco: modo de consumo, almacenamiento, advertencias, BPM, fechas | Sección «La etiqueta real» y fuente de las advertencias |
| 03-etiqueta-ingredientes-informacion-nutricional.webp | Foto real: ingredientes e información nutricional | Sección «Qué contiene» y tabla nutricional |
| 04-anuncio-antes-NO-USAR.png (442×682) | Anuncio «ANTES / ¡SIN ENERGÍA!» | **No se usa** (ver §3) |
| 05-anuncio-despues-NO-USAR.png (262×432) | Anuncio «DESPUÉS + ENERGÍA + MÚSCULO … 30 días» | **No se usa** (ver §3) |

## 2. Datos verificados en la etiqueta (fotos 02 y 03)

- Suplemento alimenticio en cápsulas a base de extracto de maca negra, L-arginina y zinc. 30 cápsulas × 600 mg (18 g).
- Porción: 3 cápsulas (1800 mg); 10 porciones por envase → **un frasco = 10 días; dos frascos = 20 días**.
- Por porción: L-arginina 1000 mg · maca negra 207 mg · zinc 40 mg (266 % VDR). 0 kcal. **Contiene lactosa.**
- Modo de consumo: 1 cápsula tres veces al día, después de las principales comidas. Hombres mayores de 19 años.
- Advertencias: fuera del alcance de niños; no usar con sello roto; no es única fuente de alimento; consultar al médico si toma medicamentos; no superar la dosis; no apto para embarazo, lactancia ni niños.
- Elaborado y distribuido por LABMAC S.A. El número de **Notificación Sanitaria no es legible/visible** en las fotos.
- **Alerta:** la unidad fotografiada indica `ELB: AGO 2023 · EXP: AGO 2026 · LOTE 0003`. A la fecha de este desarrollo (noviembre 2026) ese lote está **vencido**. Confirmar con NOVA SHOP la caducidad del lote que se venderá (`sanitario.caducidadLoteEnVenta`).
- El anuncio del proveedor dice «suministro de 30 días»: **es incorrecto** según la etiqueta (10 días por frasco). La landing usa 10/20 días.

## 3. Comparador antes/después: decisión

Se evaluó un deslizador interactivo y **se descartó**:
- No es la misma persona (rasgos, complexión, cabello y edad distintos), ni el mismo encuadre, luz o lugar (sala vs. gimnasio); tamaños distintos (442×682 vs. 262×432) y baja resolución.
- Tienen rasgos de imagen generada por IA (el texto del frasco en «ANTES» está deformado).
- Llevan textos incrustados no publicables: «+ MÚSCULO», «+ ENERGÍA», «suministro de 30 días», «OFERTA LIMITADA».
- No hay consentimiento ni evidencia de que el cambio se deba al producto. Presentarlas como resultado sería publicidad engañosa (LODC) y una atribución de propiedades no autorizada.

Alternativa elegida: una sección visual de **rutina diaria** (desayuno / almuerzo / cena) y la **etiqueta real ampliable**, que generan confianza sin prometer resultados. Si en el futuro hay fotos auténticas, de la misma persona, con consentimiento escrito y sustento, se puede añadir el comparador.

## 4. Afirmaciones

**Usadas (descriptivas, verificables):** composición y cantidades de la etiqueta; modo de uso; «complemento para tu alimentación / bienestar / vida activa» como posicionamiento, sin efecto prometido; «Rutina sencilla»; descripciones neutras de cada ingrediente (origen andino de la maca; alimentos con arginina; el zinc es un mineral esencial que se obtiene de la dieta).

**Evitadas a propósito:** aumento de testosterona, libido, potencia o rendimiento sexual; disfunción eréctil; masa muscular; «más energía»; resultados garantizados o en X días; antes/después; testimonios, reseñas, cifras de ventas o certificaciones.

**Texto de la etiqueta no reproducido en la publicidad:** el frasco incluye «El zinc contribuye a la fertilidad y reproducción normales» y «…al mantenimiento de los niveles normales de testosterona». Son declaraciones de propiedades de la etiqueta del fabricante; no se repiten en la landing hasta confirmar que constan en la Notificación Sanitaria aprobada y que ARCSA permite su uso publicitario. (Las fotos de la etiqueta sí se muestran tal cual.)

**Nota añadida por la tienda:** 40 mg de zinc por día es una cantidad alta (266 % VDR); se recomienda no combinarlo con otros suplementos de zinc sin consejo profesional.

## 5. Urgencia honesta
- Siempre: «Unidades limitadas · Oferta sujeta a disponibilidad» (dato real indicado por el proveedor).
- Cifra de unidades: solo si se escribe un valor real en `src/config/inventario.ts`, con fecha; no baja sola y se oculta si tiene más de 3 días. Con 0 la tienda muestra «Agotado» y desactiva pedidos; con 1 desactiva el paquete doble y lo avisa.
- Sin temporizadores, fechas límite ni compradores recientes ficticios. Sin precio tachado: el ahorro se compara con 2 frascos individuales ($54,80 − $37,40 = $17,40; 31,8 %).

## 6. Requisitos antes de vender (lista de `npm run check:launch`)
1. **ARCSA:** verificar en la consulta pública de ARCSA el número de Notificación Sanitaria del producto, su titular y su vigencia; confirmar que la comercialización por un tercero está permitida y conservar la factura de compra al proveedor.
2. **Publicidad:** revisar los textos con la normativa ARCSA vigente para suplementos alimenticios (Resolución ARCSA-DE-028-2016-YMIH y su reforma ARCSA-DE-2026-021-DASP, que entra en vigencia seis meses después de su publicación) — no se pudo consultar el texto oficial desde este entorno.
3. **Producto:** fotos reales, composición, dosis, advertencias, fabricante y caducidad del lote (ver alertas de TESTO-GH).
4. **Datos del vendedor:** razón social, RUC, domicilio y horario (páginas legales y pie).
5. **Envío y pago:** empresa de mensajería, cobertura, costo, plazo, intentos de entrega y formas de pago al recibir.
6. **Tributario:** si los precios incluyen IVA y qué comprobante se emite.
7. **Devoluciones:** confirmar con un abogado el plazo del art. 45 LODC (el texto consultado indica 3 días; una nota de prensa de 2026 menciona 15) y definir costo y forma de reembolso.
8. **Privacidad (LOPDP):** plazo de conservación de datos y si NOVA SHOP recibe los datos de los clientes.

Cuando todo esté completo: `estado: "operativa"` en `src/config/tienda.ts` (quita el `noindex` y el aviso de vista previa); `robots.txt` se actualiza solo.
