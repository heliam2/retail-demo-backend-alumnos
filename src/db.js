const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// -----------------------------------------------------------------------
// "Base de datos" simple basada en un archivo JSON.
// Objetivo: mantener el proyecto liviano para el diplomado, sin dependencias
// nativas (sqlite3, postgres, etc). El estado vive en memoria y se persiste
// a disco en cada escritura, simulando el comportamiento de una BD real.
//
// Ejercicio sugerido para los estudiantes: migrar esta capa a SQLite/Postgres
// sin romper los contratos de la API (excelente caso de regresión).
// -----------------------------------------------------------------------

const DATA_FILE = path.join(__dirname, "..", "data.json");

// -----------------------------------------------------------------------
// Imagenes placeholder generadas localmente (SVG como data URI).
// Se usan en vez de un servicio externo (picsum.photos, etc.) para que el
// proyecto funcione igual sin conexion a internet o detras de firewalls
// restrictivos, algo comun en salas de clase/laboratorios.
//
// Cada producto muestra un icono de linea (trazado SVG en grilla 24x24,
// estilo Lucide) sobre el fondo de color. Si el label no tiene icono
// asociado se cae al texto plano, manteniendo el comportamiento anterior.
// -----------------------------------------------------------------------
const PLACEHOLDER_ICONS = {
  Zapatillas:
    '<path d="M2 15.5C2 14 3 13 4.5 12.5L9 11c.6-.2 1-.6 1.3-1.2L12 6l2 1.5c.5.4 1.2.5 1.8.5H17c2.5 0 4.5 1.8 4.8 4.3L22 15.5"/><path d="M2 15.5h20V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><path d="M8.5 11.2l1.2 2M12 9.6l1.2 2M15 8.4l1 2"/>',
  Polera:
    '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  Mochila:
    '<path d="M4 20V10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/><path d="M9 14h6"/>',
  Audifonos:
    '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  Jockey:
    '<path d="M4 14a8 8 0 0 1 16 0Z"/><path d="M20 14h1.5a1.5 1.5 0 0 1 0 3H12"/>',
  Botella:
    '<path d="M8 2h8"/><path d="M9 2v2.8a4 4 0 0 1-.67 2.22l-.66.98A4 4 0 0 0 7 10.2V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.8a4 4 0 0 0-.67-2.22l-.66-.98A4 4 0 0 1 15 4.8V2"/><path d="M7 15a6.5 6.5 0 0 1 5 0 6.5 6.5 0 0 0 5 0"/>',
  Botas:
    '<path d="M5 21h14"/><path d="M5 21V9l4-7h2l1 4h3l2 3v12"/><path d="M5 14h9"/>',
  Sandalias:
    '<path d="M3 18h18"/><path d="M7 18V9"/><path d="M17 18V9"/><path d="M7 13h10"/><path d="M4 9h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2z"/>',
  Pantalon:
    '<path d="M7 2h10v11l-2.5 9h-5L7 13V2z"/><path d="M7 13h10"/>',
  Chaqueta:
    '<path d="M15 3H9L6 7v14h12V7l-3-4z"/><path d="M9 3v4"/><path d="M15 3v4"/><path d="M6 7h12"/><path d="M12 7v14"/>',
  Shorts:
    '<path d="M7 2h10v7l-2 7H9L7 9V2z"/><path d="M7 9h10"/>',
  Billetera:
    '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  Smartwatch:
    '<circle cx="12" cy="12" r="6"/><polyline points="12 10 12 12 13 13"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 3.96"/><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"/>',
  Powerbank:
    '<rect width="16" height="10" x="2" y="7" rx="2"/><line x1="22" x2="22" y1="11" y2="13"/><path d="m7 12 2 2 4-4"/>',
  Teclado:
    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M8 8h.01"/><path d="M12 8h.01"/><path d="M16 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M8 16h8"/>',
  Pesa:
    '<path d="M6 5v14M18 5v14"/><path d="M4 7h4M16 7h4M4 17h4M16 17h4M8 12h8"/>',
  Colchoneta:
    '<rect x="2" y="9" width="20" height="6" rx="3"/><path d="M2 12h20"/>',
  Cuerda:
    '<path d="M3 19c3-6 3-14 9-14s6 8 9 14"/><circle cx="2" cy="20" r="1.5"/><circle cx="22" cy="20" r="1.5"/>',
  Banda:
    '<ellipse cx="12" cy="12" rx="10" ry="5"/><path d="M2 12c0 4.4 4.5 8 10 8s10-3.6 10-8"/>',
  Cojin:
    '<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M2 12h20"/>',
  Vela:
    '<path d="M12 1c.6.7 1 1.4 1 2 0 .7-.4 1.3-1 2s-1 1.3-1 2c0 .6.4 1.3 1 2"/><rect x="8" y="9" width="8" height="13" rx="1"/><path d="M8 22h8"/>',
  Organizador:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  Lampara:
    '<path d="M8 2h8l2 8H6l2-8z"/><path d="M6 10v2a6 6 0 0 0 12 0v-2"/><path d="M12 16v6"/><path d="M8 22h8"/>',
};

function placeholderImage(label, bgColor) {
  const icon = PLACEHOLDER_ICONS[label];
  const content = icon
    ? `<g transform="translate(140 90) scale(5)" fill="none" stroke="#ffffff" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round">${icon}</g>`
    : `<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="22" fill="#ffffff"
      text-anchor="middle" dominant-baseline="middle">${label}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    ${content}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Genera 3 variantes de color (principal, más clara, más oscura) para la galería.
function placeholderImages(label, baseColor) {
  const clamp = (n) => Math.max(0, Math.min(255, n));
  const hex = (n) => clamp(n).toString(16).padStart(2, "0");
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const lighter = `#${hex(r + 40)}${hex(g + 40)}${hex(b + 40)}`;
  const darker  = `#${hex(r - 30)}${hex(g - 30)}${hex(b - 30)}`;
  return [
    placeholderImage(label, baseColor),
    placeholderImage(label, lighter),
    placeholderImage(label, darker),
  ];
}

function seedData() {
  const now = new Date().toISOString();

  const stores = [
    { id: 1, name: "Tienda Costanera" },
    { id: 2, name: "Tienda Parque Arauco" },
    { id: 3, name: "Tienda Vivo Outlet" },
  ];

  const products = [
    // ── Calzado ──────────────────────────────────────────────────────────
    {
      id: 1, sku: "SKU-001", name: "Zapatillas Urban Runner",
      description: "Zapatillas running livianas con suela de goma antideslizante, ideales para uso diario.",
      price: 45990, listPrice: 57490, stock: 12, category: "Calzado",
      brand: "UrbanStep", isNew: false,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Zapatillas", "#1f4b99"), videoUrl: null,
      categoryPath: ["Inicio", "Calzado"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Zapatillas", "#1f4b99"),
    },
    {
      id: 7, sku: "SKU-007", name: "Zapatillas Trail Pro",
      description: "Zapatillas para terreno irregular, suela Vibram, puntera reforzada y soporte de tobillo.",
      price: 52990, listPrice: 62990, stock: 7, category: "Calzado",
      brand: "TrailPro", isNew: true,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Zapatillas", "#163a80"), videoUrl: null,
      categoryPath: ["Inicio", "Calzado"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Zapatillas", "#163a80"),
    },
    {
      id: 8, sku: "SKU-008", name: "Botas Cuero Classic",
      description: "Botas de cuero genuino con suela de goma. Resistentes al agua, ideales para invierno.",
      price: 69990, listPrice: 99990, stock: 5, category: "Calzado",
      brand: "ClassicLeather", isNew: false,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Botas", "#4a2c0a"), videoUrl: null,
      categoryPath: ["Inicio", "Calzado"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Botas", "#4a2c0a"),
    },
    {
      id: 9, sku: "SKU-009", name: "Sandalias Sport Flex",
      description: "Sandalias deportivas con correa ajustable y plantilla anatomica de EVA.",
      price: 18990, listPrice: 18990, stock: 20, category: "Calzado",
      brand: "FlexSport", isNew: true,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Sandalias", "#1a6b8a"), videoUrl: null,
      categoryPath: ["Inicio", "Calzado"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Sandalias", "#1a6b8a"),
    },
    // ── Ropa ─────────────────────────────────────────────────────────────
    {
      id: 2, sku: "SKU-002", name: "Polera Basica Algodon",
      description: "Polera 100% algodon, corte regular, disponible en multiples colores.",
      price: 8990, listPrice: 8990, stock: 40, category: "Ropa",
      brand: "BasicWear", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Polera", "#2d7a46"), videoUrl: null,
      categoryPath: ["Inicio", "Ropa"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Polera", "#2d7a46"),
    },
    {
      id: 10, sku: "SKU-010", name: "Pantalon Cargo Slim",
      description: "Pantalon cargo con bolsillos laterales, tela ripstop resistente a la abrasion.",
      price: 29990, listPrice: 39990, stock: 15, category: "Ropa",
      brand: "CargoStyle", isNew: true,
      installments: { count: 6, interestFree: true },
      images: placeholderImages("Pantalon", "#3d5a2a"), videoUrl: null,
      categoryPath: ["Inicio", "Ropa"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Pantalon", "#3d5a2a"),
    },
    {
      id: 11, sku: "SKU-011", name: "Chaqueta Cortaviento",
      description: "Chaqueta ligera impermeable, capucha desmontable y bolsillos con cierre.",
      price: 49990, listPrice: 64990, stock: 6, category: "Ropa",
      brand: "WindShield", isNew: false,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Chaqueta", "#1e4d6b"), videoUrl: null,
      categoryPath: ["Inicio", "Ropa"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Chaqueta", "#1e4d6b"),
    },
    {
      id: 12, sku: "SKU-012", name: "Shorts Deportivo Dry-Fit",
      description: "Shorts de secado rapido con bolsillo trasero con cierre, tela transpirable.",
      price: 14990, listPrice: 14990, stock: 22, category: "Ropa",
      brand: "SportFlex", isNew: true,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Shorts", "#7a3a2a"), videoUrl: null,
      categoryPath: ["Inicio", "Ropa"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Shorts", "#7a3a2a"),
    },
    // ── Accesorios ───────────────────────────────────────────────────────
    {
      id: 3, sku: "SKU-003", name: "Mochila Antirrobo 20L",
      description: "Mochila con puerto USB, compartimento acolchado para notebook hasta 15.6 pulgadas.",
      price: 25990, listPrice: 32990, stock: 8, category: "Accesorios",
      brand: "SecureGear", isNew: false,
      installments: { count: 6, interestFree: true },
      images: placeholderImages("Mochila", "#a8621a"), videoUrl: null,
      categoryPath: ["Inicio", "Accesorios"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Mochila", "#a8621a"),
    },
    {
      id: 5, sku: "SKU-005", name: "Jockey Deportivo",
      description: "Jockey ajustable con cierre trasero, tela ripstop resistente al sol.",
      price: 6990, listPrice: 6990, stock: 25, category: "Accesorios",
      brand: "StyleCap", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Jockey", "#b8630a"), videoUrl: null,
      categoryPath: ["Inicio", "Accesorios"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Jockey", "#b8630a"),
    },
    {
      id: 6, sku: "SKU-006", name: "Botella Termica 1L",
      description: "Acero inoxidable 304, doble pared al vacio, mantiene temperatura 12 horas.",
      price: 11990, listPrice: 14990, stock: 3, category: "Accesorios",
      brand: "ThermoKing", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Botella", "#1a7a7a"), videoUrl: null,
      categoryPath: ["Inicio", "Accesorios"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Botella", "#1a7a7a"),
    },
    {
      id: 13, sku: "SKU-013", name: "Billetera RFID Slim",
      description: "Billetera de cuero vegano con bloqueo RFID, capacidad para 8 tarjetas.",
      price: 15990, listPrice: 15990, stock: 18, category: "Accesorios",
      brand: "WalletPro", isNew: true,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Billetera", "#5a3a1a"), videoUrl: null,
      categoryPath: ["Inicio", "Accesorios"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Billetera", "#5a3a1a"),
    },
    // ── Tecnologia ───────────────────────────────────────────────────────
    {
      id: 4, sku: "SKU-004", name: "Audifonos Bluetooth ANC",
      description: "Cancelacion de ruido activa, autonomia de 30 horas, plegables.",
      price: 39990, listPrice: 54990, stock: 0, category: "Tecnologia",
      brand: "SoundMax", isNew: false,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Audifonos", "#5c3d99"), videoUrl: null,
      categoryPath: ["Inicio", "Tecnologia"], warrantyMonths: 24, returnDays: 30,
      imageUrl: placeholderImage("Audifonos", "#5c3d99"),
    },
    {
      id: 14, sku: "SKU-014", name: "Smartwatch Fitness Pro",
      description: "Monitor cardiaco, GPS integrado, resistente al agua IP68, bateria 7 dias.",
      price: 89990, listPrice: 109990, stock: 4, category: "Tecnologia",
      brand: "FitWatch", isNew: true,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Smartwatch", "#2e4a8a"), videoUrl: null,
      categoryPath: ["Inicio", "Tecnologia"], warrantyMonths: 24, returnDays: 30,
      imageUrl: placeholderImage("Smartwatch", "#2e4a8a"),
    },
    {
      id: 15, sku: "SKU-015", name: "Powerbank 20000mAh",
      description: "Carga rapida 22.5W, dos salidas USB-A y una USB-C, indicador LED de carga.",
      price: 24990, listPrice: 24990, stock: 11, category: "Tecnologia",
      brand: "PowerCell", isNew: false,
      installments: { count: 6, interestFree: true },
      images: placeholderImages("Powerbank", "#1a5c3a"), videoUrl: null,
      categoryPath: ["Inicio", "Tecnologia"], warrantyMonths: 24, returnDays: 30,
      imageUrl: placeholderImage("Powerbank", "#1a5c3a"),
    },
    {
      id: 16, sku: "SKU-016", name: "Teclado Mecanico RGB",
      description: "Switch red lineal, iluminacion RGB por tecla, formato TKL sin teclado numerico.",
      price: 79990, listPrice: 114990, stock: 2, category: "Tecnologia",
      brand: "MechKeys", isNew: true,
      installments: { count: 12, interestFree: true },
      images: placeholderImages("Teclado", "#3a1a6a"), videoUrl: null,
      categoryPath: ["Inicio", "Tecnologia"], warrantyMonths: 24, returnDays: 30,
      imageUrl: placeholderImage("Teclado", "#3a1a6a"),
    },
    // ── Deportes ─────────────────────────────────────────────────────────
    {
      id: 17, sku: "SKU-017", name: "Pesa Rusa 16 kg",
      description: "Kettlebell de hierro fundido con mango ancho antideslizante, recubrimiento en polvo.",
      price: 29990, listPrice: 29990, stock: 10, category: "Deportes",
      brand: "IronFit", isNew: false,
      installments: { count: 6, interestFree: true },
      images: placeholderImages("Pesa", "#2a2a2a"), videoUrl: null,
      categoryPath: ["Inicio", "Deportes"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Pesa", "#2a2a2a"),
    },
    {
      id: 18, sku: "SKU-018", name: "Colchoneta Yoga 6mm",
      description: "Mat antideslizante de TPE ecologico, 183x61cm, incluye correa de transporte.",
      price: 12990, listPrice: 15990, stock: 14, category: "Deportes",
      brand: "YogaZen", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Colchoneta", "#4a1a6a"), videoUrl: null,
      categoryPath: ["Inicio", "Deportes"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Colchoneta", "#4a1a6a"),
    },
    {
      id: 19, sku: "SKU-019", name: "Cuerda Saltar Speed Rope",
      description: "Cable de acero forrado en PVC, manijas ergonomicas con rodamientos de bolas.",
      price: 8990, listPrice: 8990, stock: 30, category: "Deportes",
      brand: "SpeedRope", isNew: true,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Cuerda", "#1a4a2a"), videoUrl: null,
      categoryPath: ["Inicio", "Deportes"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Cuerda", "#1a4a2a"),
    },
    {
      id: 20, sku: "SKU-020", name: "Banda Elastica Set x5",
      description: "Set de 5 bandas de resistencia progresiva (5-50 kg), latex natural con bolsa de malla.",
      price: 18990, listPrice: 24990, stock: 9, category: "Deportes",
      brand: "ElasticPro", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Banda", "#6a2a1a"), videoUrl: null,
      categoryPath: ["Inicio", "Deportes"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Banda", "#6a2a1a"),
    },
    // ── Hogar ────────────────────────────────────────────────────────────
    {
      id: 21, sku: "SKU-021", name: "Cojin Decorativo 45x45",
      description: "Cojin reversible de terciopelo lavable, relleno de fibra siliconada antialergica.",
      price: 9990, listPrice: 9990, stock: 16, category: "Hogar",
      brand: "HomeStyle", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Cojin", "#8a3a5a"), videoUrl: null,
      categoryPath: ["Inicio", "Hogar"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Cojin", "#8a3a5a"),
    },
    {
      id: 22, sku: "SKU-022", name: "Vela Aromatica Soja 200g",
      description: "Cera 100% soja, mecha de algodon, aroma lavanda y vainilla, quema 45 horas.",
      price: 7990, listPrice: 9990, stock: 25, category: "Hogar",
      brand: "AromaCraft", isNew: false,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Vela", "#9a7a2a"), videoUrl: null,
      categoryPath: ["Inicio", "Hogar"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Vela", "#9a7a2a"),
    },
    {
      id: 23, sku: "SKU-023", name: "Set Organizadores Bambu",
      description: "Set 4 cajas de bambu apilables para cajones y estantes, tamanos variados.",
      price: 19990, listPrice: 24990, stock: 7, category: "Hogar",
      brand: "BambooOrg", isNew: true,
      installments: { count: 3, interestFree: false },
      images: placeholderImages("Organizador", "#5a7a2a"), videoUrl: null,
      categoryPath: ["Inicio", "Hogar"], warrantyMonths: 12, returnDays: 30,
      imageUrl: placeholderImage("Organizador", "#5a7a2a"),
    },
    {
      id: 24, sku: "SKU-024", name: "Lampara LED Escritorio",
      description: "Lampara de escritorio con brazo articulado, 3 temperaturas de color, cable USB-C.",
      price: 34990, listPrice: 44990, stock: 5, category: "Hogar",
      brand: "LightDesk", isNew: true,
      installments: { count: 6, interestFree: true },
      images: placeholderImages("Lampara", "#2a5a7a"), videoUrl: null,
      categoryPath: ["Inicio", "Hogar"], warrantyMonths: 24, returnDays: 30,
      imageUrl: placeholderImage("Lampara", "#2a5a7a"),
    },
  ];

  // Inventario por tienda: basado en el stock total del producto.
  const storeInventory = products.flatMap(({ id, stock }) => {
    const qtys =
      stock === 0  ? [0, 0, 0] :
      stock >= 20  ? [4, 3, 3] :
      stock >= 10  ? [2, 2, 1] :
      stock >= 5   ? [1, 1, 1] :
                     [1, 0, 1];
    return stores.map((st, i) => ({ productId: id, storeId: st.id, qty: qtys[i] }));
  });

  return {
    users: [
      {
        id: 1,
        email: "cliente@demo.cl",
        // password: Demo1234
        password: bcrypt.hashSync("Demo1234", 8),
        name: "Cliente Demo",
        role: "customer",
        phone: "+56 9 1234 5678",
        rut: "18.420.789-3",
        birthDate: "1992-10-14",
        loyaltyPoints: 1450,
        createdAt: now,
      },
      {
        id: 2,
        email: "admin@demo.cl",
        // password: Admin1234
        password: bcrypt.hashSync("Admin1234", 8),
        name: "Admin Demo",
        role: "admin",
        phone: null,
        rut: null,
        birthDate: null,
        loyaltyPoints: 0,
        createdAt: now,
      },
    ],
    products,
    stores,
    storeInventory,
    coupons: [
      { code: "BIENVENIDO10", discountPercent: 10, minOrderAmount: 0,     expiresAt: "2030-01-01T00:00:00.000Z", active: true  },
      { code: "VERANO20",     discountPercent: 20, minOrderAmount: 30000, expiresAt: "2030-01-01T00:00:00.000Z", active: true  },
      { code: "EXPIRADO",     discountPercent: 50, minOrderAmount: 0,     expiresAt: "2020-01-01T00:00:00.000Z", active: true  },
      { code: "INACTIVO",     discountPercent: 15, minOrderAmount: 0,     expiresAt: "2030-01-01T00:00:00.000Z", active: false },
    ],
    carts:     {}, // { [userId]: [{ productId, quantity }] }
    orders:    [],
    reviews:   [], // { id, productId, userId, userName, rating, comment, createdAt }
    wishlists: {}, // { [userId]: [productId, ...] }
    addresses: {}, // { [userId]: [{ id, label, street, city, region, isDefault }] }
    nextIds: { user: 3, order: 1, review: 1, address: 1 },
  };
}

let state;

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return;
    } catch (e) {
      console.warn("data.json corrupto, regenerando seed...", e.message);
    }
  }
  state = seedData();
  persist();
}

// -----------------------------------------------------------------------
// Unit of Work minimo: dentro de runInTransaction(), persist() no escribe
// a disco en cada llamada, solo marca que hay cambios pendientes; la
// escritura real ocurre una sola vez, al salir de la transaccion mas
// externa. Si la funcion envuelta lanza, no se escribe nada (no hay
// rollback del estado en memoria, pero tampoco se persiste un estado a
// medio mutar). Los repositories no cambian: siguen llamando persist()
// como si nada, es persist() la que decide cuando escribir de verdad.
// -----------------------------------------------------------------------
let transactionDepth = 0;
let pendingWrite = false;

function writeToDisk() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function persist() {
  if (transactionDepth > 0) {
    pendingWrite = true;
    return;
  }
  writeToDisk();
}

function runInTransaction(fn) {
  transactionDepth++;
  let result;
  try {
    result = fn();
  } catch (err) {
    transactionDepth--;
    pendingWrite = false;
    throw err;
  }
  transactionDepth--;
  if (transactionDepth === 0 && pendingWrite) {
    pendingWrite = false;
    writeToDisk();
  }
  return result;
}

function reset() {
  state = seedData();
  persist();
  return state;
}

function getState() {
  return state;
}

load();

module.exports = { getState, persist, reset, runInTransaction, DATA_FILE };
