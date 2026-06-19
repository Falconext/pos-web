import { useConfiguracionTiendaViewModel } from '@/features/admin/tienda/useConfiguracionTiendaViewModel';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import ModalConfirm from '@/components/ModalConfirm';
import { ALL_PLANTILLAS, type PlantillaId } from '@/components/tienda/resolveTemplate';
import { useAuthStore } from '@/zustand/auth';

export default function ConfiguracionTienda() {
  const vm = useConfiguracionTiendaViewModel();
  const auth = useAuthStore(s => s.auth);
  const rubroNombre = auth?.empresa?.rubro?.nombre || '';

  const plantillasVisibles = ALL_PLANTILLAS.filter(p => {
    if (!p.rubrosPermitidos || p.rubrosPermitidos.length === 0) return true;
    return p.rubrosPermitidos.includes(rubroNombre);
  });

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
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Tienda Virtual no disponible</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Tu plan actual no incluye tienda virtual. Actualiza tu plan para activar esta funcionalidad.</p>
        <Button onClick={() => window.location.href = '/administrador/perfil'}>Ver Planes</Button>
      </div>
    );
  }

  const { formData, handleChange, handleSubmit, saving } = vm;

  return (
    <div className="min-h-screen pb-4 px-2 bg-gray-50 dark:bg-[#0A0D14]">
      <ModalConfirm
        isOpenModal={vm.showConfirmDelete}
        setIsOpenModal={vm.setShowConfirmDelete}
        confirmSubmit={vm.confirmarEliminarQr}
        title={`Eliminar QR de ${vm.deleteQrType?.toUpperCase() || ''}`}
        information={`¿Estás seguro de que deseas eliminar el código QR de ${vm.deleteQrType?.toUpperCase() || ''}?`}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon icon="solar:settings-bold-duotone" className="text-blue-600 dark:text-blue-400" />
            Configuración de Tienda Virtual
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza tu tienda online: logo, banners, pagos y más</p>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Información Básica ── */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Icon icon="solar:info-circle-bold-duotone" className="text-xl text-blue-500" />
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputPro label="Nombre de la tienda (URL)" name="slugTienda" value={formData.slugTienda} onChange={handleChange} placeholder="mi-negocio" />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Solo letras minúsculas, números y guiones.</p>
            </div>
            <InputPro label="WhatsApp" name="whatsappTienda" value={formData.whatsappTienda} onChange={handleChange} placeholder="+51 999 999 999" />
            <div className="md:col-span-2">
              <InputPro label="Descripción" name="descripcionTienda" value={formData.descripcionTienda} onChange={handleChange} placeholder="Breve descripción de tu negocio" type="textarea" rows={3} isLabel />
            </div>
            <InputPro label="Horario de atención" name="horarioAtencion" value={formData.horarioAtencion} onChange={handleChange} />
          </div>
        </div>

        {/* ── Plantilla de Tienda ── */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon icon="solar:shop-2-bold-duotone" className="text-xl text-indigo-500" />
            Plantilla de Tienda
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Elige el diseño base de tu tienda virtual. Algunas plantillas requieren un plan superior.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {plantillasVisibles.map(plantilla => {
              const isOn = vm.config?.diseno?.plantillaId === plantilla.id;
              
              // Determine if this template is allowed for the user's plan
              const requiredPlans = plantilla.planesPermitidos || [];
              const userPlan = vm.config?.plan?.nombre?.toUpperCase() || '';
              // Simple check: if there are no required plans OR the user's plan is in the required list
              const isAllowed = requiredPlans.length === 0 || requiredPlans.includes(userPlan) || userPlan.includes('CORPORATIVO');

              return (
                <button
                  key={plantilla.id}
                  type="button"
                  disabled={!isAllowed}
                  onClick={() => vm.actualizarDiseno({ plantillaId: plantilla.id })}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col 
                    ${!isAllowed ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800' : 
                      isOn ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm' : 
                      'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'}`}
                >
                  {isOn && (
                    <span className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="text-indigo-600 text-sm" />
                    </span>
                  )}
                  
                  {!isAllowed && (
                    <span className="absolute top-2 right-2" title={`Requiere plan: ${requiredPlans.join(', ')}`}>
                      <Icon icon="solar:lock-bold" className="text-gray-400 text-sm" />
                    </span>
                  )}

                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: plantilla.accentColor + '18' }}>
                    <Icon icon={plantilla.icon} className="text-xl" style={{ color: plantilla.accentColor }} />
                  </div>
                  
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">{plantilla.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {!isAllowed ? `Requiere plan ${requiredPlans.join(' o ')}` : plantilla.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Logo de Tienda ── */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon icon="solar:image-bold-duotone" className="text-xl text-[#FF9500]" />
            Logo de Tienda
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Aparece en el <strong>encabezado</strong> de tu tienda virtual junto al nombre. Recomendado: 200×200px, fondo transparente (PNG).
          </p>

          <div className="flex items-start gap-6 flex-wrap">
            {/* Preview actual */}
            <div className="flex-shrink-0">
              {vm.previewLogoUrl ? (
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl border-2 border-[#FF9500]/30 bg-[#FAF6F1] dark:bg-slate-900/50 flex items-center justify-center overflow-hidden">
                    <img src={vm.previewLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                  </div>
                  <button
                    type="button"
                    onClick={vm.eliminarLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                  </button>
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">Logo actual</p>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/30 flex flex-col items-center justify-center gap-1">
                  <Icon icon="solar:shop-bold" className="text-3xl text-gray-300 dark:text-gray-700" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Sin logo</p>
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex-1 min-w-[220px]">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-900/20 hover:bg-[#FFF3E0] dark:hover:bg-[#FF9500]/10 hover:border-[#FF9500] transition-colors">
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
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
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
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Icon icon="solar:wallet-money-bold-duotone" className="text-xl text-emerald-500" />
            Medios de Pago
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yape */}
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 bg-gray-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"><span className="text-lg">💜</span></div>
                <span className="font-semibold text-gray-800 dark:text-white">Yape</span>
              </div>
              <div className="space-y-4">
                <InputPro label="Número Yape" name="yapeNumero" value={formData.yapeNumero} onChange={handleChange} placeholder="999 999 999" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código QR</label>
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-xl cursor-pointer bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <input type="file" accept="image/*" onChange={(e) => vm.setYapeFile(e.target.files?.[0] || null)} className="hidden" />
                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 dark:text-gray-600 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{vm.yapeFile ? vm.yapeFile.name : 'Seleccionar imagen'}</span>
                      </label>
                      <Button type="button" onClick={() => vm.subirQr('yape')} disabled={vm.yapeUploading || !vm.yapeFile} color="lila" fill className="w-full mt-3">
                        {vm.yapeUploading ? 'Subiendo...' : 'Subir QR'}
                      </Button>
                    </div>
                    {(vm.previewYapeUrl || formData.yapeQrUrl) ? (
                      <div className="relative">
                        <img src={vm.previewYapeUrl || formData.yapeQrUrl} alt="QR Yape" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200 dark:border-slate-700" />
                        <button type="button" onClick={() => vm.eliminarQr('yape')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md">
                          <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900/50 flex items-center justify-center">
                        <Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300 dark:text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Plin */}
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 bg-gray-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center"><span className="text-lg">💚</span></div>
                <span className="font-semibold text-gray-800 dark:text-white">Plin</span>
              </div>
              <div className="space-y-4">
                <InputPro label="Número Plin" name="plinNumero" value={formData.plinNumero} onChange={handleChange} placeholder="999 999 999" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código QR</label>
                  <div className="flex items-stretch gap-4">
                    <div className="flex-1 flex flex-col">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-xl cursor-pointer bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <input type="file" accept="image/*" onChange={(e) => vm.setPlinFile(e.target.files?.[0] || null)} className="hidden" />
                        <Icon icon="solar:upload-minimalistic-bold-duotone" className="text-3xl text-gray-400 dark:text-gray-600 mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{vm.plinFile ? vm.plinFile.name : 'Seleccionar imagen'}</span>
                      </label>
                      <Button type="button" onClick={() => vm.subirQr('plin')} disabled={vm.plinUploading || !vm.plinFile} color="lila" fill className="w-full mt-3">
                        {vm.plinUploading ? 'Subiendo...' : 'Subir QR'}
                      </Button>
                    </div>
                    {(vm.previewPlinUrl || formData.plinQrUrl) ? (
                      <div className="relative">
                        <img src={vm.previewPlinUrl || formData.plinQrUrl} alt="QR Plin" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200 dark:border-slate-700" />
                        <button type="button" onClick={() => vm.eliminarQr('plin')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md">
                          <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900/50 flex items-center justify-center">
                        <Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300 dark:text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-5 border-t border-gray-100 dark:border-slate-800">
            <input type="checkbox" name="aceptaEfectivo" checked={formData.aceptaEfectivo} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 dark:bg-slate-800 text-blue-600 focus:ring-blue-500" />
            <label className="text-sm text-gray-700 dark:text-gray-300">Acepto pago en efectivo contra entrega</label>
          </div>

          {/* Cuenta Bancaria */}
          <div className="mt-8 pt-5 border-t border-gray-100 dark:border-slate-800">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Icon icon="solar:card-transfer-bold-duotone" className="text-xl text-blue-500" />
              Cuenta Bancaria (Para Cotizaciones)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputPro name="bancoNombre" label="Nombre del Banco" value={formData.bancoNombre} onChange={handleChange} isLabel placeholder="Ej: INTERBANK" />
              <div>
                <div className="mb-1"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</label></div>
                <select name="monedaCuenta" value={formData.monedaCuenta} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-slate-800 bg-white dark:bg-[#0A0D14] focus:ring-black focus:border-black dark:text-white">
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
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:delivery-bold" className="text-xl text-amber-500" />
            Configuración de Envío y Recojo
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" name="aceptaRecojo" checked={formData.aceptaRecojo} onChange={handleChange} className="w-4 h-4 dark:bg-slate-800 dark:border-slate-700" />
                <label className="text-sm dark:text-gray-300">Acepto recojo en tienda</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="aceptaEnvio" checked={formData.aceptaEnvio} onChange={handleChange} className="w-4 h-4 dark:bg-slate-800 dark:border-slate-700" />
                <label className="text-sm dark:text-gray-300">Acepto envío a domicilio</label>
              </div>
            </div>
            {formData.aceptaEnvio && <InputPro label="Costo de envío fijo (S/)" name="costoEnvioFijo" type="number" value={formData.costoEnvioFijo} onChange={handleChange} placeholder="0.00" isLabel />}
            {formData.aceptaEnvio && <InputPro label="Envío gratis desde (S/) — 0 = nunca gratis" name="envioGratisDesdeSoles" type="number" value={formData.envioGratisDesdeSoles} onChange={handleChange} placeholder="0.00" isLabel />}
            {formData.aceptaRecojo && <InputPro label="Dirección de recojo" name="direccionRecojo" value={formData.direccionRecojo} onChange={handleChange} placeholder="Av. Principal 123, Distrito, Ciudad" isLabel />}
            <InputPro label="Monto mínimo de pedido (S/) — 0 = sin mínimo" name="minimoCompra" type="number" value={formData.minimoCompra} onChange={handleChange} placeholder="0.00" isLabel />
            <InputPro label="Tiempo estimado de preparación (minutos)" name="tiempoPreparacionMin" type="number" value={formData.tiempoPreparacionMin} onChange={handleChange} placeholder="30" isLabel />
          </div>
        </div>

        {/* ── Banners ── */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon icon="solar:gallery-bold-duotone" className="text-xl text-[#FF9500]" />
              Banners de Tienda Virtual
            </h3>
            {vm.bannerSlots.length > 0 && (
              <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold px-3 py-1 rounded-full">
                {vm.banners.length} / {vm.bannerIsSlider ? 3 : 6}
              </span>
            )}
          </div>

          {/* Toggle modo carrusel — solo visible si la plantilla soporta banners */}
          {vm.bannerSlots.length > 0 && (
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
          )}

          {/* Sin banners para esta plantilla */}
          {vm.bannerSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon icon="solar:gallery-minimalistic-bold-duotone" className="text-5xl text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Esta plantilla no usa banners</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Cambia la plantilla desde Diseño de Tienda para activar esta sección.</p>
            </div>
          ) : (
            <>
              {/* Guía visual dinámica */}
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
                  {/* Banner Grid (solo plantillas clásicas) */}
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

                  {/* Edit Banner Modal */}
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

                  {/* Subir nuevo banner */}
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
          )}
        </div>

        {/* Configuración Especial Autopartes */}
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
                    onChange={(e: any) => vm.actualizarDiseno({ heroTitle: e.target.value })} 
                    placeholder="Catálogo de Productos" 
                    isLabel
                  />
                  <InputPro 
                    label="Subtítulo del Banner Principal" 
                    name="heroSubtitle" 
                    value={vm.config?.diseno?.heroSubtitle || ''} 
                    onChange={(e: any) => vm.actualizarDiseno({ heroSubtitle: e.target.value })} 
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
                    onChange={(e: any) => vm.actualizarDiseno({ comunidadTitle: e.target.value })} 
                    placeholder="Sé parte de nuestra comunidad" 
                    isLabel
                  />
                  <InputPro 
                    label="Texto descriptivo" 
                    name="comunidadText" 
                    value={vm.config?.diseno?.comunidadText || ''} 
                    onChange={(e: any) => vm.actualizarDiseno({ comunidadText: e.target.value })} 
                    placeholder="Únete para ofertas exclusivas" 
                    isLabel
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
