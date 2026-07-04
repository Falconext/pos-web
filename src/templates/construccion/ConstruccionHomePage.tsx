import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import TecnologiaHeader from '@/components/tienda/TecnologiaHeader';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import ProductCardGromuse from '@/components/tienda/ProductCardGromuse';

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
const getBannerImage = (banner: any) => banner?.imagenUrl || banner?.imagen || banner?.url || '';

function ConstruccionFooter({ tienda, slug, cp, categories }: { tienda: any; slug: string; cp: string; categories: any[] }) {
  const storeName = tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || 'Ferretería';
  const links = categories.map(getName).filter(Boolean).slice(0, 5);
  return (
    <footer className="bg-[#111827] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:px-6">
        <div>
          <p className="text-lg font-black">{storeName}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
            Materiales, herramientas y soluciones para obra con atención rápida, stock claro y compras seguras.
          </p>
        </div>
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.18em]" style={{ color: cp }}>Comprar</p>
          <div className="space-y-3 text-sm text-white/60">
            <a href={`/tienda/${slug}/catalogo`} className="block hover:text-white">Catálogo</a>
            <a href={`/tienda/${slug}/seguimiento`} className="block hover:text-white">Ver pedido</a>
            <a href={`/tienda/${slug}/checkout`} className="block hover:text-white">Checkout</a>
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.18em]" style={{ color: cp }}>Categorías</p>
          <div className="space-y-3 text-sm text-white/60">
            {links.map((name) => (
              <a key={name} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`} className="block hover:text-white">
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs font-semibold text-white/35">
        © {new Date().getFullYear()} {storeName}. Desarrollado por Falconext.
      </div>
    </footer>
  );
}

export default function ConstruccionHomePage({
  tienda,
  slug,
  productos,
  allCategories,
  cp,
  diseno,
  carrito,
  setCarrito,
  mostrarCarrito,
  setMostrarCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  loading,
}: TemplateHomePageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const storeName = tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || 'Ferretería Pro';
  const banners = Array.isArray(tienda?.banners) ? tienda.banners : [];
  const heroBanner = banners.find((item: any) => getBannerImage(item)) || null;
  const heroProduct = productos.find((item) => item?.imagenUrl) || productos[0];
  const heroImage = getBannerImage(heroBanner) || heroProduct?.imagenUrl;
  const categories = allCategories.map(getName).filter(Boolean).slice(0, 6);
  const destacados = productos.slice(0, 8);
  const ofertas = productos
    .filter((item) => Number(item?.precioOriginal || item?.precioRegular || 0) > Number(item?.precioUnitario || 0))
    .slice(0, 4);
  const irACheckout = () => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });

  return (
    <div className="min-h-screen bg-[#F5F3EF]" style={{ fontFamily: `'${diseno?.tipografia || 'Inter'}', sans-serif` }}>
      <TecnologiaHeader
        tienda={tienda}
        slug={slug}
        cp={cp}
        carritoSize={carrito.length}
        onOpenCart={() => setMostrarCarrito(true)}
        searchQuery={search}
        setSearchQuery={setSearch}
        onSearchSubmit={(e, value) => {
          e.preventDefault();
          navigate(`/tienda/${slug}/catalogo?search=${encodeURIComponent(value)}`);
        }}
        allCategories={allCategories}
      />

      <main>
        <section className="relative overflow-hidden bg-[#111827] text-white">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 12px, transparent 12px 28px)' }}
          />
          <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:px-6">
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: cp }}>
                <Icon icon="solar:buildings-3-bold" width={18} />
                Construcción y ferretería
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.98] md:text-6xl">
                Todo para tu obra en una tienda rápida y profesional.
              </h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/65">
                {tienda?.slogan || `Compra en ${storeName}: materiales, herramientas y accesorios con disponibilidad real.`}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/tienda/${slug}/catalogo`)}
                  className="inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-black text-[#111827] shadow-xl transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: cp }}
                >
                  Ver catálogo <Icon icon="solar:alt-arrow-right-bold" width={18} />
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('construccion-destacados')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-6 text-sm font-black text-white hover:bg-white/10"
                >
                  Productos destacados
                </button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }} className="relative z-10">
              <div className="rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl">
                {heroImage ? (
                  <img src={heroImage} alt={heroProduct?.descripcion || storeName} className="aspect-[4/3] w-full rounded-[1.35rem] object-contain" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-[1.35rem] bg-gray-100 text-gray-300">
                    <Icon icon="solar:box-linear" width={84} />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {categories.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`)}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: index % 2 ? '#111827' : cp }}>
                    <Icon icon={index % 2 ? 'solar:bolt-bold' : 'solar:box-bold'} width={20} />
                  </span>
                  <span className="mt-4 block text-sm font-black text-gray-950">{name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section id="construccion-destacados" className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: cp }}>Stock disponible</p>
              <h2 className="mt-2 text-3xl font-black text-gray-950">Productos destacados</h2>
            </div>
            <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="hidden text-sm font-black text-gray-700 hover:text-black sm:inline-flex">
              Ver todo
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-white" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {destacados.map((producto) => (
                <ProductCardGromuse
                  key={producto.id}
                  producto={producto}
                  slug={slug}
                  diseno={{ ...diseno, colorPrimario: cp }}
                  onAddToCart={agregarAlCarrito}
                  onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {ofertas.length > 0 && (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: cp }}>Promociones reales</p>
                <h2 className="mt-2 text-3xl font-black text-gray-950">Ofertas vigentes</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {ofertas.map((producto) => (
                  <ProductCardGromuse
                    key={producto.id}
                    producto={producto}
                    slug={slug}
                    diseno={{ ...diseno, colorPrimario: cp }}
                    onAddToCart={agregarAlCarrito}
                    onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <ConstruccionFooter tienda={tienda} slug={slug} cp={cp} categories={allCategories} />
      <TecnologiaCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        cp={cp}
        tienda={tienda}
      />
    </div>
  );
}
