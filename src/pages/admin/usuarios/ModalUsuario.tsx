import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import { useUsersStore, IUsuario, IFormUsuario, MODULOS_SISTEMA } from '@/zustand/users';
import useAlertStore from '@/zustand/alert';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: IUsuario | null;
  isEdit: boolean;
}

const ModalUsuario: React.FC<Props> = ({ isOpen, onClose, user, isEdit }) => {
  const { createUser, updateUser, loading } = useUsersStore();
  const { alert } = useAlertStore();

  const [formData, setFormData] = useState<IFormUsuario>({
    nombre: '',
    email: '',
    dni: '',
    celular: '',
    password: '',
    permisos: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        dni: user.dni,
        celular: user.celular,
        password: '', // No mostramos la contraseña actual
        permisos: user.permisos || [],
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        dni: '',
        celular: '',
        password: '',
        permisos: [],
      });
    }
    setErrors({});
  }, [user, isEdit, isOpen]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePermisoToggle = (moduloId: string) => {
    setFormData(prev => {
      const nuevosPermisos = prev.permisos.includes(moduloId)
        ? prev.permisos.filter(p => p !== moduloId)
        : [...prev.permisos, moduloId];
      
      return { ...prev, permisos: nuevosPermisos };
    });
  };

  const handleAccesoCompleto = () => {
    const tieneAccesoCompleto = formData.permisos.includes('*');
    setFormData(prev => ({
      ...prev,
      permisos: tieneAccesoCompleto ? [] : ['*']
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.celular.trim()) {
      newErrors.celular = 'El celular es obligatorio';
    } else if (!/^\d{9}$/.test(formData.celular)) {
      newErrors.celular = 'El celular debe tener 9 dígitos';
    }

    if (!isEdit && !formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.permisos.length === 0) {
      newErrors.permisos = 'Debe asignar al menos un permiso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEdit && user) {
        const updateData: Partial<IFormUsuario> = { ...formData };
        // Si no se cambió la contraseña, no la enviar
        if (!formData.password) {
          delete updateData.password;
        }
        await updateUser(user.id, updateData);
      } else {
        await createUser(formData);
      }
      onClose();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
    }
  };

  const tieneAccesoCompleto = formData.permisos.includes('*');

  return (
    <Modal
      isOpenModal={isOpen}
      closeModal={onClose}
      title={`${isEdit ? 'Editar' : 'Crear'} Usuario`}
      width="800px"
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Información Personal */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="mdi:account" width={20} height={20} />
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputPro
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              label="Nombre completo"
              isLabel
              error={errors.nombre}
              placeholder="Juan Pérez García"
            />
            
            <InputPro
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              label="Correo electrónico"
              isLabel
              error={errors.email}
              placeholder="usuario@empresa.com"
            />
            
            <InputPro
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              label="DNI"
              isLabel
              error={errors.dni}
              placeholder="12345678"
              maxLength={8}
            />
            
            <InputPro
              type="text"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              label="Celular"
              isLabel
              error={errors.celular}
              placeholder="987654321"
              maxLength={9}
            />
          </div>
        </div>

        {/* Credenciales */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="mdi:key" width={20} height={20} />
            Credenciales de Acceso
          </h3>
          
          <div className="relative">
            <InputPro
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              label={isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              isLabel
              error={errors.password}
              placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              <Icon 
                icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                width={20} 
                height={20} 
              />
            </button>
          </div>
        </div>

        {/* Permisos */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="mdi:shield-account" width={20} height={20} />
            Permisos de Acceso
          </h3>

          {errors.permisos && (
            <p className="text-red-600 text-sm mb-4">{errors.permisos}</p>
          )}
          
          {/* Acceso completo */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-colors">
              <input
                type="checkbox"
                checked={tieneAccesoCompleto}
                onChange={handleAccesoCompleto}
                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:key" width={20} height={20} className="text-green-600" />
                  <span className="font-medium text-gray-900">Acceso Completo</span>
                </div>
                <p className="text-sm text-gray-600">
                  Otorga acceso a todos los módulos del sistema
                </p>
              </div>
            </label>
          </div>

          {/* Permisos específicos */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-700 mb-3">
              O selecciona módulos específicos:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODULOS_SISTEMA.map((modulo) => (
                <label
                  key={modulo.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    tieneAccesoCompleto
                      ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      : formData.permisos.includes(modulo.id)
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tieneAccesoCompleto || formData.permisos.includes(modulo.id)}
                    onChange={() => !tieneAccesoCompleto && handlePermisoToggle(modulo.id)}
                    disabled={tieneAccesoCompleto}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={getModuleIcon(modulo.id)}
                        width={18}
                        height={18}
                        className="text-gray-600"
                      />
                      <span className="font-medium text-gray-900">{modulo.nombre}</span>
                    </div>
                    <p className="text-sm text-gray-600">{modulo.descripcion}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            color="black"
            outline
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            color="secondary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon icon="mdi:loading" width={20} height={20} className="animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Icon 
                  icon={isEdit ? "mdi:content-save" : "mdi:account-plus"} 
                  width={20} 
                  height={20} 
                  className="mr-2" 
                />
                {isEdit ? 'Actualizar' : 'Crear'} Usuario
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Función auxiliar para obtener iconos por módulo
const getModuleIcon = (moduleId: string): string => {
  const iconMap: Record<string, string> = {
    dashboard: 'mdi:view-dashboard',
    comprobantes: 'mdi:receipt',
    clientes: 'mdi:account-group',
    kardex: 'mdi:package-variant',
    reportes: 'mdi:chart-line',
    configuracion: 'mdi:cog',
    usuarios: 'mdi:account-multiple',
    caja: 'mdi:cash-register',
    pagos: 'mdi:credit-card-outline',
  };
  
  return iconMap[moduleId] || 'mdi:circle';
};

export default ModalUsuario;