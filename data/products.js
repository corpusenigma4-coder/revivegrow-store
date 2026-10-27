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
    published: false,
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
    published: false,
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
    published: true,
    slug: "calabaza",
    name: "Pijama Calabacita · Pumpkin Dream",
    categories: ["halloween"],
    tag: "Halloween · Premium",
    price: 19.35,
    currency: "USD",
    sizes: [
      { label: "3–6 meses", code: "62", height: "61–67 cm", weight: "5,7–7,5 kg", available: true },
      { label: "6–12 meses", code: "68–74", height: "67–74 cm", weight: "7,5–9,3 kg", available: true },
      { label: "9–12 meses", code: "80", height: "74–79 cm", weight: "9,3–11,1 kg", available: true },
      { label: "12–18 meses", code: "86", height: "79–84 cm", weight: "11,1–12,5 kg", available: true },
      { label: "18–24 meses", code: "92", height: "84–89 cm", weight: "12,5–13,6 kg", available: true }
    ],
    availability: "in-stock",
    previewArt: false,
    galleryLabels: [
      "Vista frontal de la pijama",
      "Detalle de capucha y bordados",
      "Vista posterior",
      "Pijama puesta: bebé gateando",
      "Pijama puesta: bebé sentado"
    ],
    color: "Naranja con detalles verdes",
    fit: "Unisex · calentita",
    materialHighlights: [
      { title: "Algodón orgánico interlock premium", detail: "Tejido suave y flexible, con una agradable sensación de abrigo." },
      { title: "Diseño calentito y cómodo", detail: "Enterizo de una pieza con puños suaves, pensado para acompañar sus movimientos." },
      { title: "Calabacita llena de encanto", detail: "Capucha con tallo y hojas verdes, carita bordada y cierre frontal." }
    ],
    shipping: "Enviamos a todo el mundo.",
    shippingTime: "Entrega estimada de 3 a 5 días hábiles; puede variar según el país y los trámites aduaneros.",
    returns: "Tienes hasta 90 días desde la entrega para solicitar una devolución.",
    care: "Lavar del revés con agua fría, en ciclo delicado. No usar blanqueador. Secar al aire y evitar planchar los bordados.",
    images: {
      main: "assets/products/calabaza/pumpkin-front.webp",
      front: "assets/products/calabaza/pumpkin-hood.webp",
      side: "assets/products/calabaza/pumpkin-back.webp",
      back: "assets/products/calabaza/pumpkin-baby-crawling.webp",
      details: ["assets/products/calabaza/pumpkin-baby-sitting.webp"]
    },
    descShort: "Una pijama de calabacita suave y calentita, con capucha, hojas verdes y una sonrisa bordada. Unisex, color naranja.",
    descLong: "La pijama Pumpkin Dream convierte cada momento en una pequeña aventura. Su diseño de calabacita incorpora una capucha con tallito y hojas verdes, carita bordada y cremallera frontal. Un enterizo cómodo y abrigadito para los días frescos, para jugar y para crear recuerdos preciosos.",
    materials: "Algodón orgánico interlock premium, según las especificaciones facilitadas para la colección.",
    sizeGuide: "Elige la talla según la estatura de tu bebé. Si está entre dos medidas, recomendamos la mayor.",
    featured: true
  },
  {
    id: "disfraz-conejito",
    slug: "conejito",
    name: "Enterizo Conejito · Bunny Dream",
    categories: [],
    tag: "Mini Dreams Collection",
    published: true,
    price: 23.55,
    currency: "USD",
    sizes: [
      { label: "3–6 meses", code: "62", height: "61–67 cm", weight: "5,7–7,5 kg", available: true },
      { label: "6–12 meses", code: "68–74", height: "67–74 cm", weight: "7,5–9,3 kg", available: true },
      { label: "9–12 meses", code: "80", height: "74–79 cm", weight: "9,3–11,1 kg", available: true },
      { label: "12–18 meses", code: "86", height: "79–84 cm", weight: "11,1–12,5 kg", available: true },
      { label: "18–24 meses", code: "92", height: "84–89 cm", weight: "12,5–13,6 kg", available: true }
    ],
    availability: "in-stock",
    previewArt: false,
    galleryLabels: ["Vista frontal", "Así luce puesto", "Detalles de la capucha", "Vista posterior", "Textura y acabados"],
    color: "Blanco",
    fit: "Unisex · abrigadito",
    materialHighlights: [
      { title: "Algodón orgánico interlock", detail: "Tejido suave y flexible, elegido para la comodidad del bebé." },
      { title: "Abrigo acogedor", detail: "Diseño calentito para días frescos y momentos de descanso." },
      { title: "Detalles encantadores", detail: "Capucha con orejitas largas, carita bordada y cierre frontal." }
    ],
    shipping: "Enviamos a todo el mundo.",
    shippingTime: "Entrega estimada de 3 a 5 días hábiles; puede variar según el país y los trámites aduaneros.",
    returns: "Tienes hasta 90 días desde la entrega para solicitar una devolución.",
    care: "Lavar del revés con agua fría, en ciclo delicado. No usar blanqueador. Secar al aire y evitar planchar los bordados.",
    images: {
      main: "assets/products/conejito/bunny-front.webp", front: "assets/products/conejito/bunny-baby.webp", side: "assets/products/conejito/bunny-hood.webp", back: "assets/products/conejito/bunny-back.webp", details: ["assets/products/conejito/bunny-texture.webp"]
    },
    descShort: "El conejito más tierno: una pieza suave y abrigadita con orejitas largas. Color blanco, estilo unisex.",
    descLong: "Un abrazo suave convertido en enterizo. Bunny Dream combina un diseño acogedor con capucha de conejito, orejas largas con interior rosado y un práctico cierre frontal. Perfecto para días frescos, paseos y esas fotos que querrás guardar para siempre.",
    materials: "Algodón orgánico interlock premium, según las especificaciones facilitadas para la colección.",
    sizeGuide: "Elige la talla según la estatura de tu bebé. Si está entre dos medidas, recomendamos la mayor.",
    featured: true
  }
];

window.MINI_DREAMS_DATA = { COLLECTIONS: COLLECTIONS, PRODUCTS: PRODUCTS };
