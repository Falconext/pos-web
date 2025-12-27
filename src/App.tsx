import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Alert from './components/Alert'
import LoginPage from './pages/Login'
// import DashboardPage from './pages/Dashboard' 
import { ProtectedRoute } from './app/ProtectedRoute'
import AdminIndex from './pages/admin/Index'
import AdminLayout from './layouts/AdminLayout'
import ClientesPage from './pages/admin/Clientes'
import ReporteContabilidad from './pages/admin/contabilidad/Reporte'
import ReporteInformales from './pages/admin/contabilidad/ReporteInformales'
import ArqueoCaja from './pages/admin/contabilidad/Arqueo'
import CajaIndex from './pages/admin/caja/Index'
import ComprobantesPage from './pages/admin/facturacion/Comprobantes'
import ComprobantesInformales from './pages/admin/facturacion/ComprobantesInformales'
import Invoice from './pages/admin/facturacion/Nuevo'
import Pagos from './pages/admin/facturacion/Pagos'
import EmpresasIndex from './pages/admin/empresa/Index'
import PerfilIndex from './pages/admin/perfil/Index'
import KardexIndex from './pages/admin/kardex/Index'
import InventarioDashboard from './pages/admin/kardex/Dashboard'
import KardexProductos from './pages/admin/kardex/Productos'
import UsuariosIndex from './pages/admin/usuarios/Index'
import NotificacionesIndex from './pages/admin/notificaciones/Index'
import ConfiguracionTienda from './pages/admin/tienda/Configuracion'
import PedidosTienda from './pages/admin/tienda/Pedidos'
import CombosTienda from './pages/admin/tienda/Combos'
import ModificadoresTienda from './pages/admin/tienda/Modificadores'
import TiendaPublica from './pages/tienda/[slug]'
import ProductoDetalle from './pages/tienda/ProductoDetalle'
import Checkout from './pages/tienda/Checkout'
import SeguimientoPedido from './pages/tienda/SeguimientoPedido'
import TiendaLogin from './pages/TiendaLogin'
import TiendaHome from './pages/TiendaHome'
import DisenoRubros from './pages/admin/sistema/DisenoRubros'
import CatalogoGlobal from './pages/admin/sistema/CatalogoGlobal'

function App() {
  console.log('App initialized - Checkpoint')
  return (
    <BrowserRouter>
      <Alert />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Login específico para tienda (mismo backend, layout invertido) */}
        <Route path="/tienda/login" element={<TiendaLogin />} />
        {/* <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/administrador"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route path="perfil" element={<PerfilIndex />} />
          <Route path="empresas" element={<EmpresasIndex />} />
          {/* Rutas de crear/editar migradas a modal: redirigir al listado */}
          <Route path="empresas/crear" element={<Navigate to="/administrador/empresas" replace />} />
          <Route path="empresas/editar/:id" element={<Navigate to="/administrador/empresas" replace />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="contabilidad/reporte" element={<ReporteContabilidad />} />
          <Route path="contabilidad/reporte-informales" element={<ReporteInformales />} />
          <Route path="contabilidad/arqueo" element={<ArqueoCaja />} />
          <Route path="caja" element={<CajaIndex />} />
          <Route path="facturacion/comprobantes" element={<ComprobantesPage />} />
          <Route path="facturacion/comprobantes-informales" element={<ComprobantesInformales />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="facturacion/nuevo" element={<Invoice />} />
          <Route path="kardex" element={<KardexIndex />} />
          <Route path="kardex/productos" element={<KardexProductos />} />
          <Route path="kardex/combos" element={<CombosTienda />} />
          <Route path="kardex/dashboard" element={<InventarioDashboard />} />
          <Route path="usuarios" element={<UsuariosIndex />} />
          <Route path="notificaciones" element={<NotificacionesIndex />} />
          <Route path="tienda/configuracion" element={<ConfiguracionTienda />} />
          <Route path="tienda/pedidos" element={<PedidosTienda />} />
          <Route path="tienda/combos" element={<CombosTienda />} />
          <Route path="tienda/modificadores" element={<ModificadoresTienda />} />
          {/* Rutas de ADMIN_SISTEMA */}
          <Route path="sistema/diseno-rubros" element={<DisenoRubros />} />
          <Route path="sistema/catalogo-global" element={<CatalogoGlobal />} />
        </Route>
        {/* Rutas de tienda */}
        {/* Home de tienda para emprendedor (requiere estar logueado, usa mismo token) */}
        <Route path="/tienda/home" element={<TiendaHome />} />
        {/* Rutas públicas de tienda para clientes finales */}
        <Route path="/tienda/:slug" element={<TiendaPublica />} />
        <Route path="/tienda/:slug/producto/:id" element={<ProductoDetalle />} />
        <Route path="/tienda/:slug/checkout" element={<Checkout />} />
        <Route path="/tienda/:slug/seguimiento" element={<SeguimientoPedido />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
