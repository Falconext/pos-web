import { create } from 'zustand';
import { del, get, patch, post, put } from '../utils/fetch';
import { IResponse } from '../interfaces/auth';
import { IFormProduct, IProduct } from '../interfaces/products';
import useAlertStore from './alert';
import { devtools } from 'zustand/middleware';
import { useKardexStore } from './kardex';

export interface IProductsState {
    products: IProduct[];
    product: string;
    productCode: string
    totalProducts: number;
    resetProducts: () => void;
    addProduct: (data: IFormProduct, options?: { skipStore?: boolean }) => Promise<any>
    editProduct: (data: IFormProduct) => void
    getAllProducts: (params: any, callback?: Function,
        allProperties?: boolean) => void
    toggleStateProduct: (data: number) => void
    getCodeProduct: (empresa: number) => void
    exportProducts: (empresaId: number, search?: string) => void;
    importProducts: (file: File) => Promise<void>;
    deleteProduct: (productoId: number) => Promise<void>;
    setProductImage: (productoId: number, imagenUrl: string) => void;
    upsertProductLocal: (product: any) => void;
}

export const useProductsStore = create<IProductsState>()(devtools((set, _get) => ({
    student: "",
    students: [],
    getAllProducts: async (params: any, callback?: Function,
        _allProperties?: boolean) => {
        try {
            // useAlertStore.setState({ loading: true })
            const filteredParams = Object.entries(params)
                .filter(([_, value]) => value !== undefined)
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

            const query = new URLSearchParams(filteredParams).toString();
            const resp: any = await get(`producto/listar?${query}`);
            console.log(resp)
            if (resp.code === 1) {
                useAlertStore.setState({ success: true });
                set({
                    products: resp.data.productos,
                    totalProducts: resp.data.total
                }, false, "GET_PRODUCTS");
                useAlertStore.setState({ loading: false })
            } else {
                set({
                    products: []
                });
                useAlertStore.setState({ loading: false })
            }
        } catch (error) {
            useAlertStore.setState({ loading: false })
        } finally {
            if (callback) {
                callback();
            }
        }
    },
    deleteProduct: async (productoId: number) => {
        try {
            useAlertStore.setState({ loading: true });
            await del(`producto/${productoId}`);
            set((state) => ({
                products: state.products.filter((p: IProduct) => p.id !== productoId),
                totalProducts: Math.max(0, (state.totalProducts || 0) - 1),
            }), false, 'DELETE_PRODUCT');
            useAlertStore.setState({ success: true });
            useAlertStore.getState().alert('Producto eliminado correctamente', 'success');
        } catch (error: any) {
            useAlertStore.getState().alert(error?.message || 'Error al eliminar el producto', 'error');
        } finally {
            useAlertStore.setState({ loading: false });
        }
    },
    setProductImage: (productoId: number, imagenUrl: string) => {
        set((state) => ({
            products: state.products.map((p: IProduct) =>
                p.id === productoId ? { ...p, imagenUrl } as any : p
            ),
        }), false, 'SET_PRODUCT_IMAGE');
    },
    upsertProductLocal: (product: any) => {
        set((state) => {
            const exists = state.products?.some((p: IProduct) => p.id === product.id);
            const merged = exists
                ? state.products.map((p: IProduct) => p.id === product.id ? { ...p, ...product } as any : p)
                : [{ ...(product as any) }, ...(state.products || [])];
            return {
                products: merged as any,
                totalProducts: exists ? state.totalProducts : (state.totalProducts || 0) + 1,
            };
        }, false, 'UPSERT_PRODUCT_LOCAL');
    },
    addProduct: async (data: any, options?: { skipStore?: boolean }) => {
        useAlertStore.setState({ loading: true });
        try {
            const resp: any = await post(`producto/crear`, data);
            console.log(resp);
            if (resp.code === 1) {
                useAlertStore.setState({ success: true });
                if (!options?.skipStore) {
                    set((state) => ({
                        products: [{
                            ...data,
                            id: resp.data?.id,
                            codigo: data?.codigo || resp.data?.codigo,
                            imagenUrl: (data as any).imagenUrl,
                            categoria: {
                                nombre: data.categoriaNombre
                            },
                            unidadMedida: {
                                nombre: data.unidadMedidaNombre
                            },
                            marca: data.marcaId ? {
                                id: data.marcaId,
                                nombre: data.marcaNombre,
                            } : undefined,
                        }, ...state.products],
                        totalProducts: (state.totalProducts || 0) + 1,
                    }), false, "ADD_PRODUCTS");
                }

                useAlertStore.setState({ loading: false });
                useAlertStore.getState().alert("Se agrego el producto correctamente", "success")
                return {
                    data: {
                        ...resp.data,
                        unidadMedida: {
                            nombre: data.unidadMedidaNombre
                        }
                    }
                };
            }
            if (resp.code === 2) {
                useAlertStore.getState().alert(`Este dni ya ha sido registrado en un producto`, "error")
            }
        } catch (error: any) {
            return useAlertStore.getState().alert(`${error}, el dni ya ha sido registrado en un producto`, "error")
        }
    },
    editProduct: async (data: any) => {
        console.log(data);
        useAlertStore.setState({ loading: true });
        try {
            // Obtener el producto actual para comparar el stock
            const currentState = _get();
            const currentProduct = currentState.products.find((p: IProduct) => p.id === data.productoId);
            const stockAnterior = currentProduct?.stock || 0;
            const stockNuevo = data.stock || 0;

            const resp: any = await put(`producto/${data.productoId}`, data);
            if (resp.code === 1) {
                // Si el stock cambió, crear movimiento de kardex
                if (stockAnterior !== stockNuevo) {
                    try {
                        await useKardexStore.getState().createMovimientoAjuste({
                            productoId: data.productoId,
                            stockAnterior,
                            stockNuevo,
                            observacion: `Ajuste automático por edición de producto`
                        });
                    } catch (kardexError) {
                        console.warn('No se pudo crear el movimiento de kardex:', kardexError);
                        // No interrumpir el flujo principal si falla el kardex
                    }
                }   
                
                useAlertStore.setState({ success: true });
                set((state) => ({
                    products: state.products.map((product: IProduct) =>
                        product.id === data?.productoId ? {
                            ...product,
                            unidadMedida: { nombre: data.unidadMedidaNombre },
                            categoria: { nombre: data.categoriaNombre },
                            marca: data.marcaId ? { id: data.marcaId, nombre: data.marcaNombre } : undefined,
                            ...data,
                        } : product
                    ),
                }), false, "UPDATE_PRODUCT");
                useAlertStore.setState({ loading: false })
                const message = stockAnterior !== stockNuevo 
                    ? "Se actualizó el producto correctamente y se registró el ajuste en kardex"
                    : "Se actualizó el producto correctamente";
                useAlertStore.getState().alert(message, "success");
            } else {
                useAlertStore.setState({ loading: false })
                useAlertStore.getState().alert("Error al editar el producto", "error");
            }
        } catch (error: any) {
            useAlertStore.setState({ loading: false })
            return useAlertStore.getState().alert(`${error}`, "error")
        }
    },
    toggleStateProduct: async (productoId: number) => {
        console.log(productoId)
        try {
            const resp: any = await patch(`producto/${productoId}/estado`);
            if (resp.code === 1) {
                set((state) => ({
                    products: state.products.map((product) =>
                        product.id === productoId
                            ? { ...product, estado: product.estado === "INACTIVO" ? "ACTIVO" : "INACTIVO" }
                            : product
                    ),
                }), false, "TOGGLE_STATE_PRODUCT");
                useAlertStore.getState().alert(`El producto ha cambiado su estado correctamente`, "success");
            } else {
                useAlertStore.getState().alert("Error al eliminar el documento", "error");
            }
        } catch (error) {

        }
    },
    getCodeProduct: async (empresa_id: number) => {
        console.log(empresa_id)
        try {
            const resp: any = await get(`producto/empresa/${empresa_id}/codigo-siguiente`);
            console.log(resp)
            if (resp.code === 1) {
                set((_state) => ({
                    productCode: resp.data?.codigo
                }), false, "GET_PRODUCT_NEXT_CODE");
            } else {
                useAlertStore.getState().alert("Error al encontrar el codigo siguiente del producto", "error");
            }
        } catch (error) {

        }
    },
    resetProducts: async () => {
        try {
            set(
                (_state) => ({
                    products: []
                }),
                false,
                'RESET_CLIENTS'
            );
        } catch (error) {
            console.log(error);
        }
    },
    exportProducts: async (empresaId: number, search?: string) => {
        try {
            useAlertStore.setState({ loading: true });
            const baseUrl = import.meta.env.VITE_API_URL as string;
            const qs = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`${baseUrl}/producto/empresa/${empresaId}/exportar-archivo${qs}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
                },
            });
            if (!response.ok) {
                throw new Error('Error al descargar el archivo');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'productos.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            useAlertStore.setState({ success: true });
            useAlertStore.getState().alert('Exportación exitosa', 'success');
        } catch (error: any) {
            console.error('Error en exportProducts:', error.message || error);
            useAlertStore.getState().alert(error.message || 'Error al exportar los productos', 'error');
        } finally {
            useAlertStore.setState({ loading: false });
        }
    },
    importProducts: async (file: File) => {
        try {
            useAlertStore.setState({ loading: true });

            const formData = new FormData();
            formData.append('file', file);
            console.log('Archivo enviado:', {
                name: file.name,
                size: file.size,
                type: file.type,
            });
            const baseUrl = import.meta.env.VITE_API_URL as string;
            const response = await fetch(`${baseUrl}/producto/carga-masiva`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al importar los productos');
            }

            if (result.code === 1) {
                useAlertStore.setState({ success: true });
                useAlertStore.getState().alert('Productos importados exitosamente', 'success');
            } else {
                throw new Error(result.message || 'Error al importar los productos');
            }
        } catch (error: any) {
            console.error('Error en importProducts:', error.message || error);
            useAlertStore.getState().alert(error.message || 'Error al importar los productos', 'error');
        } finally {
            useAlertStore.setState({ loading: false });
        }
    },
})));


