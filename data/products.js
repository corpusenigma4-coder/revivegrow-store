/* =============================================================
   MINI DREAMS — FUENTE ÚNICA DE DATOS (V2)
   -------------------------------------------------------------
   ÚNICA fuente de verdad: catálogo, página de producto y carrito
   leen de aquí. No dupliques nombres, precios ni rutas de imagen.

   ---- Añadir / completar un producto ----
   1. Copia un objeto de PRODUCTS y cambia "id" y "slug" (únicos).
   2. Guarda fotos en assets/products/<slug>/ con nombres
      descriptivos y apunta las rutas en "images".
   3. Cuando el precio y las tallas estén CONFIRMADOS:
        - price: número en USD
        - sizes: array de objetos { label, stock }  (stock>0 => comprable)
        - availability: "in-stock"
      El producto solo es comprable si price es número y hay al
      menos una talla con stock. Si no, se muestra "en preparación".

   ---- Datos de desarrollo ----
   Un producto marcado con  __dev: true  usa datos de PRUEBA (no
   reales) para poder verificar tallas / carrito / PayPal. Están
   claramente identificados y NO deben confundirse con stock real.
   Quitar __dev y poner datos reales antes de vender.
   ============================================================= */

var CATEGORIES = [
  { id: "animalitos",  name: "Animalitos adorables",     blurb: "Orejitas, colitas y mucha ternura.", accent: "var(--c-blue)" },
  { id: "halloween",   name: "Disfraces de Halloween",   blurb: "Para la noche más dulce del año.",   accent: "var(--c-yellow)" },
  { id: "conjuntos",   name: "Conjuntos y pijamas",      blurb: "Comodidad suave para cada día.",     accent: "var(--c-pink)" },
  { id: "especiales",  name: "Colecciones especiales",   blurb: "Piezas únicas para momentos únicos.", accent: "var(--c-blue)" }
];

/* Tallas de ejemplo para el producto de desarrollo. NO son medidas
   oficiales: son datos de prueba hasta confirmar con fabricación. */
var DEV_SIZES = [
  { label: "0–3 m",  stock: 5 },
  { label: "3–6 m",  stock: 3 },
  { label: "6–9 m",  stock: 0 },   /* agotada: se mostrará no disponible */
  { label: "9–12 m", stock: 2 }
];

var PRODUCTS = [
  {
    id: "disfraz-espantapajaros",
    slug: "espantapajaros",
    name: "Disfraz Espantapájaros",
    category: "halloween",
    tag: "Colección especial",
    price: null,
    currency: "USD",
    sizes: [],
    availability: "pending",      /* pending | coming-soon | in-stock */
    images: { main: "", front: "", back: "", side: "", details: [] },
    descShort: "",
    descLong: "",
    materials: "",
    care: "",
    sizeGuide: "",
    featured: true
  },
  {
    id: "disfraz-patito",
    slug: "patito",
    name: "Disfraz Patito",
    category: "animalitos",
    tag: "Vista previa de desarrollo",
    /* ---- DATOS DE DESARROLLO (no reales) para probar el flujo ---- */
    __dev: true,
    price: 24.90,
    currency: "USD",
    sizes: DEV_SIZES,
    availability: "in-stock",
    images: { main: "", front: "", back: "", side: "", details: [] },
    descShort: "Suavidad de peluche y una capucha con piquito para los días más tiernos. (Texto de ejemplo de desarrollo.)",
    descLong: "Este es un texto de DESARROLLO para probar la ficha de producto. El disfraz de patito se reemplazará por su descripción real cuando la confirmemos: tejido, forma de la capucha, cierre y detalles del diseño irán aquí. No es información comercial definitiva.",
    materials: "Pendiente de confirmar con fabricación (texto de ejemplo de desarrollo).",
    care: "Pendiente de confirmar (texto de ejemplo de desarrollo).",
    sizeGuide: "Las medidas por talla se publicarán cuando las confirmemos. Estas tallas son datos de prueba.",
    featured: true
  },
  {
    id: "disfraz-calabaza",
    slug: "calabaza",
    name: "Disfraz Calabaza",
    category: "halloween",
    tag: "Colección especial",
    price: null,
    currency: "USD",
    sizes: [],
    availability: "pending",
    images: { main: "", front: "", back: "", side: "", details: [] },
    descShort: "",
    descLong: "",
    materials: "",
    care: "",
    sizeGuide: "",
    featured: true
  },
  {
    id: "disfraz-conejito",
    slug: "conejito",
    name: "Disfraz Conejito",
    category: "animalitos",
    tag: "Nuevo",
    price: null,
    currency: "USD",
    sizes: [],
    availability: "pending",
    images: { main: "", front: "", back: "", side: "", details: [] },
    descShort: "",
    descLong: "",
    materials: "",
    care: "",
    sizeGuide: "",
    featured: true
  }
];

window.MINI_DREAMS_DATA = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS };
