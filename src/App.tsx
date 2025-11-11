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
import CajaDashboard from './pages/admin/caja/Dashboard'
import HistorialCaja from './pages/admin/caja/Historial'
import ArqueoCajaNew from './pages/admin/caja/Arqueo'
import ComprobantesPage from './pages/admin/facturacion/Comprobantes'
import ComprobantesInformales from './pages/admin/facturacion/ComprobantesInformales'
import Invoice from './pages/admin/facturacion/Nuevo'
import Pagos from './pages/admin/facturacion/Pagos'
import EmpresasIndex from './pages/admin/empresa/Index'
import CreateEmpresa from './pages/admin/empresa/Create'
import EditEmpresa from './pages/admin/empresa/Edit'
import PerfilIndex from './pages/admin/perfil/Index'
import KardexIndex from './pages/admin/kardex/Index'
import InventarioDashboard from './pages/admin/kardex/Dashboard'
import KardexProductos from './pages/admin/kardex/Productos'
import UsuariosIndex from './pages/admin/usuarios/Index'
import NotificacionesIndex from './pages/admin/notificaciones/Index'
import ReporteTurno from './pages/admin/caja/ReporteTurno'
import ReporteUsuarios from './pages/admin/caja/ReporteUsuarios'

function App() {
  console.log('App initialized')
  return (
    <BrowserRouter>
      <Alert />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="empresas/crear" element={<CreateEmpresa />} />
          <Route path="empresas/editar/:id" element={<EditEmpresa />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="contabilidad/reporte" element={<ReporteContabilidad />} />
          <Route path="contabilidad/reporte-informales" element={<ReporteInformales />} />
          <Route path="contabilidad/arqueo" element={<ArqueoCaja />} />
          <Route path="caja" element={<CajaDashboard />} />
          <Route path="caja/historial" element={<HistorialCaja />} />
          <Route path="caja/arqueo" element={<ArqueoCajaNew />} />
          <Route path="caja/reporte-turno" element={<ReporteTurno />} />
          <Route path="caja/reporte-usuarios" element={<ReporteUsuarios />} />
          <Route path="facturacion/comprobantes" element={<ComprobantesPage />} />
          <Route path="facturacion/comprobantes-informales" element={<ComprobantesInformales />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="facturacion/nuevo" element={<Invoice />} />
          <Route path="kardex" element={<KardexIndex />} />
          <Route path="kardex/productos" element={<KardexProductos />} />
          <Route path="kardex/dashboard" element={<InventarioDashboard />} />
          <Route path="usuarios" element={<UsuariosIndex />} />
          <Route path="notificaciones" element={<NotificacionesIndex />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
