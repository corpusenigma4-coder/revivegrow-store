/**
 * Ficha del producto transcrita de las fotografías de la etiqueta
 * (assets-sources/maca-negra/02-… y 03-…). No añadir datos que no estén en la etiqueta.
 */
export const PRODUCTO = {
  nombre: "Maca Negra + L-Arginina",
  nombreCompleto: "Maca Negra + L-Arginina 600 mg",
  descripcionEtiqueta: "Suplemento alimenticio en cápsulas a base de extracto de maca negra, L-arginina y zinc.",
  capsulasPorFrasco: 30,
  mgPorCapsula: 600,
  contenidoNeto: "18 g",
  fabricante: "LABMAC S.A.",
  /** Proveedor comercial de REVIVE GROW (uso interno, no se muestra al público). */
  proveedor: "NOVA SHOP",

  porcion: { capsulas: 3, mg: 1800, porcionesPorEnvase: 10 },
  modoDeUso: "Tomar 1 cápsula tres veces al día, después de las principales comidas.",
  publico: "Dirigido para hombres mayores de 19 años.",
  almacenamiento: "Conservar en un ambiente fresco y seco, a temperatura no mayor a 30 °C.",

  /** Cantidades por porción (3 cápsulas) según la información nutricional. */
  activos: [
    { nombre: "L-Arginina", cantidad: "1000 mg", vdr: null },
    { nombre: "Maca negra", cantidad: "207 mg", vdr: null, detalle: "Extracto de raíz (Lepidium meyenii W.)" },
    { nombre: "Zinc", cantidad: "40 mg", vdr: "266 %", detalle: "Como óxido de zinc" },
  ],

  ingredientes:
    "L-Arginina, cápsula [gelatina, agua, humectante (glicerol)], extracto de raíz de maca negra (Lepidium meyenii W.), espesante (almidón blanqueado), antiaglutinante (estearato de magnesio), lactosa, óxido de zinc. CONTIENE LACTOSA.",

  nutricional: [
    ["Energía total", "0 kJ (0 kcal)"],
    ["Grasa total", "0 g"],
    ["Colesterol", "0 mg"],
    ["Sodio", "0 mg"],
    ["Carbohidratos totales", "0 g"],
    ["Proteína", "0 g"],
  ] as const,

  advertencias: [
    "Manténgase fuera del alcance de los niños.",
    "No usar si el sello de seguridad está roto o no lo tiene.",
    "El producto no es adecuado para ser consumido como única fuente de alimento.",
    "Si usted está tomando algún medicamento, consulte con su médico antes de ingerir este producto.",
    "No superar la dosis recomendada.",
    "El producto no es apto para mujeres en período de lactancia, embarazo y niños.",
  ],
} as const;

/** Días que rinde un frasco según la dosis de la etiqueta: 30 / 3 = 10. */
export const DIAS_POR_FRASCO = PRODUCTO.capsulasPorFrasco / PRODUCTO.porcion.capsulas;
