/* =============================================================
   MINI DREAMS — FUENTE ÚNICA DE DATOS
   -------------------------------------------------------------
   Esta es la ÚNICA fuente de verdad de catálogo y categorías.
   Las tarjetas, la página de detalle y el carrito leen de aquí.
   No dupliques nombres, precios ni rutas de imágenes en otros
   archivos.

   Cómo añadir un producto nuevo (V1):
     1. Copia un objeto del array PRODUCTS.
     2. Cambia "id" y "slug" por valores únicos (sin espacios).
     3. Rellena nombre, categoría y descripción.
     4. Cuando tengas fotos reales, guárdalas en
        assets/products/<slug>/ con nombres descriptivos
        (ej: patito-principal.webp) y apunta las rutas en "images".
     5. Cuando el precio/tallas estén confirmados, pon
        stockStatus: "available", el precio en USD y las tallas.
        Mientras stockStatus !== "available", el producto se
        muestra como "Próximamente" y NO se puede comprar.

   Estados de stock admitidos:
     "pending"     -> Datos en preparación. No comprable.
     "coming-soon" -> Próximamente. No comprable.
     "available"   -> A la venta. Comprable (requiere precio+tallas).
   ============================================================= */

/* Categorías del catálogo. El "id" se usa para filtrar. */
const CATEGORIES = [
  {
    id: "animalitos",
    name: "Animalitos adorables",
    blurb: "Orejitas, colitas y mucha ternura.",
    accent: "var(--c-blue)"
  },
  {
    id: "halloween",
    name: "Disfraces de Halloween",
    blurb: "Para la noche más dulce del año.",
    accent: "var(--c-yellow)"
  },
  {
    id: "conjuntos",
    name: "Conjuntos y pijamas",
    blurb: "Comodidad suave para cada día.",
    accent: "var(--c-pink)"
  },
  {
    id: "especiales",
    name: "Colecciones especiales",
    blurb: "Piezas únicas para momentos únicos.",
    accent: "var(--c-blue)"
  }
];

/* -------------------------------------------------------------
   PRODUCTOS INICIALES (V1)
   Son 4 productos DISTINTOS. Aunque varios compartan temática de
   Halloween, cada uno es independiente: no compartir imágenes.
   price: null y sizes: [] => datos pendientes => NO comprable.
   ------------------------------------------------------------- */
const PRODUCTS = [
  {
    id: "disfraz-espantapajaros",
    slug: "espantapajaros",
    name: "Disfraz Espantapájaros",
    category: "halloween",
    tag: "Colección especial",
    price: null,
    currency: "USD",
    sizes: [],
    stockStatus: "pending",
    images: {
      main: "",
      front: "",
      back: "",
      side: "",
      details: []
    },
    description: "",
    materials: "",
    care: "",
    featured: true
  },
  {
    id: "disfraz-patito",
    slug: "patito",
    name: "Disfraz Patito",
    category: "animalitos",
    tag: "Nuevo",
    price: null,
    currency: "USD",
    sizes: [],
    stockStatus: "pending",
    images: {
      main: "",
      front: "",
      back: "",
      side: "",
      details: []
    },
    description: "",
    materials: "",
    care: "",
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
    stockStatus: "pending",
    images: {
      main: "",
      front: "",
      back: "",
      side: "",
      details: []
    },
    description: "",
    materials: "",
    care: "",
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
    stockStatus: "pending",
    images: {
      main: "",
      front: "",
      back: "",
      side: "",
      details: []
    },
    description: "",
    materials: "",
    care: "",
    featured: true
  }
];

/* Expuesto como global para los scripts de la página (sin build step). */
window.MINI_DREAMS_DATA = { CATEGORIES, PRODUCTS };
