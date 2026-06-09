import { useState, useEffect, useCallback } from 'react';
import { get } from '@/utils/fetch';
import { ResumenEcommerceResponse } from './ResumenModel';

export function useResumenViewModel() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [data, setData] = useState<ResumenEcommerceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await get<ResumenEcommerceResponse>(`/finanzas/ecommerce?mes=${mes}&anio=${anio}`);
      setData(res.data ?? null);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [mes, anio]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navegarMes = (delta: number) => {
    let m = mes + delta;
    let a = anio;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m);
    setAnio(a);
  };

  const esMesActual = mes === now.getMonth() + 1 && anio === now.getFullYear();

  return { mes, anio, data, isLoading, navegarMes, esMesActual };
}
