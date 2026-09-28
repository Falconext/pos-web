export interface DemoProduct {
  id: number;
  descripcion: string;
  precioUnitario: number;
  precioOriginal?: number;
  imagenUrl: string;
  stock: number;
  categoria: { nombre: string };
  marca: { nombre: string };
  precioOferta?: number;
  /** Opcional: fin real de la oferta (para plantillas con reloj). */
  fechaFinOferta?: string;
  destacado?: boolean;
  /** Opcional: tallas/colores reales para plantillas de moda y calzado. */
  opcionesAtributos?: { nombre: string; valores: string[] }[];
  variantes?: any[];
}

export interface RubroDemo {
  storeName: string;
  slogan: string;
  heroKeyword: string;
  heroDesc: string;
  categories: string[];
  products: DemoProduct[];
  plantillaDefault: string;
  colorDefault: string;
}

const img = (w: number, h: number, bg: string, fg: string, text: string) =>
  `https://placehold.co/${w}x${h}/${bg.replace('#', '')}/${fg.replace('#', '')}?text=${encodeURIComponent(text)}`;

// ─── Ferretería / Materiales ──────────────────────────────────────────────────
const ferreteriaDemo: RubroDemo = {
  storeName: 'Ferretería El Maestro',
  slogan: 'Todo para tu construcción',
  heroKeyword: 'Las Mejores Herramientas',
  heroDesc: 'Herramientas profesionales, materiales de calidad y todo lo que necesitas para tu obra o proyecto. Entrega rápida a todo el país.',
  categories: ['Todos', 'Herramientas', 'Pinturas', 'Electricidad', 'Plomería', 'Tornillería'],
  plantillaDefault: 'construccion',
  colorDefault: '#E65100',
  products: [
    { id: 1, descripcion: 'Taladro Percutor 800W Bosch', precioUnitario: 289.90, precioOriginal: 350.00, imagenUrl: img(400,400,'FFF3E0','E65100','Taladro'), stock: 8, categoria: { nombre: 'Herramientas' }, marca: { nombre: 'Bosch' } },
    { id: 2, descripcion: 'Pintura Látex Interior 4L Blanco', precioUnitario: 45.00, precioOriginal: 0, imagenUrl: img(400,400,'F3F4F6','374151','Pintura'), stock: 30, categoria: { nombre: 'Pinturas' }, marca: { nombre: 'Vencedor' } },
    { id: 3, descripcion: 'Cemento Sol Rojo 42.5kg', precioUnitario: 28.50, precioOriginal: 0, imagenUrl: img(400,400,'FEF2F2','DC2626','Cemento'), stock: 50, categoria: { nombre: 'Construcción' }, marca: { nombre: 'Sol' } },
    { id: 4, descripcion: 'Amoladora 4.5" Stanley 900W', precioUnitario: 159.90, precioOriginal: 199.90, imagenUrl: img(400,400,'EFF6FF','1D4ED8','Amoladora'), stock: 5, categoria: { nombre: 'Herramientas' }, marca: { nombre: 'Stanley' } },
    { id: 5, descripcion: 'Cable THW 2.5mm x 100m Rojo', precioUnitario: 89.00, precioOriginal: 0, imagenUrl: img(400,400,'FEF2F2','B91C1C','Cable'), stock: 15, categoria: { nombre: 'Electricidad' }, marca: { nombre: 'Indeco' } },
    { id: 6, descripcion: 'Tubo PVC 4" x 3m Desagüe', precioUnitario: 18.90, precioOriginal: 0, imagenUrl: img(400,400,'F0FDF4','15803D','Tubo PVC'), stock: 40, categoria: { nombre: 'Plomería' }, marca: { nombre: 'Nicoll' } },
    { id: 7, descripcion: 'Caja de Tornillos 3x20mm (200u)', precioUnitario: 12.50, precioOriginal: 0, imagenUrl: img(400,400,'FAFAF9','57534E','Tornillos'), stock: 100, categoria: { nombre: 'Tornillería' }, marca: { nombre: 'Genérico' } },
    { id: 8, descripcion: 'Sierra Circular 7.25" 1400W', precioUnitario: 349.00, precioOriginal: 420.00, imagenUrl: img(400,400,'FFFBEB','B45309','Sierra'), stock: 3, categoria: { nombre: 'Herramientas' }, marca: { nombre: 'Makita' } },
  ],
};

// ─── Bodega / Abarrotes / Supermercado ───────────────────────────────────────
const bodegaDemo: RubroDemo = {
  storeName: 'Bodega Don José',
  slogan: 'Los mejores precios del barrio',
  heroKeyword: 'Los Mejores Precios',
  heroDesc: 'Abarrotes, bebidas, lácteos y limpieza al mejor precio del barrio. Compra por delivery o recoge en tienda.',
  categories: ['Todos', 'Abarrotes', 'Bebidas', 'Lácteos', 'Snacks', 'Limpieza'],
  plantillaDefault: 'mercado',
  colorDefault: '#16A34A',
  products: [
    { id: 1, descripcion: 'Arroz Costeño Extra 5kg', precioUnitario: 18.50, precioOriginal: 22.00, imagenUrl: img(400,400,'FEF9C3','854D0E','Arroz'), stock: 80, categoria: { nombre: 'Abarrotes' }, marca: { nombre: 'Costeño' } },
    { id: 2, descripcion: 'Aceite Vegetal Capri 1L', precioUnitario: 8.90, precioOriginal: 0, imagenUrl: img(400,400,'FFF9C4','D97706','Aceite'), stock: 60, categoria: { nombre: 'Abarrotes' }, marca: { nombre: 'Capri' } },
    { id: 3, descripcion: 'Leche Gloria Entera 400g', precioUnitario: 4.20, precioOriginal: 0, imagenUrl: img(400,400,'EFF6FF','1E40AF','Leche'), stock: 100, categoria: { nombre: 'Lácteos' }, marca: { nombre: 'Gloria' } },
    { id: 4, descripcion: 'Inca Kola 2.5L', precioUnitario: 9.50, precioOriginal: 11.00, imagenUrl: img(400,400,'FEFCE8','CA8A04','Inca Kola'), stock: 45, categoria: { nombre: 'Bebidas' }, marca: { nombre: 'Inca Kola' } },
    { id: 5, descripcion: 'Detergente Ariel 4kg', precioUnitario: 32.00, precioOriginal: 38.00, imagenUrl: img(400,400,'EDE9FE','6D28D9','Ariel'), stock: 25, categoria: { nombre: 'Limpieza' }, marca: { nombre: 'Ariel' } },
    { id: 6, descripcion: 'Fideos Don Vittorio 500g', precioUnitario: 3.20, precioOriginal: 0, imagenUrl: img(400,400,'FFF7ED','C2410C','Fideos'), stock: 120, categoria: { nombre: 'Abarrotes' }, marca: { nombre: 'Don Vittorio' } },
    { id: 7, descripcion: 'Galletas Oreo 432g', precioUnitario: 12.90, precioOriginal: 0, imagenUrl: img(400,400,'1C1917','FAFAF9','Oreo'), stock: 40, categoria: { nombre: 'Snacks' }, marca: { nombre: 'Oreo' } },
    { id: 8, descripcion: 'Azúcar Rubia 1kg', precioUnitario: 3.80, precioOriginal: 0, imagenUrl: img(400,400,'FEF3C7','92400E','Azucar'), stock: 200, categoria: { nombre: 'Abarrotes' }, marca: { nombre: 'Cartavio' } },
  ],
};

// ─── Farmacia / Botica ────────────────────────────────────────────────────────
const farmaciaDemo: RubroDemo = {
  storeName: 'Botica San Martín',
  slogan: 'Tu salud, nuestra prioridad',
  heroKeyword: 'Tu Mejor Salud',
  heroDesc: 'Medicamentos, vitaminas y productos de cuidado personal. Atención farmacéutica de confianza con entrega a domicilio.',
  categories: ['Todos', 'Analgésicos', 'Vitaminas', 'Cuidado Personal', 'Primeros Auxilios', 'Pediátrico'],
  plantillaDefault: 'salud',
  colorDefault: '#0EA5E9',
  products: [
    { id: 1, descripcion: 'Paracetamol 500mg x 100 tab', precioUnitario: 8.50, precioOriginal: 0, imagenUrl: img(400,400,'EFF6FF','1D4ED8','Paracetamol'), stock: 200, categoria: { nombre: 'Analgésicos' }, marca: { nombre: 'Genfar' } },
    { id: 2, descripcion: 'Vitamina C 1000mg x 30 tab', precioUnitario: 18.90, precioOriginal: 24.00, imagenUrl: img(400,400,'FEF9C3','D97706','Vit. C'), stock: 50, categoria: { nombre: 'Vitaminas' }, marca: { nombre: 'Bayer' } },
    { id: 3, descripcion: 'Alcohol 70° x 250ml', precioUnitario: 4.50, precioOriginal: 0, imagenUrl: img(400,400,'F0FDF4','15803D','Alcohol'), stock: 80, categoria: { nombre: 'Primeros Auxilios' }, marca: { nombre: 'Farvet' } },
    { id: 4, descripcion: 'Omeprazol 20mg x 30 cáp', precioUnitario: 12.00, precioOriginal: 0, imagenUrl: img(400,400,'F3F4F6','374151','Omeprazol'), stock: 60, categoria: { nombre: 'Analgésicos' }, marca: { nombre: 'Genfar' } },
    { id: 5, descripcion: 'Shampoo Head & Shoulders 400ml', precioUnitario: 22.90, precioOriginal: 27.00, imagenUrl: img(400,400,'E0F2FE','0369A1','H&S'), stock: 30, categoria: { nombre: 'Cuidado Personal' }, marca: { nombre: 'H&S' } },
    { id: 6, descripcion: 'Pañales Huggies T3 x 40u', precioUnitario: 39.90, precioOriginal: 45.00, imagenUrl: img(400,400,'FDF2F8','9D174D','Huggies'), stock: 25, categoria: { nombre: 'Pediátrico' }, marca: { nombre: 'Huggies' } },
    { id: 7, descripcion: 'Ibuprofeno 400mg x 20 tab', precioUnitario: 6.00, precioOriginal: 0, imagenUrl: img(400,400,'F5F3FF','6D28D9','Ibuprofeno'), stock: 150, categoria: { nombre: 'Analgésicos' }, marca: { nombre: 'Roemmers' } },
    { id: 8, descripcion: 'Termómetro Digital Infrarojo', precioUnitario: 45.00, precioOriginal: 60.00, imagenUrl: img(400,400,'FEF2F2','DC2626','Termometro'), stock: 10, categoria: { nombre: 'Primeros Auxilios' }, marca: { nombre: 'Omron' } },
  ],
};

// ─── Restaurante / Cafetería ──────────────────────────────────────────────────
const restauranteDemo: RubroDemo = {
  storeName: 'Restaurante La Sazón',
  slogan: 'Sabor casero a tu puerta',
  heroKeyword: 'La Mejor Sazón',
  heroDesc: 'Platos tradicionales peruanos preparados al momento. Pedidos por delivery con llegada en menos de 45 minutos.',
  categories: ['Todos', 'Platos del Día', 'Entradas', 'Bebidas', 'Postres', 'Combos'],
  plantillaDefault: 'menu',
  colorDefault: '#EA580C',
  products: [
    { id: 1, descripcion: 'Lomo Saltado con Arroz', precioUnitario: 22.00, precioOriginal: 0, imagenUrl: img(400,300,'FFF7ED','C2410C','Lomo+Saltado'), stock: 20, categoria: { nombre: 'Platos del Día' }, marca: { nombre: 'La Sazón' } },
    { id: 2, descripcion: 'Ceviche Mixto (1 persona)', precioUnitario: 28.00, precioOriginal: 35.00, imagenUrl: img(400,300,'ECFDF5','065F46','Ceviche'), stock: 15, categoria: { nombre: 'Entradas' }, marca: { nombre: 'La Sazón' } },
    { id: 3, descripcion: 'Pollo a la Brasa 1/4', precioUnitario: 18.00, precioOriginal: 0, imagenUrl: img(400,300,'FFFBEB','92400E','Pollo Brasa'), stock: 25, categoria: { nombre: 'Platos del Día' }, marca: { nombre: 'La Sazón' } },
    { id: 4, descripcion: 'Ají de Gallina con Arroz', precioUnitario: 20.00, precioOriginal: 0, imagenUrl: img(400,300,'FEF9C3','854D0E','Aji Gallina'), stock: 18, categoria: { nombre: 'Platos del Día' }, marca: { nombre: 'La Sazón' } },
    { id: 5, descripcion: 'Chicha Morada 1L', precioUnitario: 8.00, precioOriginal: 0, imagenUrl: img(400,300,'F5F3FF','4C1D95','Chicha'), stock: 40, categoria: { nombre: 'Bebidas' }, marca: { nombre: 'La Sazón' } },
    { id: 6, descripcion: 'Suspiro Limeño', precioUnitario: 10.00, precioOriginal: 0, imagenUrl: img(400,300,'FDF2F8','9D174D','Suspiro'), stock: 12, categoria: { nombre: 'Postres' }, marca: { nombre: 'La Sazón' } },
    { id: 7, descripcion: 'Combo Familiar Brasa', precioUnitario: 65.00, precioOriginal: 80.00, imagenUrl: img(400,300,'FEF3C7','D97706','Combo Fam.'), stock: 10, categoria: { nombre: 'Combos' }, marca: { nombre: 'La Sazón' } },
    { id: 8, descripcion: 'Sopa Criolla', precioUnitario: 14.00, precioOriginal: 0, imagenUrl: img(400,300,'FFF7ED','EA580C','Sopa Criolla'), stock: 20, categoria: { nombre: 'Platos del Día' }, marca: { nombre: 'La Sazón' } },
  ],
};

// ─── Ropa / Moda / Boutique ───────────────────────────────────────────────────
const uw = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=1000&q=80`;
/** Tallas S–XL (y color opcional) con stock variable, para que las fichas muestren variantes reales. */
const ropaVariants = (id: number, price: number, colors: string[] = [], out: string[] = []) => {
  const sizes = ['S', 'M', 'L', 'XL'];
  const combos = colors.length ? colors.flatMap((c) => sizes.map((t) => ({ Color: c, Talla: t }))) : sizes.map((t) => ({ Talla: t }));
  return {
    opcionesAtributos: [...(colors.length ? [{ nombre: 'Color', valores: colors }] : []), { nombre: 'Talla', valores: sizes }],
    variantes: combos.map((v, i) => ({ id: id * 100 + i, precioUnitario: price, stock: out.includes(v.Talla) ? 0 : 2 + ((i * 5) % 7), valoresAtributos: v })),
  };
};
const ropaDemo: RubroDemo = {
  storeName: 'KREZKA',
  slogan: 'Moda que te define',
  heroKeyword: 'La Mejor Moda',
  heroDesc: 'Las últimas tendencias en ropa y accesorios. Colecciones exclusivas para cada estilo.',
  categories: ['Todos', 'Casacas', 'Camisas', 'Polos', 'Pantalones', 'Accesorios'],
  plantillaDefault: 'elegante',
  colorDefault: '#7C3AED',
  products: [
    { id: 1, descripcion: 'Camisa Oxford de algodón', precioUnitario: 139.00, imagenUrl: uw('1596755094514-f87e34085b2c'), stock: 20, categoria: { nombre: 'Camisas' }, marca: { nombre: 'Atelier' }, ...ropaVariants(1, 139, [], ['XL']) },
    { id: 2, descripcion: 'Polo oversize negro', precioUnitario: 69.90, imagenUrl: uw('1618354691373-d851c5c3a990'), stock: 30, categoria: { nombre: 'Polos' }, marca: { nombre: 'Street Co' }, ...ropaVariants(2, 69.9) },
    { id: 3, descripcion: 'Casaca bomber terracota', precioUnitario: 259.00, precioOferta: 219.00, imagenUrl: uw('1591047139829-d91aecb6caea'), stock: 8, categoria: { nombre: 'Casacas' }, marca: { nombre: 'Atelier' }, ...ropaVariants(3, 219) },
    { id: 4, descripcion: 'Polo estampado Original', precioUnitario: 79.90, imagenUrl: uw('1576566588028-4147f3842f27'), stock: 25, categoria: { nombre: 'Polos' }, marca: { nombre: 'Street Co' }, ...ropaVariants(4, 79.9, [], ['S']) },
    { id: 5, descripcion: 'Casaca de cuero clásica', precioUnitario: 489.00, imagenUrl: uw('1551028719-00167b16eac5'), stock: 5, categoria: { nombre: 'Casacas' }, marca: { nombre: 'Atelier' }, ...ropaVariants(5, 489) },
    { id: 6, descripcion: 'Jean negro slim', precioUnitario: 159.00, imagenUrl: uw('1542272604-787c3835535d'), stock: 18, categoria: { nombre: 'Pantalones' }, marca: { nombre: 'Denim Lab' }, ...ropaVariants(6, 159) },
    { id: 7, descripcion: 'Camisa denim lavada', precioUnitario: 149.00, precioOferta: 119.00, imagenUrl: uw('1602810318383-e386cc2a3ccf'), stock: 12, categoria: { nombre: 'Camisas' }, marca: { nombre: 'Denim Lab' }, ...ropaVariants(7, 119) },
    { id: 8, descripcion: 'Polerón crudo de felpa', precioUnitario: 129.00, imagenUrl: uw('1620799140408-edc6dcb6d633'), stock: 15, categoria: { nombre: 'Polos' }, marca: { nombre: 'Street Co' }, ...ropaVariants(8, 129) },
    { id: 9, descripcion: 'Pantalón chino caqui', precioUnitario: 139.00, imagenUrl: uw('1473966968600-fa801b869a1a'), stock: 22, categoria: { nombre: 'Pantalones' }, marca: { nombre: 'Atelier' }, ...ropaVariants(9, 139) },
    { id: 10, descripcion: 'Casaca denim de trabajo', precioUnitario: 219.00, imagenUrl: uw('1611312449408-fcece27cdbb7'), stock: 3, categoria: { nombre: 'Casacas' }, marca: { nombre: 'Denim Lab' }, ...ropaVariants(10, 219) },
    { id: 11, descripcion: 'Polo gris esencial', precioUnitario: 59.90, imagenUrl: uw('1564584217132-2271feaeb3c5'), stock: 40, categoria: { nombre: 'Polos' }, marca: { nombre: 'Atelier' }, ...ropaVariants(11, 59.9) },
    { id: 12, descripcion: 'Reloj de acero clásico', precioUnitario: 349.00, imagenUrl: uw('1491336477066-31156b5e4f35'), stock: 6, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Atelier' } },
  ],
};

// ─── Calzado / Zapatería ──────────────────────────────────────────────────────
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;
/** Variantes de talla (y color opcional) con stock variable, para que la ficha muestre tallas agotadas. */
const shoeVariants = (id: number, price: number, sizes: string[], colors: string[] = [], out: string[] = []) => {
  const combos = colors.length ? colors.flatMap((c) => sizes.map((t) => ({ Color: c, Talla: t }))) : sizes.map((t) => ({ Talla: t }));
  return {
    opcionesAtributos: [...(colors.length ? [{ nombre: 'Color', valores: colors }] : []), { nombre: 'Talla', valores: sizes }],
    variantes: combos.map((v, i) => ({ id: id * 100 + i, precioUnitario: price, stock: out.includes(v.Talla) ? 0 : 3 + ((i * 7) % 9), valoresAtributos: v })),
  };
};
const calzadoDemo: RubroDemo = {
  storeName: 'Stride Perú',
  slogan: 'Da el siguiente paso',
  heroKeyword: 'Zapatillas para tu ritmo',
  heroDesc: 'Zapatillas, botines y calzado urbano con las mejores marcas. Tallas del 35 al 44 con envío a todo el país.',
  categories: ['Todos', 'Running', 'Urbanas', 'Training', 'Botines', 'Mujer'],
  plantillaDefault: 'zapatos',
  colorDefault: '#4B5237',
  products: [
    { id: 1, descripcion: 'Zapatilla Urban Runner Blanca', precioUnitario: 289.90, imagenUrl: u('1549298916-b41d501d3772'), stock: 40, categoria: { nombre: 'Urbanas' }, marca: { nombre: 'Stride' }, ...shoeVariants(1, 289.9, ['38', '39', '40', '41', '42', '43'], [], ['43']) },
    { id: 2, descripcion: 'Zapatilla Pulse Pro Running', precioUnitario: 349.00, imagenUrl: u('1542291026-7eec264c27ff'), stock: 30, categoria: { nombre: 'Running' }, marca: { nombre: 'Nike' }, ...shoeVariants(2, 349, ['39', '40', '41', '42', '43', '44'], ['Rojo', 'Negro'], ['39']) },
    { id: 3, descripcion: 'Zapatilla City Flow Blanca', precioUnitario: 299.00, precioOferta: 259.00, imagenUrl: u('1600185365926-3a2ce3cdb9eb'), stock: 18, categoria: { nombre: 'Urbanas' }, marca: { nombre: 'Adidas' }, ...shoeVariants(3, 259, ['36', '37', '38', '39', '40']) },
    { id: 4, descripcion: 'Zapatilla Court Classic', precioUnitario: 239.90, imagenUrl: u('1525966222134-fcfa99b8ae77'), stock: 25, categoria: { nombre: 'Urbanas' }, marca: { nombre: 'Puma' }, ...shoeVariants(4, 239.9, ['38', '39', '40', '41', '42']) },
    { id: 5, descripcion: 'Zapatilla Trainer X1', precioUnitario: 319.00, imagenUrl: u('1608231387042-66d1773070a5'), stock: 22, categoria: { nombre: 'Training' }, marca: { nombre: 'Nike' }, ...shoeVariants(5, 319, ['39', '40', '41', '42', '43']) },
    { id: 6, descripcion: 'Zapatilla Vortex 3 Amortiguación', precioUnitario: 459.00, precioOferta: 399.00, imagenUrl: u('1595950653106-6c9ebd614d3a'), stock: 12, categoria: { nombre: 'Running' }, marca: { nombre: 'Stride' }, ...shoeVariants(6, 399, ['38', '39', '40', '41', '42', '43']) },
    { id: 7, descripcion: 'Botín de Cuero Chelsea', precioUnitario: 329.00, imagenUrl: u('1520639888713-7851133b1ed0'), stock: 10, categoria: { nombre: 'Botines' }, marca: { nombre: 'Stride' }, ...shoeVariants(7, 329, ['39', '40', '41', '42', '43']) },
    { id: 8, descripcion: 'Taco Aguja Nude', precioUnitario: 219.00, imagenUrl: u('1543163521-1bf539c55dd2'), stock: 9, categoria: { nombre: 'Mujer' }, marca: { nombre: 'Stride' }, ...shoeVariants(8, 219, ['35', '36', '37', '38', '39']) },
    { id: 9, descripcion: 'Zapatilla Minimal Knit', precioUnitario: 199.90, imagenUrl: u('1560769629-975ec94e6a86'), stock: 30, categoria: { nombre: 'Training' }, marca: { nombre: 'Puma' }, ...shoeVariants(9, 199.9, ['38', '39', '40', '41']) },
    { id: 10, descripcion: 'Zapatilla Retro High Top', precioUnitario: 369.00, imagenUrl: u('1600269452121-4f2416e55c28'), stock: 14, categoria: { nombre: 'Urbanas' }, marca: { nombre: 'Adidas' }, ...shoeVariants(10, 369, ['39', '40', '41', '42', '43', '44']) },
  ],
};

// ─── Mueblería / Decoración ───────────────────────────────────────────────────
const uf = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
const muebleriaDemo: RubroDemo = {
  storeName: 'Nórdica Home',
  slogan: 'Muebles para un hogar más sereno',
  heroKeyword: 'Muebles para cada espacio',
  heroDesc: 'Sofás, mesas, sillas e iluminación de estilo nórdico para renovar tu casa.',
  categories: ['Todos', 'Sala', 'Dormitorio', 'Comedor', 'Oficina', 'Almacenaje', 'Iluminación', 'Decoración'],
  plantillaDefault: 'muebleria',
  colorDefault: '#7A5A40',
  products: [
    { id: 1, descripcion: 'Sofá Luna 3 cuerpos', precioUnitario: 2899.00, imagenUrl: uf('1540574163026-643ea20ade25'), stock: 6, categoria: { nombre: 'Sala' }, marca: { nombre: 'Nórdica' } },
    { id: 2, descripcion: 'Sillón Capitoné Marfil', precioUnitario: 1190.00, imagenUrl: uf('1567538096630-e0c55bd6374c'), stock: 4, categoria: { nombre: 'Sala' }, marca: { nombre: 'Nórdica' } },
    { id: 3, descripcion: 'Mesa auxiliar de madera', precioUnitario: 349.00, precioOferta: 299.00, imagenUrl: uf('1611486212557-88be5ff6f941'), stock: 12, categoria: { nombre: 'Decoración' }, marca: { nombre: 'Roble & Co' } },
    { id: 4, descripcion: 'Silla Oslo tapizada', precioUnitario: 459.00, imagenUrl: uf('1598300042247-d088f8ab3a91'), stock: 18, categoria: { nombre: 'Comedor' }, marca: { nombre: 'Nórdica' } },
    { id: 5, descripcion: 'Sofá Verde Bosque 2 cuerpos', precioUnitario: 2390.00, imagenUrl: uf('1555041469-a586c61ea9bc'), stock: 3, categoria: { nombre: 'Sala' }, marca: { nombre: 'Nórdica' } },
    { id: 6, descripcion: 'Lámpara de pie Arco', precioUnitario: 399.00, imagenUrl: uf('1507473885765-e6ed057f782c'), stock: 9, categoria: { nombre: 'Iluminación' }, marca: { nombre: 'Luz Norte' } },
    { id: 7, descripcion: 'Taburete alto Eames', precioUnitario: 289.00, imagenUrl: uf('1581539250439-c96689b516dd'), stock: 14, categoria: { nombre: 'Comedor' }, marca: { nombre: 'Roble & Co' } },
    { id: 8, descripcion: 'Estante modular de madera', precioUnitario: 890.00, precioOferta: 749.00, imagenUrl: uf('1595428774223-ef52624120d2'), stock: 5, categoria: { nombre: 'Almacenaje' }, marca: { nombre: 'Nórdica' } },
    { id: 9, descripcion: 'Mesa redonda Tulip', precioUnitario: 1290.00, imagenUrl: uf('1533090481720-856c6e3c1fdc'), stock: 7, categoria: { nombre: 'Comedor' }, marca: { nombre: 'Nórdica' } },
    { id: 10, descripcion: 'Cama queen con cabecera', precioUnitario: 2190.00, imagenUrl: uf('1505693416388-ac5ce068fe85'), stock: 4, categoria: { nombre: 'Dormitorio' }, marca: { nombre: 'Nórdica' } },
    { id: 11, descripcion: 'Escritorio Estudio Roble', precioUnitario: 990.00, imagenUrl: uf('1524758631624-e2822e304c36'), stock: 8, categoria: { nombre: 'Oficina' }, marca: { nombre: 'Roble & Co' } },
    { id: 12, descripcion: 'Lámpara colgante Fiordo', precioUnitario: 259.00, imagenUrl: uf('1513506003901-1e6a229e2d15'), stock: 20, categoria: { nombre: 'Iluminación' }, marca: { nombre: 'Luz Norte' } },
  ],
};

// ─── Mascotas / Veterinaria ───────────────────────────────────────────────────
const up = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;
const mascotasDemo: RubroDemo = {
  storeName: 'Patitas',
  slogan: 'Mejores cuidados, mascotas más felices',
  heroKeyword: 'Todo para tu mascota',
  heroDesc: 'Alimento, accesorios, juguetes y cuidado para perros y gatos.',
  categories: ['Todos', 'Paseo', 'Alimento', 'Descanso', 'Juguetes', 'Higiene', 'Salud'],
  plantillaDefault: 'mascotas',
  colorDefault: '#5E7E4F',
  products: [
    { id: 1, descripcion: 'Juguete de peluche para perro', precioUnitario: 29.90, imagenUrl: up('1591946614720-90a587da4a36'), stock: 25, categoria: { nombre: 'Juguetes' }, marca: { nombre: 'Patitas' } },
    { id: 2, descripcion: 'Comedero con croquetas premium 2 kg', precioUnitario: 64.90, precioOferta: 54.90, imagenUrl: up('1589924691995-400dc9ecc119'), stock: 18, categoria: { nombre: 'Alimento' }, marca: { nombre: 'NutriPet' } },
    { id: 3, descripcion: 'Galletas de hueso para perro 500 g', precioUnitario: 19.90, imagenUrl: up('1568640347023-a616a30bc3bd'), stock: 40, categoria: { nombre: 'Alimento' }, marca: { nombre: 'NutriPet' } },
    { id: 4, descripcion: 'Collar ajustable acolchado', precioUnitario: 34.90, imagenUrl: up('1586671267731-da2cf3ceeb80'), stock: 30, categoria: { nombre: 'Paseo' }, marca: { nombre: 'Patitas' } },
    { id: 5, descripcion: 'Polo abrigador para perro', precioUnitario: 39.90, imagenUrl: up('1583337130417-3346a1be7dee'), stock: 4, categoria: { nombre: 'Paseo' }, marca: { nombre: 'Patitas' } },
    { id: 6, descripcion: 'Cama suave antideslizante', precioUnitario: 119.00, imagenUrl: up('1450778869180-41d0601e046e'), stock: 9, categoria: { nombre: 'Descanso' }, marca: { nombre: 'Patitas' } },
    { id: 7, descripcion: 'Shampoo hipoalergénico 500 ml', precioUnitario: 32.90, imagenUrl: up('1604848698030-c434ba08ece1'), stock: 22, categoria: { nombre: 'Higiene' }, marca: { nombre: 'PetCare' } },
    { id: 8, descripcion: 'Pipeta antipulgas perro mediano', precioUnitario: 45.00, imagenUrl: up('1516734212186-a967f81ad0d7'), stock: 15, categoria: { nombre: 'Salud' }, marca: { nombre: 'PetCare' } },
    { id: 9, descripcion: 'Plato doble para cachorro', precioUnitario: 24.90, imagenUrl: up('1507146426996-ef05306b995a'), stock: 3, categoria: { nombre: 'Alimento' }, marca: { nombre: 'Patitas' } },
    { id: 10, descripcion: 'Snack natural para gato', precioUnitario: 15.90, imagenUrl: up('1573865526739-10659fec78a5'), stock: 35, categoria: { nombre: 'Alimento' }, marca: { nombre: 'NutriPet' } },
  ],
};

// ─── Carteras / Bolsos ────────────────────────────────────────────────────────
const uc = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;
const carterasDemo: RubroDemo = {
  storeName: 'Rosé',
  slogan: 'Carteras que te definen',
  heroKeyword: 'Carteras con estilo',
  heroDesc: 'Carteras, bandoleras, mochilas y billeteras para cada ocasión.',
  categories: ['Todos', 'Carteras de mano', 'Bandoleras', 'Tote bags', 'Mochilas', 'Billeteras', 'Clutch', 'Satchel'],
  plantillaDefault: 'bolsos',
  colorDefault: '#6B1D38',
  products: [
    { id: 1, descripcion: 'Cartera de mano Aurora', precioUnitario: 189.00, imagenUrl: uc('1606522754091-a3bbf9ad4cb3'), stock: 12, destacado: true, categoria: { nombre: 'Carteras de mano' }, marca: { nombre: 'Rosé' } },
    { id: 2, descripcion: 'Bandolera Chevron rosa', precioUnitario: 159.00, precioOferta: 129.00, fechaFinOferta: new Date(Date.now() + 3 * 86400000).toISOString(), imagenUrl: uc('1566150905458-1bf1fc113f0d'), stock: 8, categoria: { nombre: 'Bandoleras' }, marca: { nombre: 'Rosé' } },
    { id: 3, descripcion: 'Tote de cuero negro', precioUnitario: 249.00, imagenUrl: uc('1614179689702-355944cd0918'), stock: 6, destacado: true, categoria: { nombre: 'Tote bags' }, marca: { nombre: 'Rosé' } },
    { id: 4, descripcion: 'Mochila urbana terracota', precioUnitario: 199.00, precioOferta: 169.00, imagenUrl: uc('1622560480605-d83c853bc5c3'), stock: 10, categoria: { nombre: 'Mochilas' }, marca: { nombre: 'Rosé' } },
    { id: 5, descripcion: 'Billetera de cuero camel', precioUnitario: 89.00, imagenUrl: uc('1627123424574-724758594e93'), stock: 20, categoria: { nombre: 'Billeteras' }, marca: { nombre: 'Rosé' } },
    { id: 6, descripcion: 'Mini bolso croco vino', precioUnitario: 179.00, imagenUrl: uc('1575032617751-6ddec2089882'), stock: 4, categoria: { nombre: 'Clutch' }, marca: { nombre: 'Rosé' } },
    { id: 7, descripcion: 'Satchel gris perla', precioUnitario: 229.00, imagenUrl: uc('1605733513597-a8f8341084e6'), stock: 7, categoria: { nombre: 'Satchel' }, marca: { nombre: 'Rosé' } },
    { id: 8, descripcion: 'Bandolera camel clásica', precioUnitario: 169.00, imagenUrl: uc('1600857062241-98e5dba7f214'), stock: 9, categoria: { nombre: 'Bandoleras' }, marca: { nombre: 'Rosé' } },
    { id: 9, descripcion: 'Cartera turquesa con asa', precioUnitario: 209.00, imagenUrl: uc('1594223274512-ad4803739b7c'), stock: 5, categoria: { nombre: 'Carteras de mano' }, marca: { nombre: 'Rosé' } },
    { id: 10, descripcion: 'Mochila minimal azul noche', precioUnitario: 159.00, imagenUrl: uc('1553062407-98eeb64c6a62'), stock: 11, categoria: { nombre: 'Mochilas' }, marca: { nombre: 'Rosé' } },
    { id: 11, descripcion: 'Cartera floral de verano', precioUnitario: 219.00, precioOferta: 175.00, imagenUrl: uc('1591561954557-26941169b49e'), stock: 3, categoria: { nombre: 'Tote bags' }, marca: { nombre: 'Rosé' } },
    { id: 12, descripcion: 'Bolso mostaza de solapa', precioUnitario: 199.00, imagenUrl: uc('1612902456551-333ac5afa26e'), stock: 0, categoria: { nombre: 'Satchel' }, marca: { nombre: 'Rosé' } },
  ],
};

// ─── Maquillaje / Cosméticos ─────────────────────────────────────────────────
const ub = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;
const maquillajeDemo: RubroDemo = {
  storeName: 'Blush',
  slogan: 'Belleza simple, luminosa y tuya',
  heroKeyword: 'Brilla a tu manera',
  heroDesc: 'Maquillaje, skincare y accesorios de belleza.',
  categories: ['Todos', 'Labios', 'Rostro', 'Ojos', 'Skincare'],
  plantillaDefault: 'maquillaje',
  colorDefault: '#C98B86',
  products: [
    { id: 1, descripcion: 'Labial satinado Rosé', precioUnitario: 39.90, imagenUrl: ub('1625093742435-6fa192b6fb10'), stock: 24, categoria: { nombre: 'Labios' }, marca: { nombre: 'Blush' } },
    { id: 2, descripcion: 'Sérum iluminador 30 ml', precioUnitario: 89.90, precioOferta: 74.90, imagenUrl: ub('1617897903246-719242758050'), stock: 12, categoria: { nombre: 'Skincare' }, marca: { nombre: 'Blush' } },
    { id: 3, descripcion: 'Polvo compacto translúcido', precioUnitario: 59.90, imagenUrl: ub('1503236823255-94609f598e71'), stock: 18, categoria: { nombre: 'Rostro' }, marca: { nombre: 'Blush' } },
    { id: 4, descripcion: 'Máscara de pestañas volumen', precioUnitario: 45.00, imagenUrl: ub('1631214540553-ff044a3ff1d4'), stock: 30, categoria: { nombre: 'Ojos' }, marca: { nombre: 'Blush' } },
    { id: 5, descripcion: 'Paleta de sombras Nude', precioUnitario: 119.00, imagenUrl: ub('1583241800698-e8ab01830a07'), stock: 4, categoria: { nombre: 'Ojos' }, marca: { nombre: 'Blush' } },
    { id: 6, descripcion: 'Crema hidratante facial 50 ml', precioUnitario: 79.00, imagenUrl: ub('1620916566398-39f1143ab7be'), stock: 9, categoria: { nombre: 'Skincare' }, marca: { nombre: 'Blush' } },
    { id: 7, descripcion: 'Aceite facial de noche', precioUnitario: 95.00, imagenUrl: ub('1600428877878-1a0fd85beda8'), stock: 15, categoria: { nombre: 'Skincare' }, marca: { nombre: 'Blush' } },
    { id: 8, descripcion: 'Set de brochas esenciales', precioUnitario: 129.00, imagenUrl: ub('1526045478516-99145907023c'), stock: 7, categoria: { nombre: 'Rostro' }, marca: { nombre: 'Blush' } },
    { id: 9, descripcion: 'Bálsamo hidratante de manos', precioUnitario: 32.90, imagenUrl: ub('1619451334792-150fd785ee74'), stock: 3, categoria: { nombre: 'Skincare' }, marca: { nombre: 'Blush' } },
    { id: 10, descripcion: 'Rubor en polvo Peach', precioUnitario: 49.90, imagenUrl: ub('1596462502278-27bfdc403348'), stock: 20, categoria: { nombre: 'Rostro' }, marca: { nombre: 'Blush' } },
  ],
};

// ─── Tecnología / Computación ────────────────────────────────────────────────
const tecnologiaDemo: RubroDemo = {
  storeName: 'TechStore Peru',
  slogan: 'Tecnología al alcance de todos',
  heroKeyword: 'Los Mejores Dispositivos',
  heroDesc: 'Laptops, celulares, accesorios y gaming al mejor precio del mercado. Stock disponible con garantía y soporte técnico.',
  categories: ['Todos', 'Laptops', 'Celulares', 'Accesorios', 'Audio', 'Gaming'],
  plantillaDefault: 'tecnica',
  colorDefault: '#1E3A5F',
  products: [
    { id: 1, descripcion: 'Laptop Lenovo IdeaPad 15" Intel i5', precioUnitario: 1899.00, precioOriginal: 2200.00, imagenUrl: img(400,400,'EFF6FF','1E40AF','Laptop'), stock: 5, categoria: { nombre: 'Laptops' }, marca: { nombre: 'Lenovo' } },
    { id: 2, descripcion: 'iPhone 15 128GB Negro', precioUnitario: 3499.00, precioOriginal: 0, imagenUrl: img(400,400,'1C1917','F5F5F4','iPhone'), stock: 8, categoria: { nombre: 'Celulares' }, marca: { nombre: 'Apple' } },
    { id: 3, descripcion: 'Audífonos Sony WH-1000XM5', precioUnitario: 799.00, precioOriginal: 999.00, imagenUrl: img(400,400,'F3F4F6','111827','Sony WH'), stock: 6, categoria: { nombre: 'Audio' }, marca: { nombre: 'Sony' } },
    { id: 4, descripcion: 'Monitor Samsung 27" FHD 165Hz', precioUnitario: 899.00, precioOriginal: 1099.00, imagenUrl: img(400,400,'0F172A','38BDF8','Monitor'), stock: 4, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Samsung' } },
    { id: 5, descripcion: 'Teclado Mecánico RGB Redragon', precioUnitario: 179.00, precioOriginal: 0, imagenUrl: img(400,400,'1E1B4B','818CF8','Teclado'), stock: 12, categoria: { nombre: 'Gaming' }, marca: { nombre: 'Redragon' } },
    { id: 6, descripcion: 'Samsung Galaxy A55 5G 256GB', precioUnitario: 1299.00, precioOriginal: 1499.00, imagenUrl: img(400,400,'1E3A5F','7DD3FC','Galaxy A55'), stock: 10, categoria: { nombre: 'Celulares' }, marca: { nombre: 'Samsung' } },
    { id: 7, descripcion: 'SSD Kingston 1TB SATA', precioUnitario: 249.00, precioOriginal: 0, imagenUrl: img(400,400,'F0FDF4','15803D','SSD'), stock: 20, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Kingston' } },
    { id: 8, descripcion: 'Silla Gamer RGB Reclinable', precioUnitario: 599.00, precioOriginal: 750.00, imagenUrl: img(400,400,'FEF2F2','991B1B','Silla Gamer'), stock: 3, categoria: { nombre: 'Gaming' }, marca: { nombre: 'DXRacer' } },
  ],
};

// ─── Automotriz / Repuestos ───────────────────────────────────────────────────
const automotrizDemo: RubroDemo = {
  storeName: 'AutoPartes Express',
  slogan: 'Repuestos originales y alternativos',
  heroKeyword: 'Los Mejores Repuestos',
  heroDesc: 'Repuestos originales y alternativos para todas las marcas. Encuentra lo que necesitas para tu vehículo al mejor precio.',
  categories: ['Todos', 'Motor', 'Frenos', 'Eléctrico', 'Accesorios', 'Lubricantes'],
  plantillaDefault: 'tecnica',
  colorDefault: '#1C1917',
  products: [
    { id: 1, descripcion: 'Aceite Motor Mobil 1 5W-30 4L', precioUnitario: 89.90, precioOriginal: 110.00, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 30, categoria: { nombre: 'Lubricantes' }, marca: { nombre: 'Mobil' } },
    { id: 2, descripcion: 'Pastillas de Freno Toyota Corolla', precioUnitario: 45.00, precioOriginal: 0, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 20, categoria: { nombre: 'Frenos' }, marca: { nombre: 'TRW' } },
    { id: 3, descripcion: 'Batería Bosch 60Ah 12V', precioUnitario: 299.00, precioOriginal: 350.00, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 8, categoria: { nombre: 'Eléctrico' }, marca: { nombre: 'Bosch' } },
    { id: 4, descripcion: 'Filtro de Aire Motor Honda', precioUnitario: 28.00, precioOriginal: 0, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 25, categoria: { nombre: 'Motor' }, marca: { nombre: 'Bosch' } },
    { id: 5, descripcion: 'Amortiguador Monroe Trasero', precioUnitario: 159.00, precioOriginal: 200.00, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 6, categoria: { nombre: 'Motor' }, marca: { nombre: 'Monroe' } },
    { id: 6, descripcion: 'Cámara de Reversa Universal HD', precioUnitario: 89.00, precioOriginal: 0, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 15, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Genérico' } },
    { id: 7, descripcion: 'Llantas 195/65R15 Pirelli', precioUnitario: 280.00, precioOriginal: 320.00, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 16, categoria: { nombre: 'Motor' }, marca: { nombre: 'Pirelli' } },
    { id: 8, descripcion: 'Extintor Vehicular 1kg CO2', precioUnitario: 35.00, precioOriginal: 0, imagenUrl: '/assets/templates/autopartes/producto.png', stock: 40, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Solkaflam' } },
  ],
};

// ─── Salud y Belleza ─────────────────────────────────────────────────────────
const saludDemo: RubroDemo = {
  storeName: 'Belleza & Más',
  slogan: 'Tu bienestar es nuestra misión',
  heroKeyword: 'Tu Mejor Versión',
  heroDesc: 'Skincare, maquillaje, perfumes y tratamientos spa de las mejores marcas. Brilla con productos que realmente funcionan.',
  categories: ['Todos', 'Skincare', 'Maquillaje', 'Cabello', 'Perfumes', 'Spa'],
  plantillaDefault: 'elegante',
  colorDefault: '#DB2777',
  products: [
    { id: 1, descripcion: 'Sérum Vitamina C 30ml Neutrogena', precioUnitario: 89.90, precioOriginal: 110.00, imagenUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80', stock: 20, categoria: { nombre: 'Skincare' }, marca: { nombre: 'Neutrogena' } },
    { id: 2, descripcion: 'Labial Matte Maybelline Rojo', precioUnitario: 29.90, imagenUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=500&q=80', stock: 35, categoria: { nombre: 'Maquillaje' }, marca: { nombre: 'Maybelline' } },
    { id: 3, descripcion: 'Shampoo Kerastase Nutritive 250ml', precioUnitario: 69.00, precioOriginal: 85.00, imagenUrl: 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=500&q=80', stock: 15, categoria: { nombre: 'Cabello' }, marca: { nombre: 'Kérastase' } },
    { id: 4, descripcion: 'Perfume BOSS Bottled 100ml', precioUnitario: 189.00, precioOriginal: 230.00, imagenUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80', stock: 8, categoria: { nombre: 'Perfumes' }, marca: { nombre: 'Hugo Boss' } },
    { id: 5, descripcion: 'Set Maquillaje Completo L\'Oreal', precioUnitario: 149.00, imagenUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80', stock: 10, categoria: { nombre: 'Maquillaje' }, marca: { nombre: "L'Oreal" } },
    { id: 6, descripcion: 'Crema Hidratante Cetaphil 250ml', precioUnitario: 45.00, precioOriginal: 55.00, imagenUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80', stock: 25, categoria: { nombre: 'Skincare' }, marca: { nombre: 'Cetaphil' } },
    { id: 7, descripcion: 'Mascarilla Capilar Elvive 300ml', precioUnitario: 22.90, imagenUrl: 'https://images.unsplash.com/photo-1626766632648-c11c1a1c1b0f?auto=format&fit=crop&w=500&q=80', stock: 30, categoria: { nombre: 'Cabello' }, marca: { nombre: 'Elvive' } },
    { id: 8, descripcion: 'Kit Spa Facial Completo', precioUnitario: 89.00, precioOriginal: 120.00, imagenUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80', stock: 12, categoria: { nombre: 'Spa' }, marca: { nombre: 'Varios' } },
  ],
};

// ─── Deportes y Recreación ────────────────────────────────────────────────────
const deportesDemo: RubroDemo = {
  storeName: 'SportZone Peru',
  slogan: 'Equípate para ganar',
  heroKeyword: 'El Mejor Equipo',
  heroDesc: 'Zapatillas, ropa deportiva, equipos de entrenamiento y nutrición. Todo lo que necesitas para alcanzar tu mejor rendimiento.',
  categories: ['Todos', 'Zapatillas', 'Ropa Deportiva', 'Equipos', 'Nutrición', 'Accesorios'],
  plantillaDefault: 'moderna',
  colorDefault: '#DC2626',
  products: [
    { id: 1, descripcion: 'Zapatillas Nike Air Max 270', precioUnitario: 399.00, precioOriginal: 499.00, imagenUrl: img(400,400,'EFF6FF','1E40AF','Nike Air'), stock: 10, categoria: { nombre: 'Zapatillas' }, marca: { nombre: 'Nike' } },
    { id: 2, descripcion: 'Short Adidas Entrenamiento', precioUnitario: 89.00, precioOriginal: 0, imagenUrl: img(400,400,'111827','FFFFFF','Short Adidas'), stock: 20, categoria: { nombre: 'Ropa Deportiva' }, marca: { nombre: 'Adidas' } },
    { id: 3, descripcion: 'Mancuernas 10kg Par', precioUnitario: 149.00, precioOriginal: 0, imagenUrl: img(400,400,'F3F4F6','111827','Mancuernas'), stock: 8, categoria: { nombre: 'Equipos' }, marca: { nombre: 'CAP' } },
    { id: 4, descripcion: 'Proteína Whey Gold 5lb Chocolate', precioUnitario: 299.00, precioOriginal: 350.00, imagenUrl: img(400,400,'FEF3C7','92400E','Whey Gold'), stock: 12, categoria: { nombre: 'Nutrición' }, marca: { nombre: 'ON Gold' } },
    { id: 5, descripcion: 'Balón Fútbol Nike Strike T5', precioUnitario: 79.00, precioOriginal: 99.00, imagenUrl: img(400,400,'F0FDF4','15803D','Balon'), stock: 15, categoria: { nombre: 'Equipos' }, marca: { nombre: 'Nike' } },
    { id: 6, descripcion: 'Polo Dry-Fit Compresión', precioUnitario: 59.00, precioOriginal: 0, imagenUrl: img(400,400,'FEF2F2','DC2626','Polo Dry-Fit'), stock: 25, categoria: { nombre: 'Ropa Deportiva' }, marca: { nombre: 'Under Armour' } },
    { id: 7, descripcion: 'Banda de Resistencia Set x5', precioUnitario: 45.00, precioOriginal: 0, imagenUrl: img(400,400,'F5F3FF','6D28D9','Bandas'), stock: 30, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Genérico' } },
    { id: 8, descripcion: 'Cuerda de Salto Profesional', precioUnitario: 29.90, precioOriginal: 0, imagenUrl: img(400,400,'FFFBEB','D97706','Cuerda'), stock: 20, categoria: { nombre: 'Accesorios' }, marca: { nombre: 'Everlast' } },
  ],
};

// ─── Panadería / Pastelería ───────────────────────────────────────────────────
const panaderiaDemo: RubroDemo = {
  storeName: 'Panadería La Especial',
  slogan: 'Recién horneado, todos los días',
  heroKeyword: 'Lo Mejor del Horno',
  heroDesc: 'Panes artesanales, tortas, pasteles y galletas hechos con amor cada mañana. Encarga tu torta personalizada con anticipación.',
  categories: ['Todos', 'Panes', 'Tortas', 'Pasteles', 'Galletas', 'Bebidas'],
  plantillaDefault: 'menu',
  colorDefault: '#B45309',
  products: [
    { id: 1, descripcion: 'Pan Francés x Kilo', precioUnitario: 6.50, precioOriginal: 0, imagenUrl: img(400,300,'FEF9C3','854D0E','Pan Frances'), stock: 100, categoria: { nombre: 'Panes' }, marca: { nombre: 'La Especial' } },
    { id: 2, descripcion: 'Torta de Chocolate 1kg', precioUnitario: 65.00, precioOriginal: 80.00, imagenUrl: img(400,300,'3B1F14','FDE68A','Torta Choc'), stock: 5, categoria: { nombre: 'Tortas' }, marca: { nombre: 'La Especial' } },
    { id: 3, descripcion: 'Empanadas de Pollo x6', precioUnitario: 18.00, precioOriginal: 0, imagenUrl: img(400,300,'FEF3C7','D97706','Empanadas'), stock: 20, categoria: { nombre: 'Pasteles' }, marca: { nombre: 'La Especial' } },
    { id: 4, descripcion: 'Cupcakes Decorados x12', precioUnitario: 45.00, precioOriginal: 55.00, imagenUrl: img(400,300,'FDF2F8','BE185D','Cupcakes'), stock: 8, categoria: { nombre: 'Pasteles' }, marca: { nombre: 'La Especial' } },
    { id: 5, descripcion: 'Galletas de Mantequilla x24', precioUnitario: 22.00, precioOriginal: 0, imagenUrl: img(400,300,'FFFBEB','92400E','Galletas'), stock: 15, categoria: { nombre: 'Galletas' }, marca: { nombre: 'La Especial' } },
    { id: 6, descripcion: 'Café Americano 500ml', precioUnitario: 8.00, precioOriginal: 0, imagenUrl: img(400,300,'292524','FDE68A','Cafe'), stock: 30, categoria: { nombre: 'Bebidas' }, marca: { nombre: 'La Especial' } },
    { id: 7, descripcion: 'Queque Marmoleado 500g', precioUnitario: 28.00, precioOriginal: 0, imagenUrl: img(400,300,'FEF3C7','B45309','Queque'), stock: 10, categoria: { nombre: 'Tortas' }, marca: { nombre: 'La Especial' } },
    { id: 8, descripcion: 'Pan de Molde Integral 500g', precioUnitario: 9.50, precioOriginal: 12.00, imagenUrl: img(400,300,'F0FDF4','15803D','Pan Molde'), stock: 25, categoria: { nombre: 'Panes' }, marca: { nombre: 'La Especial' } },
  ],
};

// ─── Artesanía / Decoración / Arte ───────────────────────────────────────────
const artesaniaDemo: RubroDemo = {
  storeName: 'Arte & Alma',
  slogan: 'Objetos únicos hechos con amor',
  heroKeyword: 'Arte Único y Original',
  heroDesc: 'Artesanías peruanas, joyería artesanal y decoración única. Cada pieza cuenta una historia y está hecha a mano con los mejores materiales.',
  categories: ['Todos', 'Cerámica', 'Textiles', 'Joyería', 'Cuadros', 'Madera'],
  plantillaDefault: 'elegante',
  colorDefault: '#B45309',
  products: [
    { id: 1, descripcion: 'Jarrón Cerámico Artesanal', precioUnitario: 89.00, precioOriginal: 0, imagenUrl: img(400,500,'FFF7ED','C2410C','Jarron'), stock: 5, categoria: { nombre: 'Cerámica' }, marca: { nombre: 'Artesano' } },
    { id: 2, descripcion: 'Camino de Mesa Tejido a Mano', precioUnitario: 55.00, precioOriginal: 70.00, imagenUrl: img(400,500,'FFFBEB','D97706','Camino'), stock: 8, categoria: { nombre: 'Textiles' }, marca: { nombre: 'Artesano' } },
    { id: 3, descripcion: 'Collar de Plata con Turquesa', precioUnitario: 120.00, precioOriginal: 0, imagenUrl: img(400,500,'E0F2FE','0369A1','Collar'), stock: 6, categoria: { nombre: 'Joyería' }, marca: { nombre: 'Artesano' } },
    { id: 4, descripcion: 'Cuadro Acrílico 40x50cm', precioUnitario: 180.00, precioOriginal: 220.00, imagenUrl: img(400,500,'F5F3FF','6D28D9','Cuadro'), stock: 3, categoria: { nombre: 'Cuadros' }, marca: { nombre: 'Artesano' } },
    { id: 5, descripcion: 'Tallado en Madera Andino', precioUnitario: 95.00, precioOriginal: 0, imagenUrl: img(400,500,'FEF3C7','92400E','Tallado'), stock: 4, categoria: { nombre: 'Madera' }, marca: { nombre: 'Artesano' } },
    { id: 6, descripcion: 'Tapiz Cusqueño 80x120cm', precioUnitario: 245.00, precioOriginal: 300.00, imagenUrl: img(400,500,'FEF2F2','991B1B','Tapiz'), stock: 2, categoria: { nombre: 'Textiles' }, marca: { nombre: 'Artesano' } },
    { id: 7, descripcion: 'Pulsera Huayruros y Plata', precioUnitario: 45.00, precioOriginal: 0, imagenUrl: img(400,500,'F0FDF4','15803D','Pulsera'), stock: 15, categoria: { nombre: 'Joyería' }, marca: { nombre: 'Artesano' } },
    { id: 8, descripcion: 'Set Mates Burilados x3', precioUnitario: 65.00, precioOriginal: 80.00, imagenUrl: img(400,500,'FEFCE8','CA8A04','Mates'), stock: 7, categoria: { nombre: 'Cerámica' }, marca: { nombre: 'Artesano' } },
  ],
};

// ─── Agricultura / Ganadería ──────────────────────────────────────────────────
const agriculturaDemo: RubroDemo = {
  storeName: 'AgroTienda Peru',
  slogan: 'Del campo a tu negocio',
  heroKeyword: 'Los Mejores Insumos',
  heroDesc: 'Semillas, fertilizantes, herramientas agrícolas y más. Todo lo que necesita tu campo para una cosecha exitosa.',
  categories: ['Todos', 'Semillas', 'Fertilizantes', 'Herramientas', 'Animales', 'Riego'],
  plantillaDefault: 'moderna',
  colorDefault: '#15803D',
  products: [
    { id: 1, descripcion: 'Semillas Tomate Híbrido x50g', precioUnitario: 25.00, precioOriginal: 0, imagenUrl: img(400,400,'F0FDF4','15803D','Semillas'), stock: 50, categoria: { nombre: 'Semillas' }, marca: { nombre: 'Hazera' } },
    { id: 2, descripcion: 'Fertilizante NPK 20-20-20 25kg', precioUnitario: 85.00, precioOriginal: 100.00, imagenUrl: img(400,400,'FFFBEB','D97706','Fertilizante'), stock: 30, categoria: { nombre: 'Fertilizantes' }, marca: { nombre: 'Yara' } },
    { id: 3, descripcion: 'Motocultor 7HP Honda', precioUnitario: 1850.00, precioOriginal: 2200.00, imagenUrl: img(400,400,'FEF2F2','991B1B','Motocultor'), stock: 3, categoria: { nombre: 'Herramientas' }, marca: { nombre: 'Honda' } },
    { id: 4, descripcion: 'Sistema Riego Goteo 100 Plantas', precioUnitario: 189.00, precioOriginal: 0, imagenUrl: img(400,400,'EFF6FF','1E40AF','Riego Goteo'), stock: 10, categoria: { nombre: 'Riego' }, marca: { nombre: 'Netafim' } },
    { id: 5, descripcion: 'Pesticida Orgánico Neem 1L', precioUnitario: 35.00, precioOriginal: 0, imagenUrl: img(400,400,'F5F3FF','6D28D9','Neem'), stock: 25, categoria: { nombre: 'Fertilizantes' }, marca: { nombre: 'BioGreen' } },
    { id: 6, descripcion: 'Macetas Plástico T20 x10u', precioUnitario: 22.00, precioOriginal: 28.00, imagenUrl: img(400,400,'FEF9C3','854D0E','Macetas'), stock: 60, categoria: { nombre: 'Herramientas' }, marca: { nombre: 'Genérico' } },
    { id: 7, descripcion: 'Balanza Digital 200kg', precioUnitario: 299.00, precioOriginal: 0, imagenUrl: img(400,400,'F3F4F6','374151','Balanza'), stock: 8, categoria: { nombre: 'Herramientas' }, marca: { nombre: 'Jadever' } },
    { id: 8, descripcion: 'Vitaminas Avícolas 1kg', precioUnitario: 45.00, precioOriginal: 55.00, imagenUrl: img(400,400,'ECFDF5','065F46','Vitaminas Av.'), stock: 20, categoria: { nombre: 'Animales' }, marca: { nombre: 'Farvet' } },
  ],
};

// ─── Genérico fallback ────────────────────────────────────────────────────────
const genericoDemo: RubroDemo = {
  storeName: 'Mi Tienda Virtual',
  slogan: 'Los mejores productos para ti',
  heroKeyword: 'Los Mejores Productos',
  heroDesc: 'Descubre nuestra selección de productos de calidad al mejor precio. Envío rápido y garantía en todos tus pedidos.',
  categories: ['Todos', 'Destacados', 'Ofertas', 'Nuevos', 'Popular'],
  plantillaDefault: 'moderna',
  colorDefault: '#6A6CFF',
  products: [
    { id: 1, descripcion: 'Producto Estrella A', precioUnitario: 49.90, precioOriginal: 65.00, imagenUrl: img(400,400,'EEF2FF','4F46E5','Producto A'), stock: 20, categoria: { nombre: 'Destacados' }, marca: { nombre: 'Marca A' } },
    { id: 2, descripcion: 'Oferta Especial B', precioUnitario: 29.90, precioOriginal: 0, imagenUrl: img(400,400,'F0FDF4','15803D','Producto B'), stock: 35, categoria: { nombre: 'Ofertas' }, marca: { nombre: 'Marca B' } },
    { id: 3, descripcion: 'Nuevo Producto C', precioUnitario: 89.90, precioOriginal: 110.00, imagenUrl: img(400,400,'FDF2F8','BE185D','Producto C'), stock: 12, categoria: { nombre: 'Nuevos' }, marca: { nombre: 'Marca C' } },
    { id: 4, descripcion: 'Más Vendido D', precioUnitario: 15.00, precioOriginal: 0, imagenUrl: img(400,400,'FFFBEB','D97706','Producto D'), stock: 50, categoria: { nombre: 'Popular' }, marca: { nombre: 'Marca D' } },
    { id: 5, descripcion: 'Producto Premium E', precioUnitario: 199.00, precioOriginal: 250.00, imagenUrl: img(400,400,'F3F4F6','374151','Producto E'), stock: 8, categoria: { nombre: 'Destacados' }, marca: { nombre: 'Marca E' } },
    { id: 6, descripcion: 'Súper Oferta F', precioUnitario: 9.90, precioOriginal: 15.00, imagenUrl: img(400,400,'FEF2F2','DC2626','Producto F'), stock: 100, categoria: { nombre: 'Ofertas' }, marca: { nombre: 'Marca F' } },
    { id: 7, descripcion: 'Colección Nueva G', precioUnitario: 65.00, precioOriginal: 0, imagenUrl: img(400,400,'E0F2FE','0369A1','Producto G'), stock: 15, categoria: { nombre: 'Nuevos' }, marca: { nombre: 'Marca G' } },
    { id: 8, descripcion: 'Tendencia H', precioUnitario: 35.00, precioOriginal: 45.00, imagenUrl: img(400,400,'F5F3FF','6D28D9','Producto H'), stock: 25, categoria: { nombre: 'Popular' }, marca: { nombre: 'Marca H' } },
  ],
};

// ─── Resolver por nombre de rubro ─────────────────────────────────────────────
export function getRubroDemo(rubroNombre: string = ''): RubroDemo {
  const n = rubroNombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  if (n.includes('ferret') || n.includes('herrami') || n.includes('construcc') || n.includes('material'))
    return ferreteriaDemo;
  if (n.includes('mascot') || n.includes('pet shop') || n.includes('petshop') || (n.includes('veterin') && !n.includes('farmac')))
    return mascotasDemo;
  if (n.includes('carter') || n.includes('bolso') || n.includes('marroq') || n.includes('mochil'))
    return carterasDemo;
  if (n.includes('maquill') || n.includes('cosmet') || n.includes('makeup') || n.includes('skincare'))
    return maquillajeDemo;
  if (n.includes('botic') || n.includes('farmac') || n.includes('drogue') || n.includes('salud med'))
    return farmaciaDemo;
  if (n.includes('restaur') || n.includes('cafet') || n.includes('cevich') || n.includes('comida'))
    return restauranteDemo;
  if (n.includes('mueble') || n.includes('carpint') || n.includes('colchon'))
    return muebleriaDemo;
  if (n.includes('calzad') || n.includes('zapat'))
    return calzadoDemo;
  if (n.includes('ropa') || n.includes('moda') || n.includes('boutique') || n.includes('vestim') || n.includes('textil') || n.includes('confec'))
    return ropaDemo;
  if (n.includes('tecnol') || n.includes('comput') || n.includes('electron') || n.includes('celular') || n.includes('gaming') || n.includes('repuest') && n.includes('comput'))
    return tecnologiaDemo;
  if (n.includes('autom') || n.includes('repuest') || n.includes('motor') || n.includes('moto'))
    return automotrizDemo;
  if (n.includes('bode') || n.includes('abarrot') || n.includes('superm') || n.includes('minori') || n.includes('comercio'))
    return bodegaDemo;
  if (n.includes('salud') || n.includes('belleza') || n.includes('cosmetic') || n.includes('cuidado'))
    return saludDemo;
  if (n.includes('deport') || n.includes('recreac') || n.includes('fitness') || n.includes('gym'))
    return deportesDemo;
  if (n.includes('panad') || n.includes('pastel') || n.includes('dulce') || n.includes('heladeri') || n.includes('chocolat'))
    return panaderiaDemo;
  if (n.includes('artesani') || n.includes('decorac') || n.includes('arte') || n.includes('manualid') || n.includes('joyeri'))
    return artesaniaDemo;
  if (n.includes('agricult') || n.includes('ganaد') || n.includes('ganad') || n.includes('agro') || n.includes('campo'))
    return agriculturaDemo;

  return genericoDemo;
}
