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
      <ModalConfirm isOpenModal={vm.showConfirmDelete} setIsOpenModal={vm.setShowConfirmDelete} confirmSubmit={vm.confirmarEliminarQr}
        title={`Eliminar QR de ${vm.deleteQrType?.toUpperCase() || ''}`}
        information={`¿Estás seguro de que deseas eliminar el código QR de ${vm.deleteQrType?.toUpperCase() || ''}? Esta acción no se puede deshacer.`} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración de Tienda Virtual</h1><p className="text-sm text-gray-500 mt-1">Personaliza tu tienda online y medios de pago</p></div>
        {formData.slugTienda && (<Button onClick={vm.abrirTienda} color="secondary" className="flex items-center gap-2"><Icon icon="solar:shop-2-bold" />Ver mi tienda</Button>)}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2"><Icon icon="solar:info-circle-bold-duotone" className="text-xl text-blue-500" />Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputPro label="Nombre de la tienda (URL)" name="slugTienda" value={formData.slugTienda} onChange={handleChange} placeholder="mi-negocio" />
              <p className="mt-1 text-xs text-gray-500">Solo letras minúsculas, números y guiones.</p>
            </div>
            <InputPro label="WhatsApp" name="whatsappTienda" value={formData.whatsappTienda} onChange={handleChange} placeholder="+51 999 999 999" />
            <div className="md:col-span-2"><InputPro label="Descripción" name="descripcionTienda" value={formData.descripcionTienda} onChange={handleChange} placeholder="Breve descripción de tu negocio" type="textarea" rows={3} isLabel /></div>
            <InputPro label="Horario de atención" name="horarioAtencion" value={formData.horarioAtencion} onChange={handleChange} />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2"><Icon icon="solar:share-circle-bold-duotone" className="text-xl text-purple-500" />Redes Sociales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputPro label="Facebook" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} placeholder="https://facebook.com/tu-pagina" />
            <InputPro label="Instagram" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} placeholder="https://instagram.com/tu-cuenta" />
            <InputPro label="TikTok" name="tiktokUrl" value={formData.tiktokUrl} onChange={handleChange} placeholder="https://tiktok.com/@tu-cuenta" />
          </div>
        </div>

        {/* Medios de pago */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2"><Icon icon="solar:wallet-money-bold-duotone" className="text-xl text-emerald-500" />Medios de Pago</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yape */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-lg">💜</span></div><span className="font-semibold text-gray-800">Yape</span></div>
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
                      <div className="mt-3"><Button type="button" onClick={() => vm.subirQr('yape')} disabled={vm.yapeUploading || !vm.yapeFile} color="lila" fill className="w-full mt-3 object-cover">{vm.yapeUploading ? 'Subiendo...' : 'Subir QR'}</Button></div>
                    </div>
                    {(vm.previewYapeUrl || formData.yapeQrUrl) ? (
                      <div className="relative"><img src={vm.previewYapeUrl || formData.yapeQrUrl} alt="QR Yape" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200" />
                        <button type="button" onClick={() => vm.eliminarQr('yape')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"><Icon icon="solar:trash-bin-trash-bold" className="text-xs" /></button></div>
                    ) : (<div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center"><Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300" /></div>)}
                  </div>
                </div>
              </div>
            </div>
            {/* Plin */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"><span className="text-lg">💚</span></div><span className="font-semibold text-gray-800">Plin</span></div>
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
                      <div className="mt-3"><Button type="button" onClick={() => vm.subirQr('plin')} disabled={vm.plinUploading || !vm.plinFile} color="lila" fill className="w-full mt-3">{vm.plinUploading ? 'Subiendo...' : 'Subir QR'}</Button></div>
                    </div>
                    {(vm.previewPlinUrl || formData.plinQrUrl) ? (
                      <div className="relative"><img src={vm.previewPlinUrl || formData.plinQrUrl} alt="QR Plin" className="w-28 h-auto max-h-40 object-contain rounded-xl border border-gray-200" />
                        <button type="button" onClick={() => vm.eliminarQr('plin')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"><Icon icon="solar:trash-bin-trash-bold" className="text-xs" /></button></div>
                    ) : (<div className="w-32 h-32 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center"><Icon icon="solar:qr-code-linear" className="text-4xl text-gray-300" /></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-5 pt-5 border-t border-gray-100">
            <input type="checkbox" name="aceptaEfectivo" checked={formData.aceptaEfectivo} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label className="text-sm text-gray-700">Acepto pago en efectivo contra entrega</label>
          </div>
          {/* Información Bancaria */}
          <div className="mt-8 pt-5 border-t border-gray-100">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2"><Icon icon="solar:card-transfer-bold-duotone" className="text-xl text-blue-500" />Cuenta Bancaria (Para Cotizaciones)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputPro name="bancoNombre" label="Nombre del Banco" value={formData.bancoNombre} onChange={handleChange} isLabel placeholder="Ej: INTERBANK" />
              <div><div className="mb-1"><label className="block text-sm font-medium text-gray-700">Moneda</label></div>
                <select name="monedaCuenta" value={formData.monedaCuenta} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"><option value="SOLES">SOLES</option><option value="DOLARES">DOLARES</option></select></div>
              <InputPro name="numeroCuenta" label="N° Cuenta" value={formData.numeroCuenta} onChange={handleChange} isLabel placeholder="Ej: 200-3006350516" />
              <InputPro name="cci" label="CCI" value={formData.cci} onChange={handleChange} isLabel placeholder="Ej: 003-200-003006350516-35" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Esta información se mostrará en el pie de página de tus cotizaciones impresas.</p>
          </div>
        </div>

        {/* Configuración de Envío */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon icon="solar:delivery-bold" className="text-xl text-amber-500" />Configuración de Envío y Recojo</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><input type="checkbox" name="aceptaRecojo" checked={formData.aceptaRecojo} onChange={handleChange} className="w-4 h-4" /><label className="text-sm">Acepto recojo en tienda</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="aceptaEnvio" checked={formData.aceptaEnvio} onChange={handleChange} className="w-4 h-4" /><label className="text-sm">Acepto envío a domicilio</label></div>
            </div>
            {formData.aceptaEnvio && (<InputPro label="Costo de envío fijo (S/)" name="costoEnvioFijo" type="number" value={formData.costoEnvioFijo} onChange={handleChange} placeholder="0.00" isLabel />)}
            {formData.aceptaRecojo && (<InputPro label="Dirección de recojo" name="direccionRecojo" value={formData.direccionRecojo} onChange={handleChange} placeholder="Av. Principal 123, Distrito, Ciudad" isLabel />)}
            <InputPro label="Tiempo estimado de preparación (minutos)" name="tiempoPreparacionMin" type="number" value={formData.tiempoPreparacionMin} onChange={handleChange} placeholder="30" isLabel />
          </div>
        </div>

        {/* Banners */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Icon icon="solar:gallery-bold-duotone" className="text-xl text-purple-500" />Banners de Tienda Virtual</h3>
            <span className="text-xs text-gray-500">{vm.banners.length} / 5 banners</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Los banners aparecerán en el slider principal. Tamaño recomendado: 1920x600px, máximo 2.5MB.</p>
          {vm.loadingBanners ? (
            <div className="flex items-center justify-center py-12"><Icon icon="eos-icons:loading" className="w-8 h-8 text-gray-400" /></div>
          ) : (
            <div className="space-y-4">
              {vm.banners.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...vm.banners].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)).map((banner, index) => (
                    <div key={banner.id} className="relative group">
                      <div className="rounded-lg overflow-hidden border-2 border-gray-200"><img src={banner.imagenUrl} alt={banner.titulo || `Banner ${index + 1}`} className="w-full h-[250px] object-fill" /></div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">Orden: {banner.orden ?? '-'}</div>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => vm.openEditModal(banner)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors"><Icon icon="solar:pen-bold" className="w-4 h-4" /></button>
                        <button type="button" onClick={() => vm.eliminarBanner(banner.id)} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"><Icon icon="mdi:delete" className="w-4 h-4" /></button>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-700 text-center truncate px-2">{banner.titulo || `Banner ${index + 1}`}<span className="block text-xs text-gray-400 font-normal truncate">{banner.subtitulo}</span></p>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Banner Modal */}
              {vm.editingBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                    <h3 className="text-lg font-bold mb-4">Editar Banner</h3>
                    <div className="space-y-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Banner</label>
                        <div className="relative aspect-[21/9] rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 flex items-center justify-center group/edit-img">
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => vm.setEditBannerFile(e.target.files?.[0] || null)} />
                          {vm.editBannerFile ? <img src={URL.createObjectURL(vm.editBannerFile)} className="w-full h-full object-fill" alt="Preview" /> : vm.editingBanner.imagenUrl ? <img src={vm.editingBanner.imagenUrl} className="w-full h-full object-fill" alt="Current" /> : <span className="text-gray-400">Clic para subir imagen</span>}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity pointer-events-none"><Icon icon="solar:camera-bold" className="text-white text-3xl" /></div>
                        </div>
                        {vm.editBannerFile && <p className="text-xs text-green-600 mt-1">Nueva imagen: {vm.editBannerFile.name}</p>}
                      </div>
                      <InputPro label="Título" name="titulo" value={vm.editBannerTitle} onChange={(e: any) => vm.setEditBannerTitle(e.target.value)} placeholder="Ej: Gran Liquidación" />
                      <InputPro label="Subtítulo" name="subtitulo" value={vm.editBannerSubtitle} onChange={(e: any) => vm.setEditBannerSubtitle(e.target.value)} placeholder="Ej: Hasta 50% de descuento" />
                      <InputPro label="Enlace" name="link" value={vm.editBannerLink} onChange={(e: any) => vm.setEditBannerLink(e.target.value)} placeholder="/tienda/producto/xyz" />
                      <InputPro label="Orden" name="orden" type="number" value={vm.editBannerOrden} onChange={(e: any) => vm.setEditBannerOrden(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0, 1, 2..." />
                      <div className="relative pt-2 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar enlace a producto (Ayuda)</label>
                        <input type="text" value={vm.editSearch} onChange={(e) => vm.setEditSearch(e.target.value)} placeholder="Buscar producto..." className="w-full text-sm rounded-lg border-gray-300 focus:ring-black focus:border-black" />
                        {vm.editSearch.length > 2 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-lg z-10 max-h-48 overflow-y-auto mt-1">
                            {vm.searchingEdit ? <div className="p-3 text-center text-xs text-gray-500">Buscando...</div> : vm.editResults.length > 0 ? vm.editResults.map((p: any) => (
                              <div key={p.id} onClick={() => { vm.setEditBannerLink(`/tienda/${formData.slugTienda}/producto/${p.slug || p.id}`); vm.setEditSearch(''); vm.setEditResults && vm.setEditResults([]); }} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0">
                                <div className="font-medium truncate">{p.descripcion}</div><div className="text-xs text-gray-500">S/ {p.precioUnitario}</div>
                              </div>
                            )) : <div className="p-3 text-center text-xs text-gray-500">No se encontraron productos</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button type="button" color="secondary" onClick={() => vm.setEditingBanner(null)}>Cancelar</Button>
                      <Button type="button" onClick={vm.handleUpdateBanner} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
                    </div>
                  </div>
                </div>
              )}
              {/* Subir nuevo banner */}
              {vm.banners.length < 5 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold mb-3">Subir Nuevo Banner</h4>
                  <div className="mb-4 space-y-3">
                    <InputPro label="Título del Banner" name="tituloNew" value={vm.newBannerTitle} onChange={(e: any) => vm.setNewBannerTitle(e.target.value)} placeholder="Ej: Nueva Colección" />
                    <InputPro label="Subtítulo (Opcional)" name="subtituloNew" value={vm.newBannerSubtitle} onChange={(e: any) => vm.setNewBannerSubtitle(e.target.value)} placeholder="Ej: Descuentos de verano" />
                    <InputPro label="Enlace (Opcional)" name="linkNew" value={vm.newBannerLink} onChange={(e: any) => vm.setNewBannerLink(e.target.value)} placeholder="/tienda/producto/xyz" />
                    <InputPro label="Orden" name="ordenNew" type="number" value={vm.newBannerOrden} onChange={(e: any) => vm.setNewBannerOrden(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0, 1, 2..." />
                    <div className="relative pt-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Buscar enlace de producto</label>
                      <input type="text" value={vm.productSearch} onChange={(e) => vm.setProductSearch(e.target.value)} placeholder="Buscar producto..." className="w-full text-sm border-gray-300 rounded-md focus:ring-black focus:border-black placeholder-gray-400" />
                      {vm.productSearch.length > 2 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-b-lg z-10 max-h-48 overflow-y-auto mt-1">
                          {vm.searchingProducts ? <div className="p-3 text-center text-xs text-gray-500">Buscando...</div> : vm.productResults.length > 0 ? vm.productResults.map((p: any) => (
                            <div key={p.id} onClick={() => { vm.setNewBannerLink(`/tienda/${formData.slugTienda}/producto/${p.slug || p.id}`); vm.setProductSearch(''); }} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0">
                              <div className="font-medium truncate">{p.descripcion}</div><div className="text-xs text-gray-500">S/ {p.precioUnitario}</div>
                            </div>
                          )) : <div className="p-3 text-center text-xs text-gray-500">No se encontraron productos</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <span className="block text-xs font-bold text-gray-700 mb-2">Subir Imagen del Banner</span>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {vm.uploadingBanner ? (<><Icon icon="eos-icons:loading" className="w-10 h-10 text-blue-500 mb-3" /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Subiendo banner...</span></p></>) : (<><Icon icon="solar:cloud-upload-linear" className="w-10 h-10 text-gray-400 mb-3" /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clic para subir</span> o arrastra la imagen</p><p className="text-xs text-gray-500">PNG, JPG o WEBP (MAX. 2.5MB)</p></>)}
                      </div>
                      <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={vm.handleBannerFileChange} disabled={vm.uploadingBanner} />
                    </label>
                    {vm.banners.length === 0 && !vm.uploadingBanner && (<div className="text-center py-8 text-gray-500"><Icon icon="solar:gallery-bold" className="w-16 h-16 mx-auto mb-3 text-gray-300" /><p className="text-sm">No hay banners aún. Sube tu primer banner para comenzar.</p></div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colores */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon icon="solar:pallete-2-bold" className="text-xl text-pink-500" />Personalización</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2">Color Primario</label><input type="color" name="colorPrimario" value={formData.colorPrimario} onChange={handleChange} className="w-full h-12 rounded border" /></div>
            <div><label className="block text-sm font-medium mb-2">Color Secundario</label><input type="color" name="colorSecundario" value={formData.colorSecundario} onChange={handleChange} className="w-full h-12 rounded border" /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" onClick={() => vm.cargarConfiguracion && window.location.reload()} disabled={saving}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Configuración'}</Button>
        </div>
      </form>
    </div>
  );
}
