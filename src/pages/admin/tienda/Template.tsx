import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfiguracionTiendaViewModel } from '@/features/admin/tienda/useConfiguracionTiendaViewModel';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import { ALL_PLANTILLAS } from '@/components/tienda/resolveTemplate';
import { useAuthStore } from '@/zustand/auth';
import apiClient from '@/utils/apiClient';

const AUTOPARTES_IMAGE_FIELDS = [
  { key: 'autopartesHeroImageUrl', label: 'Hero principal', hint: 'Banner grande superior', fallback: '/assets/autopartes/banner1.png' },
  { key: 'autopartesSideTopImageUrl', label: 'Hero lateral superior', hint: 'Tarjeta derecha superior', fallback: '/assets/autopartes/banner2.png' },
  { key: 'autopartesSideBottomImageUrl', label: 'Hero lateral inferior', hint: 'Tarjeta derecha inferior', fallback: '/assets/autopartes/banner3.png' },
  { key: 'autopartesVehicleImageUrl', label: 'Selector de vehículo', hint: 'Fondo de búsqueda por auto', fallback: '/assets/autopartes/banner4.png' },
  { key: 'autopartesPromoLeftImageUrl', label: 'Promo izquierda', hint: 'Campaña llantas/ruedas', fallback: '/assets/autopartes/llantas.png' },
  { key: 'autopartesPromoRightImageUrl', label: 'Promo derecha', hint: 'Campaña luces/faros', fallback: '/assets/autopartes/luces.png' },
  { key: 'autopartesCommunityImageUrl', label: 'Comunidad', hint: 'Bloque comunidad automotriz', fallback: '/assets/autopartes/comunidad.png' },
  { key: 'autopartesSupportImageUrl', label: 'Asistencia', hint: 'Bloque soporte/asistencia', fallback: '/assets/autopartes/asistencia.png' },
  { key: 'autopartesBrandsImageUrl', label: 'Marcas', hint: 'Banner lateral de marcas', fallback: '/assets/autopartes/marcas.png' },
  { key: 'autopartesProductImageUrl', label: 'Producto destacado', hint: 'Imagen base para ofertas/top selling', fallback: '/assets/autopartes/producto.png' },
  { key: 'autopartesCategoryImageUrl', label: 'Categorías destacadas', hint: 'Imagen circular de categorías', fallback: '/assets/autopartes/producto.png' },
  { key: 'autopartesWidgetOneImageUrl', label: 'Widget 1', hint: 'Tarjeta inferior izquierda', fallback: '/assets/autopartes/widget1.png' },
  { key: 'autopartesWidgetTwoImageUrl', label: 'Widget 2', hint: 'Tarjeta inferior centro', fallback: '/assets/autopartes/widget2.png' },
  { key: 'autopartesWidgetThreeImageUrl', label: 'Widget 3', hint: 'Tarjeta inferior derecha', fallback: '/assets/autopartes/widget3.png' },
];

const URBANO_IMAGE_FIELDS = [
  { key: 'urbanoHeroImg', label: 'Hero Banner', hint: 'Fondo principal', fallback: '/assets/templates/urbano/banner.png' },
  { key: 'urbanoCat1Img', label: 'Categoría 1', hint: 'Primera imagen en split categories', fallback: '/assets/templates/urbano/coleccion5.png' },
  { key: 'urbanoCat2Img', label: 'Categoría 2', hint: 'Segunda imagen', fallback: '/assets/templates/urbano/coleccion6.png' },
  { key: 'urbanoCat3Img', label: 'Categoría 3', hint: 'Tercera imagen', fallback: '/assets/templates/urbano/coleccion7.png' },
  { key: 'urbanoCat4Img', label: 'Categoría 4', hint: 'Cuarta imagen', fallback: '/assets/templates/urbano/coleccion8.png' },
  { key: 'urbanoBottomBannerImg', label: 'Banner Inferior', hint: 'Imagen de fondo', fallback: '/assets/templates/urbano/wear.png' },
  { key: 'urbanoShopTheLookImg', label: 'Compra el look', hint: 'Foto de modelo y outfit', fallback: '/assets/templates/urbano/shoplook.png' },
  { key: 'urbanoFeatureModelImg', label: 'Feature Highlight', hint: 'Foto de contexto', fallback: '/assets/templates/urbano/coleccion9.png' },
  { key: 'urbanoGallery1', label: 'Galería 1', hint: 'Imágenes inferiores 1', fallback: '/assets/templates/urbano/coleccion2.png' },
  { key: 'urbanoGallery2', label: 'Galería 2', hint: 'Imágenes inferiores 2', fallback: '/assets/templates/urbano/coleccion3.png' },
  { key: 'urbanoGallery3', label: 'Galería 3', hint: 'Imágenes inferiores 3', fallback: '/assets/templates/urbano/coleccion4.png' },
  { key: 'urbanoGallery4', label: 'Galería 4', hint: 'Imágenes inferiores 4', fallback: '/assets/templates/urbano/coleccion5.png' },
  { key: 'urbanoGallery5', label: 'Galería 5', hint: 'Imágenes inferiores 5', fallback: '/assets/templates/urbano/coleccion6.png' },
  { key: 'urbanoProductMainImg', label: 'Producto Principal', hint: 'Imagen grande del detalle', fallback: '/assets/templates/urbano/coleccion1.png' },
  { key: 'urbanoProductMacroImg', label: 'Macro Producto', hint: 'Detalle de textura', fallback: '/assets/templates/urbano/coleccion2.png' },
  { key: 'urbanoProductModel1Img', label: 'Modelo Producto 1', hint: 'Producto (Frente)', fallback: '/assets/templates/urbano/coleccion3.png' },
  { key: 'urbanoProductModel2Img', label: 'Modelo Producto 2', hint: 'Producto (Detalle)', fallback: '/assets/templates/urbano/coleccion4.png' },
];

type TemplateDisenoPreview = Record<string, unknown>;

const getPreviewImage = (diseno: TemplateDisenoPreview | undefined, key: string, fallback: string) => {
  const value = diseno?.[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
};

const getPreviewText = (diseno: TemplateDisenoPreview | undefined, key: string, fallback: string) => {
  const value = diseno?.[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
};

function AutopartesTemplatePreview({ diseno }: { diseno: TemplateDisenoPreview | undefined }) {
  const image = (key: string, fallback: string) => getPreviewImage(diseno, key, fallback);

  return (
    <aside className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-slate-950/20 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="rounded-[22px] overflow-hidden bg-[#F8F3EF]">
        <div className="flex items-center justify-between bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Icon icon="solar:wheel-bold" className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950 leading-none">AutoParts</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Preview tienda</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Icon icon="solar:heart-bold" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Icon icon="solar:bag-4-bold" />
            </span>
          </div>
        </div>

        <div className="space-y-3 p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="relative col-span-2 min-h-[174px] overflow-hidden rounded-2xl bg-slate-950">
              <img src={image('autopartesHeroImageUrl', '/assets/autopartes/banner1.png')} alt="Hero principal" className="absolute inset-0 h-full w-full object-cover opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end p-4 text-white">
                <span className="mb-2 w-fit rounded-full bg-red-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest">Nuevo stock</span>
                <h3 className="max-w-[180px] text-2xl font-black leading-none">
                  {getPreviewText(diseno, 'heroTitle', 'Repuestos de Alto Rendimiento')}
                </h3>
                <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-white/75">
                  {getPreviewText(diseno, 'heroSubtitle', 'Encuentra autopartes, accesorios y mantenimiento para tu vehículo.')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative h-[82px] overflow-hidden rounded-2xl bg-slate-900">
                <img src={image('autopartesSideTopImageUrl', '/assets/autopartes/banner2.png')} alt="Hero lateral superior" className="h-full w-full object-cover opacity-80" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-slate-900">Llantas</span>
              </div>
              <div className="relative h-[82px] overflow-hidden rounded-2xl bg-slate-900">
                <img src={image('autopartesSideBottomImageUrl', '/assets/autopartes/banner3.png')} alt="Hero lateral inferior" className="h-full w-full object-cover opacity-80" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-slate-900">Faros</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white p-3">
            <img src={image('autopartesVehicleImageUrl', '/assets/autopartes/banner4.png')} alt="Selector de vehículo" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-25" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Busca por vehículo</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {['Marca', 'Modelo', 'Año'].map(item => (
                  <span key={item} className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative h-24 overflow-hidden rounded-2xl bg-red-950">
              <img src={image('autopartesPromoLeftImageUrl', '/assets/autopartes/llantas.png')} alt="Promo izquierda" className="h-full w-full object-cover opacity-80" />
              <span className="absolute bottom-2 left-2 text-xs font-black text-white">Promo ruedas</span>
            </div>
            <div className="relative h-24 overflow-hidden rounded-2xl bg-slate-950">
              <img src={image('autopartesPromoRightImageUrl', '/assets/autopartes/luces.png')} alt="Promo derecha" className="h-full w-full object-cover opacity-80" />
              <span className="absolute bottom-2 left-2 text-xs font-black text-white">Luces y faros</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ['autopartesProductImageUrl', '/assets/autopartes/producto.png', 'Oferta'],
              ['autopartesCategoryImageUrl', '/assets/autopartes/producto.png', 'Categoría'],
              ['autopartesBrandsImageUrl', '/assets/autopartes/marcas.png', 'Marcas'],
            ].map(([key, fallback, label]) => (
              <div key={key} className="rounded-2xl bg-white p-2">
                <div className="h-16 overflow-hidden rounded-xl bg-slate-100">
                  <img src={image(key, fallback)} alt={label} className="h-full w-full object-cover" />
                </div>
                <p className="mt-1 text-center text-[10px] font-black text-slate-700">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { imgKey: 'autopartesWidgetOneImageUrl', imgFb: '/assets/autopartes/widget1.png', titleKey: 'widgetOneTitle', titleFb: 'Llantas y Ruedas', subKey: 'widgetOneSubtitle', subFb: 'Mantente seguro' },
              { imgKey: 'autopartesWidgetTwoImageUrl', imgFb: '/assets/autopartes/widget2.png', titleKey: 'widgetTwoTitle', titleFb: 'ACEITE MOTOR', subKey: 'widgetTwoSubtitle', subFb: 'Rendimiento' },
              { imgKey: 'autopartesWidgetThreeImageUrl', imgFb: '/assets/autopartes/widget3.png', titleKey: 'widgetThreeTitle', titleFb: 'COMPRA 1 LLEVA 1', subKey: 'widgetThreeSubtitle', subFb: '¡Aprovecha!' },
            ].map(({ imgKey, imgFb, titleKey, titleFb, subKey, subFb }, index) => (
              <div key={imgKey} className="relative h-16 overflow-hidden rounded-2xl bg-slate-900 group">
                <img src={image(imgKey, imgFb)} alt={`Widget ${index + 1}`} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 flex h-full flex-col justify-center p-2 text-white">
                  <h4 className="text-[8px] font-black leading-tight line-clamp-1">{getPreviewText(diseno, titleKey, titleFb)}</h4>
                  <p className="text-[6px] font-medium text-gray-300 line-clamp-1 mt-0.5">{getPreviewText(diseno, subKey, subFb)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function UrbanoTemplatePreview({ diseno }: { diseno: TemplateDisenoPreview | undefined }) {
  const image = (key: string) => {
    const fallback = URBANO_IMAGE_FIELDS.find(f => f.key === key)?.fallback || '';
    return getPreviewImage(diseno, key, fallback);
  };
  const text = (key: string, fallback: string) => getPreviewText(diseno, key, fallback);

  return (
    <aside className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white p-3 shadow-2xl shadow-slate-950/10 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="rounded-[22px] overflow-hidden bg-white text-black border border-slate-100">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: '"Impact", sans-serif' }}>URBANO</div>
          <div className="flex gap-2">
            <Icon icon="solar:hamburger-menu-linear" className="text-gray-400" />
          </div>
        </div>

        <div className="p-0">
          {/* 1. Hero Banner */}
          <div className="relative aspect-[4/3] bg-gray-900 flex flex-col items-center justify-end pb-4">
             <img src={image('urbanoHeroImg')} className="absolute inset-0 w-full h-full object-cover opacity-60" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
             <div className="relative z-10 flex flex-col items-center px-2 text-center">
                <span className="text-[5px] text-white/80 font-bold tracking-[0.2em] uppercase mb-1">{text('urbanoHeroSubtitle', 'Nueva colección')}</span>
                <span className="text-[14px] text-white font-black uppercase tracking-tighter leading-none mb-3" style={{ fontFamily: '"Impact", sans-serif' }}>{text('urbanoHeroTitle', 'Estilo urbano para la ciudad')}</span>
                <span className="border border-white text-white text-[4px] font-bold uppercase tracking-widest px-2 py-1">
                   {text('urbanoHeroBtn', '[ VER COLECCIÓN ]')}
                </span>
             </div>
          </div>

          {/* 2. La Colección (Slider) */}
          <div className="p-3 bg-white">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black uppercase" style={{ fontFamily: '"Impact", sans-serif' }}>La Colección</span>
                <div className="flex gap-1"><span className="w-2 h-0.5 bg-gray-200" /><span className="w-2 h-0.5 bg-gray-200" /></div>
             </div>
             <div className="flex gap-2 overflow-hidden">
	                {[1, 2].map((num) => (
	                  <div key={num} className="w-2/3 shrink-0 relative aspect-[4/5] bg-gray-100 flex flex-col p-1">
	                     <div className="w-full flex-1 bg-gray-200 mb-1" />
	                     <div className="w-3/4 h-1 bg-gray-300 mb-0.5" />
	                     <div className="w-1/2 h-1 bg-gray-200" />
	                  </div>
	                ))}
             </div>
          </div>

          {/* 3. Marquee Central */}
          <div className="w-full py-1.5 border-y border-gray-100 overflow-hidden flex whitespace-nowrap bg-white items-center">
	             <p className="text-[4px] font-bold tracking-[0.2em] text-gray-400 mx-2">{text('urbanoMarqueeText', 'MODA URBANA / NUEVA COLECCIÓN')}</p>
	             <p className="text-[4px] font-bold tracking-[0.2em] text-gray-400 mx-2">{text('urbanoMarqueeText', 'MODA URBANA / NUEVA COLECCIÓN')}</p>
          </div>

          {/* 4. Categorías Split (Nav + Image) */}
          <div className="flex h-24 bg-white border-b border-gray-100">
             <div className="w-1/2 flex flex-col items-end justify-center pr-3 gap-1">
                {[1, 2, 3, 4].map(num => (
                  <span key={num} className={`text-[6px] font-black uppercase ${num === 1 ? 'text-gray-900' : 'text-gray-300'}`}>
	                     {text(`urbanoCat${num}Text`, num === 1 ? 'POLERAS' : num === 2 ? 'PANTALONES' : num === 3 ? 'POLOS' : 'CASACAS')}
                  </span>
                ))}
             </div>
             <div className="w-1/2 bg-[#F4F5F6] relative">
                <img src={image('urbanoCat1Img')} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90" />
             </div>
          </div>

          {/* 5. Bottom Banner */}
          <div className="relative h-20 bg-[#EAEBEC] overflow-hidden flex flex-col items-center justify-center">
             <img src={image('urbanoBottomBannerImg')} className="absolute inset-0 w-full h-full object-cover opacity-80" />
             <span className="relative z-10 text-[9px] font-bold text-white/90 tracking-tighter uppercase mb-2 text-center leading-tight px-2">
	                {text('urbanoBottomBannerText', 'VISTE A TU MANERA.')}
             </span>
             <span className="relative z-10 border border-white/80 bg-white/10 px-2 py-0.5 text-[4px] font-bold text-white uppercase tracking-widest">
	                {text('urbanoBottomBannerBtn', '[ VER COLECCIÓN ]')}
             </span>
          </div>

	          {/* 6. Editorial Row 1: Compra el look */}
          <div className="flex h-24 bg-white border-b border-gray-100">
             <div className="w-1/2 relative bg-white flex items-center justify-center p-1">
                <img src={image('urbanoShopTheLookImg')} className="w-full h-full object-contain" />
             </div>
             <div className="w-1/2 flex flex-col justify-center p-2">
	                <span className="text-[6px] font-black uppercase mb-2">{text('urbanoShopTheLookTitle', 'COMPRA EL LOOK')}</span>
                <div className="flex gap-1">
                   <div className="flex-1 aspect-[4/5] bg-gray-100" />
                   <div className="flex-1 aspect-[4/5] bg-gray-100" />
                </div>
             </div>
          </div>

          {/* 7. Editorial Row 2: Feature Highlight */}
          <div className="flex h-24 bg-white border-b border-gray-100">
             <div className="w-1/2 relative bg-[#F4F5F6] flex items-center justify-center p-2">
	                <span className="absolute top-1 left-1 text-[4px] font-bold text-gray-500 uppercase">{text('urbanoFeatureLabel', 'CASACA')}</span>
                <Icon icon="solar:box-linear" className="text-gray-300 text-2xl" />
             </div>
             <div className="w-1/2 relative bg-[#E8EAEB]">
                <img src={image('urbanoFeatureModelImg')} className="w-full h-full object-cover" />
             </div>
          </div>

          {/* 8. Gallery */}
          <div className="flex bg-[#F4F5F6]">
            {[1, 2, 3, 4, 5].map(num => (
              <div key={`gal-${num}`} className="flex-1 aspect-[4/5] relative border-r border-white/20 last:border-0">
                <img src={image(`urbanoGallery${num}`)} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* 9. Footer */}
          <div className="bg-[#1A1A1A] p-3 text-white">
             <span className="text-[8px] font-black uppercase block mb-1" style={{ fontFamily: '"Impact", sans-serif' }}>BLNK</span>
	             <span className="text-[4px] text-gray-400 block mb-2">{text('urbanoSlogan', 'Moda urbana minimalista para vestir tu día con estilo.')}</span>
             <div className="flex gap-4">
                <div className="w-4 h-1 bg-gray-700" />
                <div className="w-4 h-1 bg-gray-700" />
             </div>
          </div>

        </div>
      </div>
    </aside>
  );
}


export default function TemplateTienda() {
  const vm = useConfiguracionTiendaViewModel();
  const auth = useAuthStore(s => s.auth);
  const rubroNombre = vm.config?.rubro?.nombre || auth?.empresa?.rubro?.nombre || '';
  const rubroId = vm.config?.rubro?.id || (auth as any)?.empresa?.rubroId || (auth as any)?.empresa?.rubro?.id;
  const activePlantillaId = vm.config?.diseno?.plantillaId;
  const [rubroPlantillaId, setRubroPlantillaId] = useState<string | null>(null);
  const [loadingRubroPlantilla, setLoadingRubroPlantilla] = useState(false);
  const syncedRubroTemplateRef = useRef('');

  useEffect(() => {
    let mounted = true;
    if (!rubroId) {
      setRubroPlantillaId(null);
      return;
    }

    setLoadingRubroPlantilla(true);
    apiClient.get(`/diseno-rubro/${rubroId}`)
      .then(({ data }) => {
        if (!mounted) return;
        const payload = data?.data ?? data;
        const plantillaId = typeof payload?.plantillaId === 'string' ? payload.plantillaId : null;
        setRubroPlantillaId(plantillaId);
      })
      .catch(() => {
        if (mounted) setRubroPlantillaId(null);
      })
      .finally(() => {
        if (mounted) setLoadingRubroPlantilla(false);
      });

    return () => { mounted = false; };
  }, [rubroId]);

  useEffect(() => {
    if (!rubroPlantillaId || activePlantillaId === rubroPlantillaId || vm.saving) return;
    const syncKey = `${rubroId || 'sin-rubro'}:${activePlantillaId || 'sin-activa'}:${rubroPlantillaId}`;
    if (syncedRubroTemplateRef.current === syncKey) return;
    syncedRubroTemplateRef.current = syncKey;
    vm.actualizarDiseno({ plantillaId: rubroPlantillaId });
  }, [activePlantillaId, rubroId, rubroPlantillaId, vm]);

  const plantillaAsignadaId = rubroPlantillaId || activePlantillaId;
  const plantillasVisibles = useMemo(() => {
    const asignada = ALL_PLANTILLAS.find(p => p.id === plantillaAsignadaId);
    if (asignada) return [asignada];

    const activa = ALL_PLANTILLAS.find(p => p.id === activePlantillaId);
    if (activa) return [activa];

    const fallback = ALL_PLANTILLAS.find(p => p.id === 'moderna');
    return fallback ? [fallback] : [];
  }, [activePlantillaId, plantillaAsignadaId]);

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-[#0A0D14]">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (!vm.config?.plan?.tieneTienda) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-[#111827] rounded-lg shadow text-center border dark:border-slate-800">
        <Icon icon="mdi:store-off" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Template de tienda no disponible</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Tu plan actual no incluye tienda virtual.</p>
        <Button onClick={() => window.location.href = '/administrador/perfil'}>Ver Planes</Button>
      </div>
    );
  }

  const { formData, saving } = vm;

  return (
    <div className="min-h-screen pb-4 px-2 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon icon="solar:palette-round-bold-duotone" className="text-indigo-600 dark:text-indigo-400" />
            Diseño y Template de Tienda
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza plantilla, banners e imágenes visuales del template.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.href = '/administrador/tienda/configuracion'}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
          >
            <Icon icon="solar:settings-bold" className="text-lg" />
            Config. general
          </button>
          {formData.slugTienda && (
            <button
              type="button"
              onClick={vm.abrirTienda}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Icon icon="solar:shop-2-bold" className="text-lg" />
              Ver mi tienda
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon icon="solar:shop-2-bold-duotone" className="text-xl text-indigo-500" />
            Plantilla de Tienda
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Plantilla asignada desde Diseño de Tiendas para el rubro {rubroNombre ? <strong>{rubroNombre}</strong> : 'de tu empresa'}.
            {loadingRubroPlantilla ? ' Cargando configuración del rubro...' : ' Solo el administrador del sistema puede cambiar esta plantilla base.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plantillasVisibles.map(plantilla => {
              const isOn = (plantillaAsignadaId || activePlantillaId) === plantilla.id;

              return (
                <button
                  key={plantilla.id}
                  type="button"
                  disabled
                  className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col cursor-default
                    ${isOn ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                  {isOn && (
                    <span className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="text-indigo-600 text-sm" />
                    </span>
                  )}

                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: plantilla.accentColor + '18' }}>
                    <Icon icon={plantilla.icon} className="text-xl" style={{ color: plantilla.accentColor }} />
                  </div>
                  
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">{plantilla.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {plantilla.description}
                  </p>
                  <span className="mt-3 w-fit rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                    Asignada por rubro
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {vm.bannerSlots.length > 0 && <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon icon="solar:gallery-bold-duotone" className="text-xl text-[#FF9500]" />
              Banners de Tienda Virtual
            </h3>
            <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold px-3 py-1 rounded-full">
              {vm.banners.length} / {vm.bannerIsSlider ? 3 : 6}
            </span>
          </div>
          <div className="flex items-center justify-between mb-5 p-4 bg-gray-50 dark:bg-slate-900/30 rounded-xl border border-gray-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Icon icon="solar:play-circle-bold-duotone" className="text-[#FF9500]" width={18} />
                Modo carrusel
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {vm.bannerIsSlider
                  ? 'Las imágenes rotan automáticamente como slider (máx. 3 slides)'
                  : 'Layout clásico con hero, tarjetas laterales y banners promo'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => vm.toggleBannerIsSlider(!vm.bannerIsSlider)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vm.bannerIsSlider ? 'bg-[#FF9500]' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${vm.bannerIsSlider ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <>
              <div className="mb-6 bg-[#FFF8F0] dark:bg-[#FF9500]/5 border border-[#FF9500]/20 rounded-2xl p-5">
                <p className="text-sm font-bold text-[#FF9500] mb-3 flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold" width={16} />
                  {vm.bannerIsSlider ? 'Carrusel de slides — se rotan automáticamente en la tienda' : '¿Cómo se usan los banners en la tienda?'}
                </p>

                {vm.bannerIsSlider ? (
                  <div className="space-y-2">
                    {vm.bannerSlots.map((slot: any) => {
                      const uploaded = vm.banners.find((b: any) => b.orden === slot.orden);
                      return (
                        <div key={slot.orden} className="flex items-center gap-3 bg-white dark:bg-[#0A0D14] rounded-xl border border-gray-200 dark:border-slate-800 p-3">
                          <span className="w-7 h-7 rounded-full bg-[#FF9500] text-white text-xs font-black flex items-center justify-center flex-shrink-0">{slot.orden + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{slot.label}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{slot.description} · {slot.recomendado}</p>
                          </div>
                          {uploaded ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <img src={uploaded.imagenUrl} className="w-14 h-9 object-cover rounded-lg border border-gray-200 dark:border-slate-700" alt="" />
                              <div className="flex flex-col gap-1">
                                <button type="button" onClick={() => vm.openEditModal(uploaded)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg p-1 hover:bg-blue-100 transition-colors">
                                  <Icon icon="solar:pen-bold" className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => vm.eliminarBanner(uploaded.id)} className="bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg p-1 hover:bg-red-100 transition-colors">
                                  <Icon icon="mdi:delete" className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">Sin imagen</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                    {vm.bannerSlots.map((slot: any) => (
                      <div key={slot.orden} className="bg-white dark:bg-[#0A0D14] rounded-lg border border-gray-100 dark:border-slate-800 p-2">
                        <p className="font-black text-gray-800 dark:text-white text-[11px]">Orden {slot.orden} — {slot.label}</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">{slot.description}</p>
                        <p className="text-[#FF9500] font-medium mt-1">📐 {slot.recomendado}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {vm.loadingBanners ? (
                <div className="flex items-center justify-center py-12">
                  <Icon icon="eos-icons:loading" className="w-8 h-8 text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {!vm.bannerIsSlider && vm.banners.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {[...vm.banners].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)).map((banner, index) => {
                        const slot = vm.bannerSlots.find((s: any) => s.orden === banner.orden);
                        const label = slot?.label || `Banner ${index + 1}`;
                        return (
                          <div key={banner.id} className="relative group">
                            <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-slate-800 aspect-video">
                              <img src={banner.imagenUrl} alt={banner.titulo || label} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute top-2 left-2 bg-[#FF9500] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                              {label}
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => vm.openEditModal(banner)} className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full p-1.5 shadow-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                                <Icon icon="solar:pen-bold" className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => vm.eliminarBanner(banner.id)} className="bg-white dark:bg-slate-800 text-red-500 rounded-full p-1.5 shadow-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors">
                                <Icon icon="mdi:delete" className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="mt-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate px-1">{banner.titulo || label}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {vm.editingBanner && (
                    <div className="fixed inset-0 z-50 top-[-30px] flex items-center justify-center bg-black/60 p-4">
                      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] border dark:border-slate-800">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-bold dark:text-white">Editar Banner</h3>
                          <button type="button" onClick={() => vm.setEditingBanner(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400">
                            <Icon icon="mdi:close" width={20} />
                          </button>
                        </div>

                        <div className="mb-4 bg-[#FFF8F0] dark:bg-[#FF9500]/5 border border-[#FF9500]/20 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-400">
                          <Icon icon="solar:info-circle-bold" className="inline text-[#FF9500] mr-1" width={14} />
                          {vm.bannerSlots.find((s: any) => s.orden === vm.editingBanner.orden)?.description || `Orden ${vm.editingBanner.orden}`}
                          {' · '}
                          <strong>{vm.bannerSlots.find((s: any) => s.orden === vm.editingBanner.orden)?.recomendado}</strong>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen del Banner</label>
                            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-800 hover:border-[#FF9500] transition-colors cursor-pointer bg-gray-50 dark:bg-slate-900/50 flex items-center justify-center group/edit-img">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => vm.setEditBannerFile(e.target.files?.[0] || null)} />
                              {vm.editBannerFile ? (
                                <img src={URL.createObjectURL(vm.editBannerFile)} className="w-full h-full object-cover" alt="Preview" />
                              ) : vm.editingBanner.imagenUrl ? (
                                <img src={vm.editingBanner.imagenUrl} className="w-full h-full object-cover" alt="Current" />
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">Clic para subir imagen</span>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity pointer-events-none">
                                <Icon icon="solar:camera-bold" className="text-white text-3xl" />
                              </div>
                            </div>
                            {vm.editBannerFile && <p className="text-xs text-green-600 mt-1">✓ Nueva imagen: {vm.editBannerFile.name}</p>}
                          </div>

                          <InputPro label="Título (Opcional)" name="titulo" value={vm.editBannerTitle} onChange={(e: any) => vm.setEditBannerTitle(e.target.value)} placeholder="Ej: Gran Liquidación" />
                          <InputPro label="Subtítulo (Opcional)" name="subtitulo" value={vm.editBannerSubtitle} onChange={(e: any) => vm.setEditBannerSubtitle(e.target.value)} placeholder="Ej: Hasta 50% de descuento" />

                          <div className="relative">
                            <InputPro label="Enlace (URL o ruta)" name="link" value={vm.editBannerLink} onChange={(e: any) => vm.setEditBannerLink(e.target.value)} placeholder="/tienda/producto/xyz" />
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 mb-1">O vincula al catálogo por categoría:</label>
                            <select
                              value=""
                              onChange={(e) => { const v = e.target.value; if (!v) return; vm.setEditBannerLink(vm.generarLinkCatalogoCategoria(v)); e.currentTarget.value = ''; }}
                              className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-[#FF9500] focus:border-[#FF9500] dark:text-white"
                            >
                              <option value="">Seleccionar categoría...</option>
                              {vm.storeCategories.map((cat: any, idx: number) => {
                                const name = vm.getCategoryLabel(cat);
                                if (!name) return null;
                                return <option key={`${name}-${idx}`} value={name}>{name}</option>;
                              })}
                            </select>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 mb-1">O busca un producto:</label>
                            <input
                              type="text"
                              value={vm.editSearch}
                              onChange={(e) => vm.setEditSearch(e.target.value)}
                              placeholder="Buscar producto..."
                              className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-[#FF9500] focus:border-[#FF9500] dark:text-white"
                            />
                            {vm.editSearch.length > 2 && (
                              <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-xl rounded-b-xl z-10 max-h-48 overflow-y-auto mt-1">
                                {vm.searchingEdit ? (
                                  <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">Buscando...</div>
                                ) : vm.editResults.length > 0 ? (
                                  vm.editResults.map((p: any) => (
                                    <div key={p.id} onClick={() => { vm.setEditBannerLink(`/tienda/${formData.slugTienda}/producto/${p.slug || p.id}`); vm.setEditSearch(''); }} className="p-3 hover:bg-[#FFF8F0] dark:hover:bg-slate-800 cursor-pointer text-sm border-b dark:border-slate-800 last:border-0 flex items-center gap-3">
                                      {p.imagenUrl && <img src={p.imagenUrl} className="w-8 h-8 object-contain rounded" alt="" />}
                                      <div>
                                        <div className="font-medium truncate dark:text-white">{p.descripcion}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">S/ {p.precioUnitario}</div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 text-center text-xs text-gray-500">Sin resultados</div>
                                )}
                              </div>
                            )}
                          </div>

                          {!vm.bannerIsSlider && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orden / Posición</label>
                              <select
                                value={vm.editBannerOrden}
                                onChange={(e) => vm.setEditBannerOrden(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-[#FF9500] focus:border-[#FF9500] text-sm dark:text-white"
                              >
                                <option value="">Sin orden</option>
                                {vm.bannerSlots.map((slot: any) => (
                                  <option key={slot.orden} value={slot.orden}>{slot.orden} — {slot.label} ({slot.recomendado})</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                          <Button type="button" color="secondary" onClick={() => vm.setEditingBanner(null)}>Cancelar</Button>
                          <Button type="button" onClick={vm.handleUpdateBanner} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {vm.canUploadBanner && (
                    <div className="bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                        {vm.bannerIsSlider ? `Agregar slide (${vm.banners.length} / 3)` : 'Subir Nuevo Banner'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {vm.bannerIsSlider
                          ? `Se asignará como Slide ${vm.banners.length + 1}. Recomendado: ${vm.bannerSlots[0]?.recomendado || '1400×500px'}`
                          : 'Elige el orden según la posición que quieres en la tienda (ver guía arriba)'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <InputPro label="Título (Opcional)" name="tituloNew" value={vm.newBannerTitle} onChange={(e: any) => vm.setNewBannerTitle(e.target.value)} placeholder="Ej: Ofertas Especiales" />
                        <InputPro label="Subtítulo (Opcional)" name="subtituloNew" value={vm.newBannerSubtitle} onChange={(e: any) => vm.setNewBannerSubtitle(e.target.value)} placeholder="Ej: Hasta 50% off" />

                        {!vm.bannerIsSlider && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orden / Posición</label>
                            <select
                              value={vm.newBannerOrden}
                              onChange={(e: any) => vm.setNewBannerOrden(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-[#FF9500] focus:border-[#FF9500] text-sm dark:text-white"
                            >
                              <option value="">Automático</option>
                              {vm.bannerSlots.map((slot: any) => (
                                <option key={slot.orden} value={slot.orden}>{slot.orden} — {slot.label} ({slot.recomendado})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace (Opcional)</label>
                          <input
                            type="text"
                            value={vm.newBannerLink}
                            onChange={(e: any) => vm.setNewBannerLink(e.target.value)}
                            placeholder="/tienda/mi-tienda/producto/123"
                            className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-[#FF9500] focus:border-[#FF9500] dark:text-white"
                          />
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 mb-1">O por categoría:</label>
                          <select
                            value=""
                            onChange={(e) => { const v = e.target.value; if (!v) return; vm.setNewBannerLink(vm.generarLinkCatalogoCategoria(v)); e.currentTarget.value = ''; }}
                            className="w-full text-sm rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-[#FF9500] focus:border-[#FF9500] dark:text-white"
                          >
                            <option value="">Seleccionar categoría...</option>
                            {vm.storeCategories.map((cat: any, idx: number) => {
                              const name = vm.getCategoryLabel(cat);
                              if (!name) return null;
                              return <option key={`${name}-${idx}`} value={name}>{name}</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div className="relative mb-4">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">O busca un producto para el enlace:</label>
                        <input
                          type="text"
                          value={vm.productSearch}
                          onChange={(e) => vm.setProductSearch(e.target.value)}
                          placeholder="Buscar producto..."
                          className="w-full text-sm border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] rounded-lg focus:ring-[#FF9500] focus:border-[#FF9500] dark:text-white"
                        />
                        {vm.productSearch.length > 2 && (
                          <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-xl rounded-b-xl z-10 max-h-48 overflow-y-auto mt-1">
                            {vm.searchingProducts ? (
                              <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">Buscando...</div>
                            ) : vm.productResults.length > 0 ? (
                              vm.productResults.map((p: any) => (
                                <div key={p.id} onClick={() => { vm.setNewBannerLink(`/tienda/${formData.slugTienda}/producto/${p.slug || p.id}`); vm.setProductSearch(''); }} className="p-3 hover:bg-[#FFF8F0] dark:hover:bg-slate-800 cursor-pointer text-sm border-b dark:border-slate-800 last:border-0 flex items-center gap-3">
                                  {p.imagenUrl && <img src={p.imagenUrl} className="w-8 h-8 object-contain rounded" alt="" />}
                                  <div>
                                    <div className="font-medium truncate dark:text-white">{p.descripcion}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">S/ {p.precioUnitario}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">Sin resultados</div>
                            )}
                          </div>
                        )}
                      </div>

                      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-xl cursor-pointer bg-white dark:bg-slate-900/50 hover:bg-[#FFF8F0] dark:hover:bg-[#FF9500]/10 hover:border-[#FF9500] transition-colors">
                        <div className="flex flex-col items-center justify-center py-4">
                          {vm.uploadingBanner ? (
                            <>
                              <Icon icon="eos-icons:loading" className="w-10 h-10 text-[#FF9500] mb-2 animate-spin" />
                              <p className="text-sm text-gray-500 font-semibold">Subiendo...</p>
                            </>
                          ) : (
                            <>
                              <Icon icon="solar:cloud-upload-bold-duotone" className="w-10 h-10 text-gray-400 dark:text-gray-600 mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-bold">Clic para subir</span> o arrastra la imagen</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG o WEBP · máx 2.5MB</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={vm.handleBannerFileChange} disabled={vm.uploadingBanner} />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </>
        </div>}
        {vm.config?.diseno?.plantillaId === 'autopartes' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Icon icon="solar:wheel-bold" className="text-xl text-red-600" />
              Configuración Especial Autopartes
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b dark:border-slate-800 pb-2">Hero Section</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro 
                    label="Título del Banner Principal" 
                    name="heroTitle" 
                    value={vm.config?.diseno?.heroTitle || ''} 
                    onChange={(e: any) => vm.actualizarDisenoTexto({ heroTitle: e.target.value })} 
                    placeholder="Catálogo de Productos" 
                    isLabel
                  />
                  <InputPro 
                    label="Subtítulo del Banner Principal" 
                    name="heroSubtitle" 
                    value={vm.config?.diseno?.heroSubtitle || ''} 
                    onChange={(e: any) => vm.actualizarDisenoTexto({ heroSubtitle: e.target.value })} 
                    placeholder="Encuentra los mejores repuestos..." 
                    isLabel
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b dark:border-slate-800 pb-2">Sección Comunidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro 
                    label="Título de la Comunidad" 
                    name="comunidadTitle" 
                    value={vm.config?.diseno?.comunidadTitle || ''} 
                    onChange={(e: any) => vm.actualizarDisenoTexto({ comunidadTitle: e.target.value })} 
                    placeholder="Sé parte de nuestra comunidad" 
                    isLabel
                  />
                  <InputPro 
                    label="Texto descriptivo" 
                    name="comunidadText" 
                    value={vm.config?.diseno?.comunidadText || ''} 
                    onChange={(e: any) => vm.actualizarDisenoTexto({ comunidadText: e.target.value })} 
                    placeholder="Únete para ofertas exclusivas" 
                    isLabel
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b dark:border-slate-800 pb-2">Widgets Promocionales (Inferior)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <InputPro label="Widget 1: Título" name="widgetOneTitle" value={vm.config?.diseno?.widgetOneTitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ widgetOneTitle: e.target.value })} placeholder="Llantas y Ruedas" isLabel />
                  <InputPro label="Widget 1: Subtítulo" name="widgetOneSubtitle" value={vm.config?.diseno?.widgetOneSubtitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ widgetOneSubtitle: e.target.value })} placeholder="¡Mantente seguro en la Vía!" isLabel />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <InputPro label="Widget 2: Título" name="widgetTwoTitle" value={vm.config?.diseno?.widgetTwoTitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ widgetTwoTitle: e.target.value })} placeholder="ACEITE MOTOR" isLabel />
                  <InputPro label="Widget 2: Subtítulo" name="widgetTwoSubtitle" value={vm.config?.diseno?.widgetTwoSubtitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ widgetTwoSubtitle: e.target.value })} placeholder="¡Rendimiento Suave!" isLabel />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputPro label="Widget 3: Título" name="widgetThreeTitle" value={vm.config?.diseno?.widgetThreeTitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ widgetThreeTitle: e.target.value })} placeholder="COMPRA 1 LLEVA 1!" isLabel />
                  <InputPro label="Widget 3: Subtítulo" name="widgetThreeSubtitle" value={vm.config?.diseno?.widgetThreeSubtitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ widgetThreeSubtitle: e.target.value })} placeholder="¡Aprovecha ahora!" isLabel />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 border-b dark:border-slate-800 pb-2 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Imágenes del template</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sube una imagen para reemplazar el asset por defecto de cada bloque visual.
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    Autopartes
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-6 items-start">
                  <div className="flex flex-col gap-4">
                    {(() => {
                      const renderUploader = (fieldKey: string, extraClasses = "") => {
                        const field = AUTOPARTES_IMAGE_FIELDS.find(f => f.key === fieldKey);
                        if (!field) return null;
                        
                        const value = vm.config?.diseno?.[field.key] || '';
                        const preview = value || field.fallback;
                        
                        return (
                          <div key={field.key} className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm group min-h-[160px] flex flex-col justify-between ${extraClasses}`}>
                            <img src={preview} alt={field.label} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                            
                            {/* Overlay para oscurecer la imagen y permitir leer los controles */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/80 transition-opacity duration-300 pointer-events-none" />

                            {/* Controles de Subida superpuestos */}
                            <div className="relative z-20 flex flex-col h-full justify-between p-3">
                              {/* Header: Label + Hint */}
                              <div>
                                <p className="text-xs font-black text-white drop-shadow-md">{field.label}</p>
                                <p className="text-[9px] text-gray-300 drop-shadow-md line-clamp-1">{field.hint}</p>
                              </div>

                              {/* Center: Overlays Visuales (si aplica) */}
                              <div className="flex-1 flex flex-col justify-center items-center pointer-events-none">
                                {field.key === 'autopartesHeroImageUrl' && (
                                  <h4 className="text-[10px] font-black text-white/50 text-center line-clamp-2 px-4">{vm.config?.diseno?.heroTitle || 'Repuestos de Alto Rendimiento'}</h4>
                                )}
                                {field.key === 'autopartesSideTopImageUrl' && (
                                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black text-white">Llantas</span>
                                )}
                                {field.key === 'autopartesSideBottomImageUrl' && (
                                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black text-white">Faros</span>
                                )}
                                {field.key === 'autopartesPromoLeftImageUrl' && (
                                  <span className="text-[10px] font-black text-white/50">Promo ruedas</span>
                                )}
                                {field.key === 'autopartesPromoRightImageUrl' && (
                                  <span className="text-[10px] font-black text-white/50">Luces y faros</span>
                                )}
                                {field.key === 'autopartesWidgetOneImageUrl' && (
                                  <div className="text-center">
                                    <h4 className="text-[9px] font-black text-white/60">{vm.config?.diseno?.widgetOneTitle || 'Llantas y Ruedas'}</h4>
                                    <p className="text-[7px] font-medium text-white/40">{vm.config?.diseno?.widgetOneSubtitle || '¡Mantente seguro en la Vía!'}</p>
                                  </div>
                                )}
                                {field.key === 'autopartesWidgetTwoImageUrl' && (
                                  <div className="text-center">
                                    <h4 className="text-[9px] font-black text-white/60">{vm.config?.diseno?.widgetTwoTitle || 'ACEITE MOTOR'}</h4>
                                    <p className="text-[7px] font-medium text-white/40">{vm.config?.diseno?.widgetTwoSubtitle || '¡Rendimiento Suave!'}</p>
                                  </div>
                                )}
                                {field.key === 'autopartesWidgetThreeImageUrl' && (
                                  <div className="text-center">
                                    <h4 className="text-[9px] font-black text-white/60">{vm.config?.diseno?.widgetThreeTitle || 'COMPRA 1 LLEVA 1!'}</h4>
                                    <p className="text-[7px] font-medium text-white/40">{vm.config?.diseno?.widgetThreeSubtitle || '¡Aprovecha ahora!'}</p>
                                  </div>
                                )}
                              </div>

                              {/* Footer: Botón de Subida y URL */}
                              <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/95 backdrop-blur-sm px-2 py-1.5 text-[10px] font-black text-red-600 transition-colors hover:bg-white shadow-lg">
                                  {vm.uploadingTemplateImageField === field.key ? (
                                    <>
                                      <Icon icon="eos-icons:loading" className="animate-spin text-sm" />
                                      Subiendo...
                                    </>
                                  ) : (
                                    <>
                                      <Icon icon="solar:cloud-upload-bold-duotone" className="text-sm" />
                                      Subir imagen
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    disabled={vm.uploadingTemplateImageField === field.key}
                                    onChange={(event) => {
                                      const file = event.currentTarget.files?.[0];
                                      if (file) vm.subirImagenTemplate(field.key, file);
                                      event.currentTarget.value = '';
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  defaultValue={value}
                                  onBlur={(event) => {
                                    const nextValue = event.currentTarget.value.trim();
                                    if (nextValue !== value) vm.actualizarDiseno({ [field.key]: nextValue || null });
                                  }}
                                  className="w-full rounded-lg bg-black/40 border border-white/20 px-2 py-1.5 text-[9px] text-white placeholder-gray-300 shadow-inner focus:border-white focus:outline-none focus:ring-1 focus:ring-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:bg-black/80"
                                  placeholder="O pega una URL..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderUploader('autopartesHeroImageUrl', 'md:col-span-2')}
                            <div className="flex flex-col gap-4">
                              {renderUploader('autopartesSideTopImageUrl', 'flex-1')}
                              {renderUploader('autopartesSideBottomImageUrl', 'flex-1')}
                            </div>
                          </div>
                          
                          {renderUploader('autopartesVehicleImageUrl')}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderUploader('autopartesPromoLeftImageUrl')}
                            {renderUploader('autopartesPromoRightImageUrl')}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderUploader('autopartesProductImageUrl')}
                            {renderUploader('autopartesCategoryImageUrl')}
                            {renderUploader('autopartesBrandsImageUrl')}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderUploader('autopartesWidgetOneImageUrl')}
                            {renderUploader('autopartesWidgetTwoImageUrl')}
                            {renderUploader('autopartesWidgetThreeImageUrl')}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderUploader('autopartesCommunityImageUrl')}
                            {renderUploader('autopartesSupportImageUrl')}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="xl:sticky xl:top-6 self-start">
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-950/50 dark:bg-indigo-950/20">
                      <div>
                        <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">Preview en vivo</p>
                        <p className="text-xs font-medium text-indigo-500/80 dark:text-indigo-300/70">Así se irá viendo la tienda virtual.</p>
                      </div>
                      <Icon icon="solar:monitor-smartphone-bold-duotone" className="text-2xl text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <AutopartesTemplatePreview diseno={vm.config?.diseno} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vm.config?.diseno?.plantillaId === 'urbano' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Icon icon="solar:t-shirt-bold" className="text-xl text-black dark:text-white" />
              Configuración Especial Urbano
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b dark:border-slate-800 pb-2">Textos Principales</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
	                  <InputPro label="Hero Subtítulo" name="urbanoHeroSubtitle" value={vm.config?.diseno?.urbanoHeroSubtitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoHeroSubtitle: e.target.value })} placeholder="Nueva colección" isLabel />
	                  <InputPro label="Hero Título" name="urbanoHeroTitle" value={vm.config?.diseno?.urbanoHeroTitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoHeroTitle: e.target.value })} placeholder="Estilo urbano para la ciudad" isLabel />
	                  <InputPro label="Hero Botón" name="urbanoHeroBtn" value={vm.config?.diseno?.urbanoHeroBtn || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoHeroBtn: e.target.value })} placeholder="[ VER COLECCIÓN ]" isLabel />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
	                  <InputPro label="Categoría 1" name="urbanoCat1Text" value={vm.config?.diseno?.urbanoCat1Text || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoCat1Text: e.target.value })} placeholder="POLERAS" isLabel />
	                  <InputPro label="Categoría 2" name="urbanoCat2Text" value={vm.config?.diseno?.urbanoCat2Text || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoCat2Text: e.target.value })} placeholder="PANTALONES" isLabel />
	                  <InputPro label="Categoría 3" name="urbanoCat3Text" value={vm.config?.diseno?.urbanoCat3Text || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoCat3Text: e.target.value })} placeholder="POLOS" isLabel />
	                  <InputPro label="Categoría 4" name="urbanoCat4Text" value={vm.config?.diseno?.urbanoCat4Text || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoCat4Text: e.target.value })} placeholder="CASACAS" isLabel />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
	                  <InputPro label="Marquesina Central" name="urbanoMarqueeText" value={vm.config?.diseno?.urbanoMarqueeText || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoMarqueeText: e.target.value })} placeholder="MODA URBANA / NUEVA COLECCIÓN..." isLabel />
	                  <InputPro label="Título Compra el Look" name="urbanoShopTheLookTitle" value={vm.config?.diseno?.urbanoShopTheLookTitle || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoShopTheLookTitle: e.target.value })} placeholder="COMPRA EL LOOK" isLabel />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
	                  <InputPro label="Marquesina Inferior" name="urbanoBottomBannerText" value={vm.config?.diseno?.urbanoBottomBannerText || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoBottomBannerText: e.target.value })} placeholder="VISTE A TU MANERA." isLabel />
	                  <InputPro label="Botón Banner Inferior" name="urbanoBottomBannerBtn" value={vm.config?.diseno?.urbanoBottomBannerBtn || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoBottomBannerBtn: e.target.value })} placeholder="[ VER COLECCIÓN ]" isLabel />
	                  <InputPro label="Etiqueta Producto Macro" name="urbanoFeatureLabel" value={vm.config?.diseno?.urbanoFeatureLabel || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoFeatureLabel: e.target.value })} placeholder="CASACA" isLabel />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
	                  <InputPro label="Slogan Footer" name="urbanoSlogan" value={vm.config?.diseno?.urbanoSlogan || ''} onChange={(e: any) => vm.actualizarDisenoTexto({ urbanoSlogan: e.target.value })} placeholder="Moda urbana minimalista para vestir tu día con estilo." isLabel />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 border-b dark:border-slate-800 pb-2 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Imágenes del template</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sube una imagen para reemplazar el asset por defecto de cada bloque visual.
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                    Urbano
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                  <div className="flex flex-col gap-4">
                    {(() => {
                      const renderUploader = (fieldKey: string, extraClasses = "") => {
                        const field = URBANO_IMAGE_FIELDS.find(f => f.key === fieldKey);
                        if (!field) return null;
                        
                        const value = vm.config?.diseno?.[field.key] || '';
                        const preview = value || field.fallback;
                        
                        return (
                          <div key={field.key} className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm group min-h-[160px] flex flex-col justify-between ${extraClasses}`}>
                            <img src={preview} alt={field.label} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/80 transition-opacity duration-300 pointer-events-none" />

                            <div className="relative z-20 flex flex-col h-full justify-between p-3">
                              <div>
                                <p className="text-xs font-black text-white drop-shadow-md">{field.label}</p>
                                <p className="text-[9px] text-gray-300 drop-shadow-md line-clamp-1">{field.hint}</p>
                              </div>

                              <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/95 backdrop-blur-sm px-2 py-1.5 text-[10px] font-black text-black transition-colors hover:bg-white shadow-lg">
                                  {vm.uploadingTemplateImageField === field.key ? (
                                    <>
                                      <Icon icon="eos-icons:loading" className="animate-spin text-sm" />
                                      Subiendo...
                                    </>
                                  ) : (
                                    <>
                                      <Icon icon="solar:cloud-upload-bold-duotone" className="text-sm" />
                                      Subir imagen
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    disabled={vm.uploadingTemplateImageField === field.key}
                                    onChange={(event) => {
                                      const file = event.currentTarget.files?.[0];
                                      if (file) vm.subirImagenTemplate(field.key, file);
                                      event.currentTarget.value = '';
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  defaultValue={value}
                                  onBlur={(event) => {
                                    const nextValue = event.currentTarget.value.trim();
                                    if (nextValue !== value) vm.actualizarDiseno({ [field.key]: nextValue || null });
                                  }}
                                  className="w-full rounded-lg bg-black/40 border border-white/20 px-2 py-1.5 text-[9px] text-white placeholder-gray-300 shadow-inner focus:border-white focus:outline-none focus:ring-1 focus:ring-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:bg-black/80"
                                  placeholder="O pega una URL..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {/* --- SECCIÓN: HOME PAGE --- */}
                          <div className="flex flex-col gap-4">
                            <div className="border-b border-gray-800 pb-2 mb-2">
	                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Página principal</h5>
                            </div>

                            {/* Hero */}
                            {renderUploader('urbanoHeroImg', 'min-h-[220px]')}

	                            {/* Categorías Split */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {renderUploader('urbanoCat1Img')}
                              {renderUploader('urbanoCat2Img')}
                              {renderUploader('urbanoCat3Img')}
                              {renderUploader('urbanoCat4Img')}
                            </div>

                            {/* Bottom Banner */}
                            {renderUploader('urbanoBottomBannerImg')}

	                            {/* Compra el look y modelo destacado */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {renderUploader('urbanoShopTheLookImg')}
                              {renderUploader('urbanoFeatureModelImg')}
                            </div>

                            {/* Gallery */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {renderUploader('urbanoGallery1')}
                              {renderUploader('urbanoGallery2')}
                              {renderUploader('urbanoGallery3')}
                              {renderUploader('urbanoGallery4')}
                              {renderUploader('urbanoGallery5')}
                            </div>
                          </div>

                          {/* --- SECCIÓN: PÁGINA DE PRODUCTO --- */}
                          <div className="flex flex-col gap-4 mt-8">
                            <div className="border-b border-gray-800 pb-2 mb-2">
                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalle de Producto</h5>
                            </div>

                            {/* Imagen Principal del Detalle */}
                            {renderUploader('urbanoProductMainImg', 'min-h-[220px]')}

                            {/* Detalles Producto */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {renderUploader('urbanoProductMacroImg')}
                              {renderUploader('urbanoProductModel1Img')}
                              {renderUploader('urbanoProductModel2Img')}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* PREVIEW LATERAL FIJO */}
                  <div className="xl:sticky xl:top-6 self-start">
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-950/50 dark:bg-indigo-950/20">
                      <div>
                        <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">Preview en vivo</p>
                        <p className="text-xs font-medium text-indigo-500/80 dark:text-indigo-300/70">Así se irá viendo la tienda virtual.</p>
                      </div>
                      <Icon icon="solar:monitor-smartphone-bold-duotone" className="text-2xl text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <UrbanoTemplatePreview diseno={vm.config?.diseno} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
