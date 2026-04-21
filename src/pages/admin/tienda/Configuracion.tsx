import { useConfiguracionTiendaViewModel } from '@/features/admin/tienda/useConfiguracionTiendaViewModel';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import ModalConfirm from '@/components/ModalConfirm';

export default function ConfiguracionTienda() {
  const vm = useConfiguracionTiendaViewModel();

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (!vm.config?.plan?.tieneTienda) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-lg shadow text-center">
        <Icon icon="mdi:store-off" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tienda Virtual no disponible</h2>
        <p className="text-gray-600 mb-6">Tu plan actual no incluye tienda virtual. Actualiza tu plan para activar esta funcionalidad.</p>
        <Button onClick={() => window.location.href = '/administrador/perfil'}>Ver Planes</Button>
      </div>
    );
  }

  const { formData, handleChange, handleSubmit, saving } = vm;

  return (
    <div className="min-h-screen pb-4 px-2">
      <ModalConfirm
        isOpenModal={vm.showConfirmDelete}
        setIsOpenModal={vm.setShowConfirmDelete}
        confirmSubmit={vm.confirmarEliminarQr}
        title={`Eliminar QR de ${vm.deleteQrType?.toUpperCase() || ''}`}
        information={`¿Estás seguro de que deseas eliminar el código QR de ${vm.deleteQrType?.toUpperCase() || ''}?`}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración de Tienda Virtual</h1>
          <p className="text-sm text-gray-500 mt-1">Personaliza tu tienda online: logo, banners, pagos y más</p>
        </div>
        {formData.slugTienda && (
          <Button onClick={vm.abrirTienda} color="secondary" className="flex items-center gap-2">
            <Icon icon="solar:shop-2-bold" />Ver mi tienda
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Información Básica ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Icon icon="solar:info-circle-bold-duotone" className="text-xl text-blue-500" />
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputPro label="Nombre de la tienda (URL)" name="slugTienda" value={formData.slugTienda} onChange={handleChange} placeholder="mi-negocio" />
              <p className="mt-1 text-xs text-gray-500">Solo letras minúsculas, números y guiones.</p>
            </div>
            <InputPro label="WhatsApp" name="whatsappTienda" value={formData.whatsappTienda} onChange={handleChange} placeholder="+51 999 999 999" />
            <div className="md:col-span-2">
              <InputPro label="Descripción" name="descripcionTienda" value={formData.descripcionTienda} onChange={handleChange} placeholder="Breve descripción de tu negocio" type="textarea" rows={3} isLabel />
            </div>
            <InputPro label="Horario de atención" name="horarioAtencion" value={formData.horarioAtencion} onChange={handleChange} />
          </div>
        </div>

        {/* ── Logo de Tienda ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Icon icon="solar:image-bold-duotone" className="text-xl text-[#FF9500]" />
            Logo de Tienda
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Aparece en el <strong>encabezado</strong> de tu tienda virtual junto al nombre. Recomendado: 200×200px, fondo transparente (PNG).
          </p>

          <div className="flex items-start gap-6 flex-wrap">
            {/* Preview actual */}
            <div className="flex-shrink-0">
              {vm.previewLogoUrl ? (
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl border-2 border-[#FF9500]/30 bg-[#FAF6F1] flex items-center justify-center overflow-hidden">
                    <img src={vm.previewLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                  </div>
                  <button
                    type="button"
                    onClick={vm.eliminarLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-1">Logo actual</p>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                  <Icon icon="solar:shop-bold" className="text-3xl text-gray-300" />
                  <p className="text-[10px] text-gray-400">Sin logo</p>
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex-1 min-w-[220px]">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-[#FFF3E0] hover:border-[#FF9500] transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => vm.setLogoFile(e.target.files?.[0] || null)}
                />
                {vm.logoFile ? (
                  <div className="flex flex-col items-center gap-1">
                    <img src={URL.createObjectURL(vm.logoFile)} className="h-16 object-contain" alt="preview" />
                    <p className="text-xs text-[#FF9500] font-medium truncate max-w-[180px]">{vm.logoFile.name}</p>
                  </div>
                ) : (
                  <>
                    <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 mb-1" />
                    <p className="text-sm text-gray-500"><span className="font-semibold">Clic para elegir</span> logo</p>
                    <p className="text-xs text-gray-400">PNG, JPG, SVG · máx 2.5MB</p>
                  </>
                )}
              </label>
              <Button
                type="button"
                onClick={vm.subirLogo}
                disabled={vm.logoUploading || !vm.logoFile}
                className="w-full mt-3"
                color="secondary"
              >
                {vm.logoUploading ? (
                  <span className="flex items-center gap-2"><Icon icon="eos-icons:loading" className="animate-spin" /> Subiendo...</span>
                ) : 'Subir Logo'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Redes Sociales ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Icon icon="solar:share-circle-bold-duotone" className="text-xl text-purple-500" />
            Redes Sociales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputPro label="Facebook" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} placeholder="https://facebook.com/tu-pagina" />
            <InputPro label="Instagram" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} placeholder="https://instagram.com/tu-cuenta" />
            <InputPro label="TikTok" name="tiktokUrl" value={formData.tiktokUrl} onChange={handleChange} placeholder="https://tiktok.com/@tu-cuenta" />
          </div>
        </div>

        {/* ── Medios de Pago ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Icon icon="solar:wallet-money-bold-duotone" className="text-xl text-emerald-500" />
            Medios de Pago
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yape */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-lg">💜</span></div>
                <span className="font-semibold text-gray-800">Yape</span>
              </div>
              <div className="space-y-4">
                <InputPro label="Número Yape" name="yapeNumero" value={formData.yapeNumero} onChange={handleChange} placeholder="999 999 999" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código QR</label>
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <input type="file" accept="image/*" onChange={(e) => vm.setYapeFile(e.target.files?.[0] || null)} className="hidden" />
                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">{vm.yapeFile ? vm.yapeFile.name : 'Seleccionar imagen'}</span>
                      </label>
                      <Button type="button" onClick={() => vm.subirQr('yape')} disabled={vm.yapeUploading || !vm.yapeFile} color="lila" fill className="w-full mt-3">
                        {vm.yapeUploading ? 'Subiendo...' : 'Subir QR'}
                      </Button>
                    </div>
                    {(vm.previewYapeUrl || formData.yapeQrUrl) ? (
                      <div className="relative">
                        <img src={vm.previewYapeUrl || formData.yapeQrUrl} alt="QR Yape" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200" />
                        <button type="button" onClick={() => vm.eliminarQr('yape')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md">
                          <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Plin */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"><span className="text-lg">💚</span></div>
                <span className="font-semibold text-gray-800">Plin</span>
              </div>
              <div className="space-y-4">
                <InputPro label="Número Plin" name="plinNumero" value={formData.plinNumero} onChange={handleChange} placeholder="999 999 999" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código QR</label>
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <input type="file" accept="image/*" onChange={(e) => vm.setPlinFile(e.target.files?.[0] || null)} className="hidden" />
                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">{vm.plinFile ? vm.plinFile.name : 'Seleccionar imagen'}</span>
                      </label>
                      <Button type="button" onClick={() => vm.subirQr('plin')} disabled={vm.plinUploading || !vm.plinFile} color="lila" fill className="w-full mt-3">
                        {vm.plinUploading ? 'Subiendo...' : 'Subir QR'}
                      </Button>
                    </div>
                    {(vm.previewPlinUrl || formData.plinQrUrl) ? (
                      <div className="relative">
                        <img src={vm.previewPlinUrl || formData.plinQrUrl} alt="QR Plin" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200" />
                        <button type="button" onClick={() => vm.eliminarQr('plin')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md">
                          <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-5 border-t border-gray-100">
            <input type="checkbox" name="aceptaEfectivo" checked={formData.aceptaEfectivo} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label className="text-sm text-gray-700">Acepto pago en efectivo contra entrega</label>
          </div>

          {/* Cuenta Bancaria */}
          <div className="mt-8 pt-5 border-t border-gray-100">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="solar:card-transfer-bold-duotone" className="text-xl text-blue-500" />
              Cuenta Bancaria (Para Cotizaciones)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputPro name="bancoNombre" label="Nombre del Banco" value={formData.bancoNombre} onChange={handleChange} isLabel placeholder="Ej: INTERBANK" />
              <div>
                <div className="mb-1"><label className="block text-sm font-medium text-gray-700">Moneda</label></div>
                <select name="monedaCuenta" value={formData.monedaCuenta} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black">
                  <option value="SOLES">SOLES</option>
                  <option value="DOLARES">DOLARES</option>
                </select>
              </div>
              <InputPro name="numeroCuenta" label="N° Cuenta" value={formData.numeroCuenta} onChange={handleChange} isLabel placeholder="Ej: 200-3006350516" />
              <InputPro name="cci" label="CCI" value={formData.cci} onChange={handleChange} isLabel placeholder="Ej: 003-200-003006350516-35" />
            </div>
          </div>
        </div>

        {/* ── Envío y Recojo ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="solar:delivery-bold" className="text-xl text-amber-500" />
            Configuración de Envío y Recojo
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" name="aceptaRecojo" checked={formData.aceptaRecojo} onChange={handleChange} className="w-4 h-4" />
                <label className="text-sm">Acepto recojo en tienda</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="aceptaEnvio" checked={formData.aceptaEnvio} onChange={handleChange} className="w-4 h-4" />
                <label className="text-sm">Acepto envío a domicilio</label>
              </div>
            </div>
            {formData.aceptaEnvio && <InputPro label="Costo de envío fijo (S/)" name="costoEnvioFijo" type="number" value={formData.costoEnvioFijo} onChange={handleChange} placeholder="0.00" isLabel />}
            {formData.aceptaRecojo && <InputPro label="Dirección de recojo" name="direccionRecojo" value={formData.direccionRecojo} onChange={handleChange} placeholder="Av. Principal 123, Distrito, Ciudad" isLabel />}
            <InputPro label="Tiempo estimado de preparación (minutos)" name="tiempoPreparacionMin" type="number" value={formData.tiempoPreparacionMin} onChange={handleChange} placeholder="30" isLabel />
          </div>
        </div>

        {/* ── Banners ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="solar:gallery-bold-duotone" className="text-xl text-[#FF9500]" />
              Banners de Tienda Virtual
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full">{vm.banners.length} / 5</span>
          </div>

          {/* Visual guide */}
          <div className="mb-6 bg-[#FFF8F0] border border-[#FF9500]/20 rounded-2xl p-5">
            <p className="text-sm font-bold text-[#FF9500] mb-3 flex items-center gap-2">
              <Icon icon="solar:info-circle-bold" width={16} />
              ¿Cómo se usan los banners en la tienda?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Hero layout preview */}
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-3">
                <p className="font-bold text-gray-700 mb-2 text-[11px] uppercase tracking-wider">Sección Hero (arriba)</p>
                <div className="flex gap-2 h-24">
                  <div className="flex-1 bg-[#FF9500]/15 rounded-lg flex items-center justify-center border border-[#FF9500]/30">
                    <div className="text-center">
                      <span className="text-[10px] font-black text-[#FF9500] bg-[#FF9500]/20 px-2 py-0.5 rounded-full">Orden 0</span>
                      <p className="text-[10px] text-gray-600 mt-1">Banner principal</p>
                      <p className="text-[9px] text-gray-400">Título + Subtítulo + Imagen</p>
                    </div>
                  </div>
                  <div className="w-20 flex flex-col gap-2">
                    <div className="flex-1 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Orden 1</span>
                        <p className="text-[8px] text-gray-500 mt-0.5">Tarjeta derecha sup.</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Orden 2</span>
                        <p className="text-[8px] text-gray-500 mt-0.5">Tarjeta derecha inf.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo banners */}
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="font-bold text-gray-700 mb-2 text-[11px] uppercase tracking-wider">Banners Promo (medio)</p>
                <div className="space-y-2">
                  <div className="bg-green-50 rounded-lg border border-green-200 p-2 flex items-center gap-2">
                    <span className="text-[9px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">Orden 3</span>
                    <p className="text-[9px] text-gray-500">Promo izquierda (verde)</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-2 flex items-center gap-2">
                    <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">Orden 4</span>
                    <p className="text-[9px] text-gray-500">Promo derecha (naranja)</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-2">Aparecen 2 veces en la página</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2 text-[10px] text-gray-600">
              {[
                { orden: 0, recomendado: '1200×500px', desc: 'Hero naranja — título grande + imagen producto' },
                { orden: 1, recomendado: '600×250px', desc: 'Tarjeta superior derecha — categoría/producto' },
                { orden: 2, recomendado: '600×250px', desc: 'Tarjeta inferior derecha — categoría/producto' },
                { orden: 3, recomendado: '700×280px', desc: 'Promo banner izquierdo (fondo verde)' },
                { orden: 4, recomendado: '700×280px', desc: 'Promo banner derecho (fondo naranja)' },
              ].map(({ orden, recomendado, desc }) => (
                <div key={orden} className="bg-white rounded-lg border border-gray-100 p-2">
                  <p className="font-black text-gray-800">Orden {orden}</p>
                  <p className="text-gray-500">{desc}</p>
                  <p className="text-[#FF9500] font-medium mt-1">📐 {recomendado}</p>
                </div>
              ))}
            </div>
          </div>

          {vm.loadingBanners ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="eos-icons:loading" className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner Grid */}
              {vm.banners.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[...vm.banners].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)).map((banner, index) => {
                    const ordenLabels: Record<number, { label: string; color: string }> = {
                      0: { label: 'Hero principal', color: 'bg-[#FF9500]' },
                      1: { label: 'Tarjeta sup.', color: 'bg-amber-500' },
                      2: { label: 'Tarjeta inf.', color: 'bg-amber-600' },
                      3: { label: 'Promo izq.', color: 'bg-green-600' },
                      4: { label: 'Promo der.', color: 'bg-orange-600' },
                    };
                    const meta = ordenLabels[banner.orden] || { label: `Banner ${index + 1}`, color: 'bg-gray-500' };
                    return (
                      <div key={banner.id} className="relative group">
                        <div className="rounded-xl overflow-hidden border-2 border-gray-200 aspect-video">
                          <img src={banner.imagenUrl} alt={banner.titulo || `Banner ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <div className={`absolute top-2 left-2 ${meta.color} text-white text-[9px] font-black px-2 py-0.5 rounded-full`}>
                          {meta.label}
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => vm.openEditModal(banner)} className="bg-white text-blue-600 rounded-full p-1.5 shadow-lg hover:bg-blue-50 transition-colors">
                            <Icon icon="solar:pen-bold" className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => vm.eliminarBanner(banner.id)} className="bg-white text-red-500 rounded-full p-1.5 shadow-lg hover:bg-red-50 transition-colors">
                            <Icon icon="mdi:delete" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-gray-700 truncate px-1">{banner.titulo || `Banner ${index + 1}`}</p>
                        <p className="text-[10px] text-gray-400 truncate px-1">{banner.subtitulo}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Edit Banner Modal */}
              {vm.editingBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold">Editar Banner</h3>
                      <button type="button" onClick={() => vm.setEditingBanner(null)} className="p-2 hover:bg-gray-100 rounded-full">
                        <Icon icon="mdi:close" width={20} />
                      </button>
                    </div>

                    {/* Orden indicator */}
                    <div className="mb-4 bg-[#FFF8F0] border border-[#FF9500]/20 rounded-xl p-3 text-sm text-gray-600">
                      <Icon icon="solar:info-circle-bold" className="inline text-[#FF9500] mr-1" width={14} />
                      Este banner tiene <strong>orden {vm.editingBanner.orden}</strong>.{' '}
                      {vm.editingBanner.orden === 0 && 'Es el hero principal (naranja, 1200×500px recomendado).'}
                      {vm.editingBanner.orden === 1 && 'Es la tarjeta superior derecha (600×250px recomendado).'}
                      {vm.editingBanner.orden === 2 && 'Es la tarjeta inferior derecha (600×250px recomendado).'}
                      {vm.editingBanner.orden === 3 && 'Es el promo banner izquierdo (700×280px recomendado).'}
                      {vm.editingBanner.orden === 4 && 'Es el promo banner derecho (700×280px recomendado).'}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Banner</label>
                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#FF9500] transition-colors cursor-pointer bg-gray-50 flex items-center justify-center group/edit-img">
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => vm.setEditBannerFile(e.target.files?.[0] || null)} />
                          {vm.editBannerFile ? (
                            <img src={URL.createObjectURL(vm.editBannerFile)} className="w-full h-full object-cover" alt="Preview" />
                          ) : vm.editingBanner.imagenUrl ? (
                            <img src={vm.editingBanner.imagenUrl} className="w-full h-full object-cover" alt="Current" />
                          ) : (
                            <span className="text-gray-400">Clic para subir imagen</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity pointer-events-none">
                            <Icon icon="solar:camera-bold" className="text-white text-3xl" />
                          </div>
                        </div>
                        {vm.editBannerFile && <p className="text-xs text-green-600 mt-1">✓ Nueva imagen: {vm.editBannerFile.name}</p>}
                      </div>

                      <InputPro label="Título" name="titulo" value={vm.editBannerTitle} onChange={(e: any) => vm.setEditBannerTitle(e.target.value)} placeholder="Ej: Gran Liquidación" />
                      <InputPro label="Subtítulo" name="subtitulo" value={vm.editBannerSubtitle} onChange={(e: any) => vm.setEditBannerSubtitle(e.target.value)} placeholder="Ej: Hasta 50% de descuento" />

                      <div className="relative">
                        <InputPro label="Enlace (URL o ruta)" name="link" value={vm.editBannerLink} onChange={(e: any) => vm.setEditBannerLink(e.target.value)} placeholder="/tienda/producto/xyz" />
                        <label className="block text-xs font-medium text-gray-500 mt-2 mb-1">O busca un producto:</label>
                        <input
                          type="text"
                          value={vm.editSearch}
                          onChange={(e) => vm.setEditSearch(e.target.value)}
                          placeholder="Buscar producto..."
                          className="w-full text-sm rounded-lg border-gray-300 focus:ring-[#FF9500] focus:border-[#FF9500]"
                        />
                        {vm.editSearch.length > 2 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-xl z-10 max-h-48 overflow-y-auto mt-1">
                            {vm.searchingEdit ? (
                              <div className="p-3 text-center text-xs text-gray-500">Buscando...</div>
                            ) : vm.editResults.length > 0 ? (
                              vm.editResults.map((p: any) => (
                                <div
                                  key={p.id}
                                  onClick={() => { vm.setEditBannerLink(`/tienda/${formData.slugTienda}/producto/${p.slug || p.id}`); vm.setEditSearch(''); }}
                                  className="p-3 hover:bg-[#FFF8F0] cursor-pointer text-sm border-b last:border-0 flex items-center gap-3"
                                >
                                  {p.imagenUrl && <img src={p.imagenUrl} className="w-8 h-8 object-contain rounded" alt="" />}
                                  <div>
                                    <div className="font-medium truncate">{p.descripcion}</div>
                                    <div className="text-xs text-gray-400">S/ {p.precioUnitario}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-gray-500">Sin resultados</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                        <select
                          value={vm.editBannerOrden}
                          onChange={(e) => vm.setEditBannerOrden(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full rounded-lg border-gray-300 focus:ring-[#FF9500] focus:border-[#FF9500] text-sm"
                        >
                          <option value="">Sin orden</option>
                          <option value="0">0 — Hero principal (naranja)</option>
                          <option value="1">1 — Tarjeta derecha superior</option>
                          <option value="2">2 — Tarjeta derecha inferior</option>
                          <option value="3">3 — Promo izquierdo</option>
                          <option value="4">4 — Promo derecho</option>
                        </select>
                      </div>
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

              {/* Subir nuevo banner */}
              {vm.banners.length < 5 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-1">Subir Nuevo Banner</h4>
                  <p className="text-xs text-gray-500 mb-4">Elige el orden según la posición que quieres en la tienda (ver guía arriba)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <InputPro label="Título" name="tituloNew" value={vm.newBannerTitle} onChange={(e: any) => vm.setNewBannerTitle(e.target.value)} placeholder="Ej: Ofertas Especiales" />
                    <InputPro label="Subtítulo (Opcional)" name="subtituloNew" value={vm.newBannerSubtitle} onChange={(e: any) => vm.setNewBannerSubtitle(e.target.value)} placeholder="Ej: Hasta 50% off" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orden / Posición</label>
                      <select
                        value={vm.newBannerOrden}
                        onChange={(e: any) => vm.setNewBannerOrden(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full rounded-lg border-gray-300 focus:ring-[#FF9500] focus:border-[#FF9500] text-sm"
                      >
                        <option value="">Automático</option>
                        <option value="0">0 — Hero principal (naranja, título + imagen)</option>
                        <option value="1">1 — Tarjeta derecha superior (título + foto)</option>
                        <option value="2">2 — Tarjeta derecha inferior (título + foto)</option>
                        <option value="3">3 — Promo izquierdo (fondo verde)</option>
                        <option value="4">4 — Promo derecho (fondo naranja)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enlace (Opcional)</label>
                      <input
                        type="text"
                        value={vm.newBannerLink}
                        onChange={(e: any) => vm.setNewBannerLink(e.target.value)}
                        placeholder="/tienda/mi-tienda/producto/123"
                        className="w-full text-sm rounded-lg border-gray-300 focus:ring-[#FF9500] focus:border-[#FF9500]"
                      />
                    </div>
                  </div>

                  {/* Product search */}
                  <div className="relative mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">O busca un producto para el enlace:</label>
                    <input
                      type="text"
                      value={vm.productSearch}
                      onChange={(e) => vm.setProductSearch(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full text-sm border-gray-300 rounded-lg focus:ring-[#FF9500] focus:border-[#FF9500]"
                    />
                    {vm.productSearch.length > 2 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-xl z-10 max-h-48 overflow-y-auto mt-1">
                        {vm.searchingProducts ? (
                          <div className="p-3 text-center text-xs text-gray-500">Buscando...</div>
                        ) : vm.productResults.length > 0 ? (
                          vm.productResults.map((p: any) => (
                            <div
                              key={p.id}
                              onClick={() => { vm.setNewBannerLink(`/tienda/${formData.slugTienda}/producto/${p.slug || p.id}`); vm.setProductSearch(''); }}
                              className="p-3 hover:bg-[#FFF8F0] cursor-pointer text-sm border-b last:border-0 flex items-center gap-3"
                            >
                              {p.imagenUrl && <img src={p.imagenUrl} className="w-8 h-8 object-contain rounded" alt="" />}
                              <div>
                                <div className="font-medium truncate">{p.descripcion}</div>
                                <div className="text-xs text-gray-400">S/ {p.precioUnitario}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-gray-500">Sin resultados</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* File upload */}
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-[#FFF8F0] hover:border-[#FF9500] transition-colors">
                    <div className="flex flex-col items-center justify-center py-4">
                      {vm.uploadingBanner ? (
                        <>
                          <Icon icon="eos-icons:loading" className="w-10 h-10 text-[#FF9500] mb-2 animate-spin" />
                          <p className="text-sm text-gray-500 font-semibold">Subiendo banner...</p>
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:cloud-upload-bold-duotone" className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600"><span className="font-bold">Clic para subir</span> o arrastra la imagen</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG o WEBP · máx 2.5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={vm.handleBannerFileChange}
                      disabled={vm.uploadingBanner}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" onClick={() => window.location.reload()} disabled={saving} color="secondary">
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2"><Icon icon="eos-icons:loading" className="animate-spin" /> Guardando...</span>
            ) : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </div>
  );
}
