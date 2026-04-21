import React from 'react';
import { Icon } from '@iconify/react';
import useAlertStore from '@/zustand/alert';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

export const ProductImageUploader: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const {
        labels, loadingImage, previewPrincipal, filePrincipalInputRef, isGeneratingImage, formValues,
        setFilePrincipal, setPreviewPrincipal, setLoadingImage, handleAutoImage
    } = vm;

    return (
        <div className="p-4 rounded-lg border border-gray-200">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:image-outline" width={16} height={16} />
                {labels.imagen}
            </h5>
            <div>
                <button
                    type="button"
                    onClick={() => filePrincipalInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#6A6CFF] transition-colors cursor-pointer overflow-hidden relative"
                    disabled={loadingImage}
                >
                    {loadingImage ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Icon icon="mdi:loading" width={32} height={32} className="animate-spin text-[#6A6CFF]" />
                            <span className="text-xs text-gray-500 mt-2">Validando imagen...</span>
                        </div>
                    ) : previewPrincipal ? (
                        <img src={previewPrincipal} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Icon icon="mdi:image-plus" width={32} height={32} className="mb-2" />
                            <div className="text-center px-4">
                                <div className="text-sm">Click para subir imagen</div>
                                <div className="text-xs text-gray-400 mt-1">Mín. 600x600px, máx. 2MB</div>
                            </div>
                        </div>
                    )}
                </button>
                <input
                    ref={filePrincipalInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (!f) return;
                        if (!f.type.startsWith('image/')) {
                            useAlertStore.getState().alert('El archivo debe ser una imagen', 'error');
                            return;
                        }
                        if (f.size > 2 * 1024 * 1024) {
                            useAlertStore.getState().alert('La imagen no debe superar 2MB', 'error');
                            return;
                        }

                        setLoadingImage(true);
                        const img = new Image();
                        const objectUrl = URL.createObjectURL(f);
                        img.onload = () => {
                            URL.revokeObjectURL(objectUrl);
                            if (img.width < 600 || img.height < 600) {
                                useAlertStore.getState().alert('La imagen debe tener al menos 600x600 píxeles', 'error');
                                setLoadingImage(false);
                                return;
                            }
                            setFilePrincipal(f);
                            setPreviewPrincipal(URL.createObjectURL(f));
                            setLoadingImage(false);
                        };
                        img.onerror = () => {
                            URL.revokeObjectURL(objectUrl);
                            useAlertStore.getState().alert('Error al cargar la imagen', 'error');
                            setLoadingImage(false);
                        };
                        img.src = objectUrl;
                    }}
                    className="hidden"
                />
                {previewPrincipal && !loadingImage && (
                    <div className="mt-2">
                        <button
                            type="button"
                            onClick={() => { setFilePrincipal(null); setPreviewPrincipal(null); }}
                            className="text-xs text-red-600 hover:text-red-700 underline"
                        >
                            Quitar imagen
                        </button>
                    </div>
                )}
                <p className="text-[11px] text-gray-500 mt-2">Recomendación: 800x800px, JPG o PNG. Peso máximo 2MB.</p>

                <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleAutoImage}
                        disabled={isGeneratingImage || !formValues.descripcion}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${!formValues.descripcion
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                    >
                        <Icon icon={isGeneratingImage ? "mdi:loading" : "mdi:magic-staff"}
                            className={isGeneratingImage ? "animate-spin" : ""}
                            width={16} />
                        {isGeneratingImage ? 'Buscando...' : 'Auto-Generar Imagen'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center leading-tight">Nota: La imagen generada puede no ser exacta y sirve solo como apoyo referencial.</p>
                </div>
            </div>
        </div>
    );
};
