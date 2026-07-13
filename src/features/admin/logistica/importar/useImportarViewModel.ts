import { useState } from 'react';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import { TipoImport, IResultadoImport } from './ImportarModel';

const leerBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function useImportarViewModel() {
  const alertStore = useAlertStore();
  const [tipo, setTipo] = useState<TipoImport>('vehiculos');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<IResultadoImport | null>(null);
  const [cargando, setCargando] = useState(false);

  const cambiarTipo = (t: TipoImport) => {
    setTipo(t);
    setArchivo(null);
    setResultado(null);
  };

  const importar = async () => {
    if (!archivo) {
      alertStore.alert('Selecciona un archivo Excel primero', 'error');
      return;
    }
    setCargando(true);
    setResultado(null);
    try {
      const base64 = await leerBase64(archivo);
      const res =
        tipo === 'vehiculos'
          ? await api.importarVehiculosExcel(base64)
          : await api.importarConductoresExcel(base64);
      if (res.success) {
        setResultado(res.data as IResultadoImport);
        alertStore.alert(`Importación completada: ${(res.data as IResultadoImport).creados} creados`, 'success');
      }
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al importar', 'error');
    } finally {
      setCargando(false);
    }
  };

  const descargarPlantilla = async () => {
    try {
      const res = await api.getPlantillaImport(tipo);
      if (res.success) {
        const { nombreArchivo, base64 } = res.data as { nombreArchivo: string; base64: string };
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alertStore.alert(e.message || 'Error al descargar plantilla', 'error');
    }
  };

  return {
    tipo,
    cambiarTipo,
    archivo,
    setArchivo,
    resultado,
    cargando,
    importar,
    descargarPlantilla,
  };
}
