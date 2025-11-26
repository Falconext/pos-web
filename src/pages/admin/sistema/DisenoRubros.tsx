import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import Button from '@/components/Button';

interface Rubro {
  id: number;
  nombre: string;
}

interface DisenoRubro {
  id?: number;
  rubroId: number;
  colorPrimario: string;
  colorSecundario: string;
  colorAccento: string;
  tipografia: string;
  espaciado: string;
  bordeRadius: string;
  estiloBoton: string;
  plantillaId: string;
  vistaProductos?: string;
  tiempoEntregaMin?: number;
  tiempoEntregaMax?: number;
}

const PLANTILLAS = [
  { id: 'moderna', nombre: 'Moderna', descripcion: 'Diseño minimalista con espacios amplios' },
  { id: 'clasica', nombre: 'Clásica', descripcion: 'Diseño tradicional y elegante' },
  { id: 'vibrante', nombre: 'Vibrante', descripcion: 'Colores intensos y llamativos' },
  { id: 'minimalista', nombre: 'Minimalista', descripcion: 'Simplicidad y funcionalidad' },
];

const TIPOGRAFIAS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Lato',
];

export default function DisenoRubros() {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<number | null>(null);
  const [diseno, setDiseno] = useState<DisenoRubro>({
    rubroId: 0,
    colorPrimario: '#6A6CFF',
    colorSecundario: '#ffffff',
    colorAccento: '#FF6B6B',
    tipografia: 'Inter',
    espaciado: 'normal',
    bordeRadius: 'medium',
    estiloBoton: 'rounded',
    plantillaId: 'moderna',
    vistaProductos: 'cards',
    tiempoEntregaMin: 15,
    tiempoEntregaMax: 25,
  });
  const [loading, setLoading] = useState(false);
  const { alert } = useAlertStore();

  useEffect(() => {
    cargarRubros();
  }, []);

  useEffect(() => {
    if (rubroSeleccionado) {
      cargarDisenoRubro(rubroSeleccionado);
    }
  }, [rubroSeleccionado]);

  const cargarRubros = async () => {
    try {
      const { data } = await apiClient.get('/extensiones/rubros');
      setRubros(data.data || []);
    } catch (error: any) {
      alert('Error al cargar rubros', 'error');
    }
  };

  const cargarDisenoRubro = async (rubroId: number) => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/diseno-rubro/${rubroId}`);
      // El backend puede devolver data o data.data según el interceptor
      const disenoData = data?.data || data;
      if (disenoData && disenoData.id) {
        setDiseno(disenoData);
      } else {
        // Si no hay diseño, usar valores por defecto
        setDiseno({
          rubroId,
          colorPrimario: '#6A6CFF',
          colorSecundario: '#ffffff',
          colorAccento: '#FF6B6B',
          tipografia: 'Inter',
          espaciado: 'normal',
          bordeRadius: 'medium',
          estiloBoton: 'rounded',
          plantillaId: 'moderna',
          vistaProductos: 'cards',
          tiempoEntregaMin: 15,
          tiempoEntregaMax: 25,
        });
      }
    } catch (error: any) {
      // Si no existe, inicializar con valores por defecto
      setDiseno({
        rubroId,
        colorPrimario: '#6A6CFF',
        colorSecundario: '#ffffff',
        colorAccento: '#FF6B6B',
        tipografia: 'Inter',
        espaciado: 'normal',
        bordeRadius: 'medium',
        estiloBoton: 'rounded',
        plantillaId: 'moderna',
        vistaProductos: 'cards',
        tiempoEntregaMin: 15,
        tiempoEntregaMax: 25,
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarDiseno = async () => {
    if (!rubroSeleccionado) {
      alert('Selecciona un rubro', 'error');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(`/diseno-rubro/${rubroSeleccionado}`, diseno);
      alert('Diseño guardado correctamente', 'success');
      cargarDisenoRubro(rubroSeleccionado);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar diseño', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración de Diseño por Rubro</h1>
        <p className="text-gray-600">Personaliza el diseño de las tiendas virtuales según su rubro</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista de Rubros */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Rubros</h2>
            <div className="space-y-2">
              {rubros.map((rubro) => (
                <button
                  key={rubro.id}
                  onClick={() => setRubroSeleccionado(rubro.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    rubroSeleccionado === rubro.id
                      ? 'bg-[#6A6CFF] text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {rubro.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Configuración */}
        <div className="md:col-span-2">
          {rubroSeleccionado ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold text-lg mb-6">
                Configurar Diseño -{' '}
                {rubros.find((r) => r.id === rubroSeleccionado)?.nombre}
              </h2>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Plantilla Base */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Plantilla Base</label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {PLANTILLAS.map((plantilla) => (
                        <button
                          key={plantilla.id}
                          onClick={() => setDiseno({ ...diseno, plantillaId: plantilla.id })}
                          className={`p-4 rounded-lg border-2 text-left transition-colors ${
                            diseno.plantillaId === plantilla.id
                              ? 'border-[#6A6CFF] bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{plantilla.nombre}</div>
                          <div className="text-sm text-gray-600">{plantilla.descripcion}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colores */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Color Primario</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={diseno.colorPrimario}
                          onChange={(e) => setDiseno({ ...diseno, colorPrimario: e.target.value })}
                          className="w-16 h-10 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={diseno.colorPrimario}
                          onChange={(e) => setDiseno({ ...diseno, colorPrimario: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Color Secundario</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={diseno.colorSecundario}
                          onChange={(e) => setDiseno({ ...diseno, colorSecundario: e.target.value })}
                          className="w-16 h-10 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={diseno.colorSecundario}
                          onChange={(e) => setDiseno({ ...diseno, colorSecundario: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Color Acento</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={diseno.colorAccento}
                          onChange={(e) => setDiseno({ ...diseno, colorAccento: e.target.value })}
                          className="w-16 h-10 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={diseno.colorAccento}
                          onChange={(e) => setDiseno({ ...diseno, colorAccento: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tipografía */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipografía</label>
                    <select
                      value={diseno.tipografia}
                      onChange={(e) => setDiseno({ ...diseno, tipografia: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {TIPOGRAFIAS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Espaciado y Bordes */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Espaciado</label>
                      <select
                        value={diseno.espaciado}
                        onChange={(e) => setDiseno({ ...diseno, espaciado: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="compact">Compacto</option>
                        <option value="normal">Normal</option>
                        <option value="spacious">Espacioso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Radio de Bordes</label>
                      <select
                        value={diseno.bordeRadius}
                        onChange={(e) => setDiseno({ ...diseno, bordeRadius: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="none">Sin bordes</option>
                        <option value="small">Pequeño</option>
                        <option value="medium">Mediano</option>
                        <option value="large">Grande</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Estilo de Botón</label>
                      <select
                        value={diseno.estiloBoton}
                        onChange={(e) => setDiseno({ ...diseno, estiloBoton: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="rounded">Redondeado</option>
                        <option value="square">Cuadrado</option>
                        <option value="pill">Píldora</option>
                      </select>
                    </div>
                  </div>

                  {/* Vista de Productos y Tiempo de Entrega */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Vista de Productos</label>
                      <select
                        value={diseno.vistaProductos || 'cards'}
                        onChange={(e) => setDiseno({ ...diseno, vistaProductos: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="cards">Cards (Restaurantes)</option>
                        <option value="lista">Lista (Bodegas)</option>
                        <option value="tabla">Tabla (Ferreterías)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tiempo Mínimo (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={diseno.tiempoEntregaMin || 15}
                        onChange={(e) => setDiseno({ ...diseno, tiempoEntregaMin: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tiempo Máximo (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={diseno.tiempoEntregaMax || 25}
                        onChange={(e) => setDiseno({ ...diseno, tiempoEntregaMax: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Vista Previa */}
                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Vista Previa</h3>
                    <div
                      className="p-6 rounded-lg"
                      style={{
                        backgroundColor: diseno.colorSecundario,
                        fontFamily: diseno.tipografia,
                      }}
                    >
                      <button
                        className="px-6 py-3 text-white font-medium"
                        style={{
                          backgroundColor: diseno.colorPrimario,
                          borderRadius:
                            diseno.bordeRadius === 'none'
                              ? '0'
                              : diseno.bordeRadius === 'small'
                              ? '4px'
                              : diseno.bordeRadius === 'medium'
                              ? '8px'
                              : '16px',
                        }}
                      >
                        Botón de Ejemplo
                      </button>
                      <div className="mt-4">
                        <h4
                          className="text-2xl font-bold"
                          style={{ color: diseno.colorPrimario }}
                        >
                          Título de Ejemplo
                        </h4>
                        <p className="mt-2 text-gray-700">
                          Este es un texto de ejemplo para mostrar cómo se verá el diseño en la
                          tienda virtual.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón Guardar */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button color="lila" onClick={guardarDiseno} disabled={loading}>
                      {loading ? (
                        <>
                          <Icon icon="eos-icons:loading" className="mr-2" width={20} />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:content-save" className="mr-2" width={20} />
                          Guardar Diseño
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Icon icon="mdi:palette-outline" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Selecciona un rubro para configurar su diseño</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
