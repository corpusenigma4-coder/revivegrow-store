/* =============================================================
   MINI DREAMS — FUENTE ÚNICA DE DATOS
   -------------------------------------------------------------
   ÚNICA fuente de verdad: catálogo, página de producto y carrito
   leen de aquí. No dupliques nombres, precios ni rutas de imagen.

   ---- Secciones del catálogo ----
   El catálogo se organiza en tres secciones:
     • "todo"       -> FILTRO que muestra TODOS los productos.
                       NO es una categoría que se asigne a productos.
     • "halloween"  -> colección de Halloween.
     • "navidad"    -> colección navideña (puede estar vacía).
   Un producto declara a qué colecciones pertenece en "categories"
   (un arreglo). Puede pertenecer a varias sin duplicar el registro.
   Si "categories" está vacío, el producto solo aparece en "Todo".

   ---- Añadir / completar un producto ----
   1. Copia un objeto de PRODUCTS y cambia "id" y "slug" (únicos).
   2. Asigna "categories" (p.ej. ["halloween"] o ["navidad"] o ambas).
   3. Guarda fotos en assets/products/<slug>/ y apunta rutas en "images".
   4. Cuando el precio y las tallas estén CONFIRMADOS:
        - price: número en USD
        - sizes: array de objetos { label, stock }  (stock>0 => comprable)
        - availability: "in-stock"
      El producto solo es comprable si price es número y hay al menos
      una talla con stock. Si no, se muestra "en preparación".

   ---- Datos de desarrollo ----
   Un producto marcado con  __dev: true  usa datos de PRUEBA (no
   reales) para verificar tallas / carrito / PayPal. Quitar __dev y
   poner datos reales antes de vender.
   ============================================================= */

/* Colecciones temáticas reales (sin contar el filtro "Todo"). */
var COLLECTIONS = [
  {
    id: "halloween",
    name: "Halloween",
    blurb: "Disfraces llenos de ternura para la noche más dulce.",
    emptyMsg: "Pronto llegarán nuevos disfraces de Halloween."
  },
  {
    id: "navidad",
    name: "Navidad",
    blurb: "Prendas cálidas y adorables para las fiestas.",
    emptyMsg: "La colección de Navidad está en preparación. ¡Muy pronto!"
  }
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
    categories: ["halloween"],
    tag: "Colección especial",
    price: null,
    currency: "USD",
    sizes: [],
    availability: "pending",      /* pending | coming-soon | in-stock */
    previewArt: true,
    images: { main: "assets/ui/concept-espantapajaros.svg", front: "", back: "", side: "", details: [] },
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
    categories: [],               /* solo aparece en "Todo" por ahora */
    tag: "Vista previa de desarrollo",
    /* ---- DATOS DE DESARROLLO (no reales) para probar el flujo ---- */
    __dev: true,
    price: 24.90,
    currency: "USD",
    sizes: DEV_SIZES,
    availability: "in-stock",
    previewArt: true,
    images: { main: "assets/ui/concept-patito.svg", front: "", back: "", side: "", details: [] },
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
    categories: ["halloween"],
    tag: "Colección especial",
    price: null,
    currency: "USD",
    sizes: [],
    availability: "pending",
    previewArt: true,
    images: { main: "assets/ui/concept-calabaza.svg", front: "", back: "", side: "", details: [] },
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
    categories: [],               /* solo aparece en "Todo" por ahora */
    tag: "Nuevo",
    price: null,
    currency: "USD",
    sizes: [],
    availability: "pending",
    previewArt: true,
    images: { main: "assets/ui/concept-conejito.svg", front: "", back: "", side: "", details: [] },
    descShort: "",
    descLong: "",
    materials: "",
    care: "",
    sizeGuide: "",
    featured: true
  }
];

window.MINI_DREAMS_DATA = { COLLECTIONS: COLLECTIONS, PRODUCTS: PRODUCTS };
