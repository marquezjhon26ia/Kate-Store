// ============================================================
// KATE STORE — Maicao, La Guajira
// Datos iniciales del catálogo, pedidos, analítica, FAQ y legal
// ============================================================

const STORE_CONFIG = {
  name: "Kate Store",
  tagline: "Moda Femenina • Maicao, La Guajira",
  address: "Calle 12 # 10-45, Local 104, Zona Comercial Centro, Maicao, La Guajira",
  phoneDisplay: "+57 315 842 9104",
  phoneRaw: "573158429104",
  email: "hola@katestoremaicao.co",
  supportEmail: "soporte@katestoremaicao.co",
  instagram: "@katestore.maicao",
  schedule: "Lun – Sáb: 9:00 a.m. – 7:00 p.m. | Dom: 10:00 a.m. – 2:00 p.m.",
  ivaRate: 0.19,
  freeShippingThreshold: 220000,
  gaMeasurementId: "G-KATESTORE26MC",
  shippingOptions: [
    {
      id: "tienda",
      name: "Recoger en tienda (Maicao Centro)",
      eta: "Listo en 2 horas",
      cost: 0,
      description: "Calle 12 # 10-45, Local 104"
    },
    {
      id: "estandar",
      name: "Envío Estándar Maicao y La Guajira",
      eta: "1 a 2 días hábiles",
      cost: 8000,
      description: "Gratis en compras desde $220.000 COP"
    },
    {
      id: "expres",
      name: "Envío Exprés Hoy Mismo (Maicao)",
      eta: "Entrega en 2 – 4 horas",
      cost: 15000,
      description: "Mensajero motorizado con seguimiento por WhatsApp"
    },
    {
      id: "nacional",
      name: "Envío Nacional (Colombia)",
      eta: "3 a 5 días hábiles",
      cost: 22000,
      description: "Coordinadora / Interrapidísimo asegurado"
    }
  ]
};

const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    sku: "KATE-VES-001",
    name: "Vestido Midi Brisa de Lino",
    category: "Vestidos",
    price: 165000,
    originalPrice: 195000,
    featured: true,
    badge: "Más vendido",
    stock: 14,
    views: 342,
    image: "https://kyyydvrngcqlcpsyqfud.supabase.co/storage/v1/object/public/product-images/vestido-brisa.jpg",
    angles: [
      { label: "Vista frontal", pos: "50% 25%", scale: 1 },
      { label: "Detalle superior", pos: "50% 15%", scale: 1.55 },
      { label: "Caída de falda", pos: "50% 80%", scale: 1.45 }
    ],
    colors: [
      { name: "Marfil", hex: "#F3EDE2" },
      { name: "Arena", hex: "#D8C3A5" },
      { name: "Terracota", hex: "#C4633E" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "Confeccionado en lino natural fresco ideal para el clima cálido de Maicao. Su corte midi con tirantes anudables y cintura entallada estiliza la silueta sin sacrificar comodidad, perfecto para eventos de día o salidas al atardecer.",
    specs: {
      material: "100% Lino europeo transpirable con forro en algodón orgánico",
      medidas: "Largo total: 118 cm (talla M) • Cintura elástica posterior",
      peso: "310 g",
      cuidados: "Lavar a mano con agua fría, planchar a temperatura baja al revés",
      origen: "Diseño colombiano • Colección Caribe"
    }
  },
  {
    id: "prod-2",
    sku: "KATE-CON-002",
    name: "Conjunto Cabo de la Vela Terracota",
    category: "Conjuntos",
    price: 189000,
    originalPrice: null,
    featured: true,
    badge: "Nuevo",
    stock: 9,
    views: 289,
    image: "https://kyyydvrngcqlcpsyqfud.supabase.co/storage/v1/object/public/product-images/conjunto-cabo.jpg",
    angles: [
      { label: "Conjunto completo", pos: "50% 30%", scale: 1 },
      { label: "Detalle top", pos: "50% 18%", scale: 1.6 },
      { label: "Pantalón palazzo", pos: "50% 78%", scale: 1.5 }
    ],
    colors: [
      { name: "Terracota", hex: "#C4633E" },
      { name: "Oliva", hex: "#5C6B50" },
      { name: "Negro", hex: "#231F20" }
    ],
    sizes: ["S", "M", "L"],
    description:
      "Set de dos piezas inspirado en los atardeceres guajiros. Incluye crop top estructurado de escote limpio y pantalón palazzo de tiro alto con caída fluida que alarga visualmente las piernas.",
    specs: {
      material: "70% Lino, 30% Viscosa fresca antiarrugas",
      medidas: "Top: 40 cm • Pantalón tiro alto: 106 cm de largo",
      peso: "440 g",
      cuidados: "Ciclo delicado en agua fría, secar a la sombra",
      origen: "Hecho en Colombia"
    }
  },
  {
    id: "prod-3",
    sku: "KATE-BLU-003",
    name: "Blusa Palma Bordada Artesanal",
    category: "Blusas",
    price: 98000,
    originalPrice: 120000,
    featured: true,
    badge: "Oferta",
    stock: 18,
    views: 256,
    image: "https://kyyydvrngcqlcpsyqfud.supabase.co/storage/v1/object/public/product-images/blusa-palma.jpg",
    angles: [
      { label: "Vista principal", pos: "50% 25%", scale: 1 },
      { label: "Detalle bordado", pos: "50% 30%", scale: 1.7 },
      { label: "Mangas globo", pos: "25% 32%", scale: 1.6 }
    ],
    colors: [
      { name: "Blanco Puro", hex: "#FFFFFF" },
      { name: "Crema", hex: "#F5E9D3" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "Blusa romántica en popelina de algodón premium con mangas ligeramente abullonadas y delicado bordado tono a tono. Fresca, versátil y fácil de combinar tanto con jeans como con faldas satinadas.",
    specs: {
      material: "100% Algodón popelina peinado",
      medidas: "Largo: 56 cm • Manga 3/4 con puño elástico suave",
      peso: "210 g",
      cuidados: "Lavar en agua fría, no usar blanqueador",
      origen: "Confección nacional"
    }
  },
  {
    id: "prod-4",
    sku: "KATE-VES-004",
    name: "Vestido Maxi Atardecer Satinado",
    category: "Vestidos",
    price: 215000,
    originalPrice: 249000,
    featured: true,
    badge: "Oferta",
    stock: 7,
    views: 318,
    image: "https://kyyydvrngcqlcpsyqfud.supabase.co/storage/v1/object/public/product-images/vestido-atardecer.jpg",
    angles: [
      { label: "Vista completa", pos: "50% 25%", scale: 1 },
      { label: "Escote cruzado", pos: "50% 20%", scale: 1.65 },
      { label: "Brillo del satín", pos: "50% 65%", scale: 1.5 }
    ],
    colors: [
      { name: "Coral", hex: "#E06A4B" },
      { name: "Vino", hex: "#722F37" },
      { name: "Dorado Arena", hex: "#C99B58" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description:
      "Elegancia sin esfuerzo para grados, bodas y cenas especiales. Su diseño cruzado tipo wrap en satín ligero envuelve la figura con un movimiento hipnótico y un escote en V favorecedor.",
    specs: {
      material: "Satín seda fría (95% Poliéster sedoso, 5% Elastano)",
      medidas: "Largo maxi: 142 cm • Cinturón integrado ajustable",
      peso: "360 g",
      cuidados: "Lavar a mano o limpieza en seco, vaporizar para planchar",
      origen: "Colección Exclusiva Kate Store"
    }
  },
  {
    id: "prod-5",
    sku: "KATE-FAL-005",
    name: "Falda Midi Plisada Arena",
    category: "Faldas",
    price: 112000,
    originalPrice: null,
    featured: false,
    badge: "Nuevo",
    stock: 12,
    views: 174,
    image: "https://kyyydvrngcqlcpsyqfud.supabase.co/storage/v1/object/public/product-images/falda-arena.jpg",
    angles: [
      { label: "Vista frontal", pos: "50% 45%", scale: 1 },
      { label: "Detalle pretina", pos: "50% 35%", scale: 1.6 },
      { label: "Textura plisada", pos: "50% 70%", scale: 1.7 }
    ],
    colors: [
      { name: "Champagne", hex: "#DFC9B1" },
      { name: "Negro", hex: "#231F20" },
      { name: "Verde Palma", hex: "#4B5D44" }
    ],
    sizes: ["XS", "S", "M", "L"],
    description:
      "Falda midi de plisado fino con caída etérea en tono champagne arena. Su pretina oculta ofrece ajuste perfecto para lucir impecable desde la oficina hasta un cóctel nocturno.",
    specs: {
      material: "Crepé satinado plisado de alta retención",
      medidas: "Largo: 78 cm • Cintura con cierre lateral invisible",
      peso: "280 g",
      cuidados: "Lavar en bolsa delicada, colgar para mantener el plisado",
      origen: "Hecho en Colombia"
    }
  },
  {
    id: "prod-6",
    sku: "KATE-ACC-006",
    name: "Bolso Tejido Guajira Edición Sol",
    category: "Accesorios",
    price: 135000,
    originalPrice: null,
    featured: false,
    badge: "Artesanal",
    stock: 6,
    views: 215,
    image: "https://kyyydvrngcqlcpsyqfud.supabase.co/storage/v1/object/public/product-images/bolso-guajira.jpg",
    angles: [
      { label: "Vista estudio", pos: "50% 50%", scale: 1 },
      { label: "Detalle tejido", pos: "50% 58%", scale: 1.7 },
      { label: "Asas y herrajes", pos: "50% 25%", scale: 1.6 }
    ],
    colors: [
      { name: "Natural / Terracota", hex: "#C89F78" },
      { name: "Natural / Negro", hex: "#4A413B" }
    ],
    sizes: ["Única"],
    description:
      "Pieza artesanal tejida a mano en colaboración con maestras tejedoras de La Guajira. Combina fibras naturales en tono arena con patrones geométricos terracota, asas en cuero vegano y herrajes dorados.",
    specs: {
      material: "Fibra natural tejida a mano, forro interno de lino y asas en cuero sintético premium",
      medidas: "34 cm ancho × 28 cm alto × 14 cm profundidad",
      peso: "420 g",
      cuidados: "Limpiar con paño húmedo suave, guardar en bolsa protectora",
      origen: "Artesanía de La Guajira, Colombia"
    }
  }
];

const INITIAL_ORDERS = [
  {
    id: "KATE-2026-1041",
    date: "2026-11-20 15:24",
    customer: {
      name: "Valentina Ospina Mejía",
      email: "valentina.ospina@correo.co",
      phone: "312 456 7890",
      city: "Maicao, La Guajira",
      address: "Calle 14 # 8-22, Barrio El Carmen"
    },
    items: [
      { name: "Vestido Midi Brisa de Lino", size: "M", color: "Marfil", qty: 1, price: 165000 },
      { name: "Bolso Tejido Guajira Edición Sol", size: "Única", color: "Natural / Terracota", qty: 1, price: 135000 }
    ],
    shippingMethod: "Envío Exprés Hoy Mismo (Maicao)",
    shippingCost: 15000,
    paymentMethod: "Nequi / Daviplata",
    subtotal: 300000,
    tax: 57000,
    total: 315000,
    status: "Entregado"
  },
  {
    id: "KATE-2026-1042",
    date: "2026-11-21 11:08",
    customer: {
      name: "Camila Iguarán Brito",
      email: "camila.iguaran@gmail.com",
      phone: "300 789 2341",
      city: "Riohacha, La Guajira",
      address: "Carrera 7 # 15-40, Barrio Centro"
    },
    items: [
      { name: "Conjunto Cabo de la Vela Terracota", size: "S", color: "Terracota", qty: 1, price: 189000 }
    ],
    shippingMethod: "Envío Estándar Maicao y La Guajira",
    shippingCost: 8000,
    paymentMethod: "Tarjeta de Crédito / Débito",
    subtotal: 189000,
    tax: 35910,
    total: 197000,
    status: "Enviado"
  },
  {
    id: "KATE-2026-1043",
    date: "2026-11-22 10:15",
    customer: {
      name: "Daniela Pushaina Torres",
      email: "daniela.p@hotmail.com",
      phone: "318 654 1122",
      city: "Maicao, La Guajira",
      address: "Calle 11 # 16-09, Barrio San José"
    },
    items: [
      { name: "Vestido Maxi Atardecer Satinado", size: "M", color: "Coral", qty: 1, price: 215000 },
      { name: "Blusa Palma Bordada Artesanal", size: "M", color: "Blanco Puro", qty: 1, price: 98000 }
    ],
    shippingMethod: "Recoger en tienda (Maicao Centro)",
    shippingCost: 0,
    paymentMethod: "Pago Contra Entrega (Efectivo)",
    subtotal: 313000,
    tax: 59470,
    total: 313000,
    status: "Pendiente"
  }
];

const INITIAL_ANALYTICS = {
  visitors: 1284,
  dailyVisitors: [
    { day: "Lun", count: 148 },
    { day: "Mar", count: 172 },
    { day: "Mié", count: 165 },
    { day: "Jue", count: 194 },
    { day: "Vie", count: 228 },
    { day: "Sáb", count: 245 },
    { day: "Hoy", count: 132 }
  ],
  completedPurchasesBase: 41
};

const FAQ_ITEMS = [
  {
    q: "¿Cuánto tarda el envío en Maicao y otros municipios de La Guajira?",
    a: "En Maicao ofrecemos entrega Exprés el mismo día (2 a 4 horas) si realizas tu pedido antes de las 4:00 p.m., o envío estándar en 1 a 2 días hábiles. A Riohacha, Uribia, Fonseca y Albania el tiempo estimado es de 1 a 2 días hábiles, y al resto de Colombia de 3 a 5 días hábiles."
  },
  {
    q: "¿Puedo recoger mi pedido directamente en la tienda física?",
    a: "¡Claro que sí! Selecciona 'Recoger en tienda (Maicao Centro)' al finalizar tu compra sin costo adicional. Te notificaremos por WhatsApp y correo apenas tu paquete esté listo (aproximadamente en 2 horas) en Calle 12 # 10-45, Local 104."
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex), transferencias por Nequi y Daviplata, PSE / Bancolombia, PayPal para compras internacionales y pago contra entrega en efectivo únicamente dentro del área urbana de Maicao."
  },
  {
    q: "¿Cómo funcionan los cambios de talla y devoluciones?",
    a: "Tienes hasta 15 días calendario desde la entrega para solicitar cambio de talla o prenda, siempre que conserve sus etiquetas originales y no presente señales de uso. Si prefieres derecho de retracto, aplican 5 días hábiles conforme al Estatuto del Consumidor colombiano."
  },
  {
    q: "¿Cómo elijo mi talla correcta si compro en línea?",
    a: "Cada producto incluye medidas y detalles de ajuste en su ficha técnica. Además, puedes escribirnos por el botón flotante de WhatsApp (+57 315 842 9104) con tus medidas de busto y cintura y nuestra asesora en Maicao te recomendará la talla ideal."
  },
  {
    q: "¿Las prendas tienen garantía?",
    a: "Sí, todas nuestras prendas cuentan con 30 días de garantía por defectos de confección, costuras o cierres. Los bolsos artesanales de La Guajira incluyen 60 días de garantía por defectos en herrajes o uniones."
  }
];

const LEGAL_DOCS = {
  privacidad: {
    title: "Política de Privacidad y Tratamiento de Datos",
    body: `
      <p><strong>Kate Store S.A.S.</strong>, ubicada en Maicao, La Guajira, garantiza la protección de tus datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia.</p>
      <h4>1. Finalidad de la recolección</h4>
      <p>Los datos suministrados (nombre, correo electrónico, teléfono y dirección de envío) se utilizan exclusivamente para procesar pedidos, coordinar entregas, emitir facturación electrónica y brindar soporte postventa.</p>
      <h4>2. Seguridad de la información</h4>
      <p>No almacenamos números completos ni códigos CVV de tarjetas de crédito/débito. Todas las transacciones se procesan bajo protocolos cifrados SSL/TLS.</p>
      <h4>3. Derechos del titular</h4>
      <p>Puedes conocer, actualizar, rectificar o suprimir tus datos en cualquier momento escribiendo a <strong>soporte@katestoremaicao.co</strong> o comunicándote al <strong>+57 315 842 9104</strong>.</p>
    `
  },
  terminos: {
    title: "Términos y Condiciones de Uso y Compra",
    body: `
      <p>Al navegar y comprar en la tienda en línea de <strong>Kate Store</strong> aceptas los siguientes términos comerciales:</p>
      <h4>1. Precios y disponibilidad</h4>
      <p>Todos los precios están expresados en Pesos Colombianos (COP) e incluyen el IVA vigente (19%) discriminado en el resumen de compra. El inventario se actualiza en tiempo real.</p>
      <h4>2. Envíos y entregas</h4>
      <p>Los tiempos de entrega empiezan a contar una vez confirmado el pago. En envíos contra entrega en Maicao, nuestro mensajero confirmará disponibilidad telefónica antes del despacho.</p>
      <h4>3. Propiedad intelectual</h4>
      <p>Las fotografías, descripciones, diseños y marca Kate Store son propiedad exclusiva del establecimiento y no pueden ser reproducidos con fines comerciales sin autorización.</p>
    `
  },
  devoluciones: {
    title: "Política de Cambios, Garantías y Devoluciones",
    body: `
      <p>Queremos que ames cada prenda de Kate Store. Si necesitas realizar un cambio o devolución, ten en cuenta estas condiciones:</p>
      <h4>1. Cambios por talla o preferencia</h4>
      <p>Dispones de <strong>15 días calendario</strong> desde la recepción del pedido. La prenda debe estar sin uso, sin lavar y con todas sus etiquetas originales. En Maicao puedes hacer el cambio sin costo en nuestra tienda física.</p>
      <h4>2. Derecho de retracto</h4>
      <p>De acuerdo con el artículo 47 de la Ley 1480 de 2011, puedes solicitar la devolución total de tu dinero dentro de los <strong>5 días hábiles</strong> siguientes a la entrega.</p>
      <h4>3. Garantía de calidad</h4>
      <p>Todas las prendas cuentan con 30 días de garantía por defectos de fabricación o costuras. Para iniciar un trámite, contáctanos vía WhatsApp al <strong>+57 315 842 9104</strong> con tu número de pedido.</p>
    `
  }
};
