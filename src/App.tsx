import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { cargaPerezosa } from './lib/cargaPerezosa'
import Alert from './components/Alert'
import PantallaNoCargo from './components/PantallaNoCargo'
const LoginPage = cargaPerezosa(() => import('./pages/Login'))
const StorePreviewPage = cargaPerezosa(() => import('./pages/StorePreviewPage'))
// import DashboardPage from './pages/Dashboard' 
import { ProtectedRoute } from './app/ProtectedRoute'
import { RoleRoute } from './app/RoleRoute'
import { ProduccionRoute } from './app/ProduccionRoute'
import { ModuleRoute } from './app/ModuleRoute'
const AdminIndex = cargaPerezosa(() => import('./pages/admin/Index'))
const AdminLayout = cargaPerezosa(() => import('./layouts/AdminLayout'))
const ClientesPage = cargaPerezosa(() => import('./pages/admin/Clientes'))
const DoctorsPage = cargaPerezosa(() => import('./pages/admin/Doctors'))
const ReporteContabilidad = cargaPerezosa(() => import('./pages/admin/contabilidad/Reporte'))
const ReporteInformales = cargaPerezosa(() => import('./pages/admin/contabilidad/ReporteInformales'))
const ArqueoCaja = cargaPerezosa(() => import('./pages/admin/contabilidad/Arqueo'))
const CajaIndex = cargaPerezosa(() => import('./pages/admin/caja/Index'))
const ComprobantesPage = cargaPerezosa(() => import('./pages/admin/facturacion/Comprobantes'))
const ComprobantesInformales = cargaPerezosa(() => import('./pages/admin/facturacion/ComprobantesInformales'))
const Invoice = cargaPerezosa(() => import('./pages/admin/facturacion/Nuevo'))
const Pagos = cargaPerezosa(() => import('./pages/admin/facturacion/Pagos'))
const CuentasPorCobrar = cargaPerezosa(() => import('./pages/admin/facturacion/CuentasPorCobrar'))
const Cotizaciones = cargaPerezosa(() => import('./pages/admin/cotizaciones/Cotizaciones'))
const EmpresasIndex = cargaPerezosa(() => import('./pages/admin/empresa/Index'))
const PerfilIndex = cargaPerezosa(() => import('./pages/admin/perfil/Index'))
const KardexIndex = cargaPerezosa(() => import('./pages/admin/kardex/Index'))
const InventarioDashboard = cargaPerezosa(() => import('./pages/admin/kardex/Dashboard'))
const KardexProductos = cargaPerezosa(() => import('./pages/admin/kardex/Productos'))
const ReprecioMasivo = cargaPerezosa(() => import('./pages/admin/listas-precio/ReprecioMasivo'))
const KardexMermas = cargaPerezosa(() => import('./pages/admin/kardex/mermas'))
const ApiKrezka = cargaPerezosa(() => import('./features/admin/apiKrezka/ApiKrezkaView'))
const KardexEntradasSalidas = cargaPerezosa(() => import('./pages/admin/kardex/entradasSalidas'))
const KardexTraslados = cargaPerezosa(() => import('./pages/admin/kardex/Traslados'))
const Lotes = cargaPerezosa(() => import('./pages/admin/kardex/Lotes'))
const LibroControl = cargaPerezosa(() => import('./pages/admin/kardex/LibroControl'))
const SeriesGarantias = cargaPerezosa(() => import('./pages/admin/kardex/SeriesGarantias'))
const UsuariosIndex = cargaPerezosa(() => import('./pages/admin/usuarios/Index'))
const VendedoresView = cargaPerezosa(() => import('./features/admin/users/VendedoresView'))
const SedesIndex = cargaPerezosa(() => import('./pages/admin/sedes/Index'))
const ListasPrecioIndex = cargaPerezosa(() => import('./pages/admin/listas-precio/Index'))
const InstagramCallback = cargaPerezosa(() => import('./pages/admin/instagram/Callback'))
const MessengerCallback = cargaPerezosa(() => import('./pages/admin/messenger/Callback'))
const NotificacionesIndex = cargaPerezosa(() => import('./pages/admin/notificaciones/Index'))
const ConfiguracionTienda = cargaPerezosa(() => import('./pages/admin/tienda/Configuracion'))
const TemplateTienda = cargaPerezosa(() => import('./pages/admin/tienda/Template'))
const PedidosTienda = cargaPerezosa(() => import('./pages/admin/tienda/Pedidos'))
const ReviewsTienda = cargaPerezosa(() => import('./pages/admin/tienda/Reviews'))
const BlogTienda = cargaPerezosa(() => import('./pages/admin/tienda/Blog'))
const PanelVentasView = cargaPerezosa(() => import('./pages/admin/despacho/PanelVentasView'))
const CouriersView = cargaPerezosa(() => import('./features/admin/despacho/couriers/CouriersView'))
const RepartidoresView = cargaPerezosa(() => import('./pages/admin/repartidores/RepartidoresView'))
const CombosTienda = cargaPerezosa(() => import('./pages/admin/tienda/Combos'))
const ModificadoresTienda = cargaPerezosa(() => import('./pages/admin/tienda/Modificadores'))
const TiendaPublica = cargaPerezosa(() => import('./pages/tienda/[slug]'))
const ProductoDetalle = cargaPerezosa(() => import('./pages/tienda/ProductoDetalle'))
const ProductoDetalleRouter = cargaPerezosa(() => import('./pages/tienda/ProductoDetalleRouter'))
const Checkout = cargaPerezosa(() => import('./pages/tienda/Checkout'))
const Catalogo = cargaPerezosa(() => import('./pages/tienda/Catalogo'))
const SeguimientoPedido = cargaPerezosa(() => import('./pages/tienda/SeguimientoPedido'))
const ContactoRouter = cargaPerezosa(() => import('./pages/tienda/ContactoRouter'))
const BlogRouter = cargaPerezosa(() => import('./pages/tienda/BlogRouter'))
const TiendaLogin = cargaPerezosa(() => import('./pages/TiendaLogin'))
const TiendaHome = cargaPerezosa(() => import('./pages/TiendaHome'))

const CatalogoGlobal = cargaPerezosa(() => import('./pages/admin/sistema/CatalogoGlobal'))
const Planes = cargaPerezosa(() => import('./pages/admin/sistema/Planes'))
const ModulosPage = cargaPerezosa(() => import('./pages/admin/sistema/Modulos'))
const FinanceDashboard = cargaPerezosa(() => import('./pages/admin/finanzas/Dashboard'))
const MisComisionesPage = cargaPerezosa(() => import('./pages/admin/mis-comisiones/MisComisionesPage'))
const Campanas = cargaPerezosa(() => import('./pages/admin/marketing/Campanas'))
const ResumenNegocio = cargaPerezosa(() => import('./pages/admin/ecommerce/ResumenNegocio'))
const ComprasIndex = cargaPerezosa(() => import('./pages/admin/compras/Index'))
const ProveedoresPage = cargaPerezosa(() => import('./pages/admin/compras/Proveedores'))
const OrdenesCompraPage = cargaPerezosa(() => import('./pages/admin/compras/OrdenesCompra'))
const GuiaRemision = cargaPerezosa(() => import('./pages/admin/guia-remision/GuiaRemision'))
const LibroVentas = cargaPerezosa(() => import('./pages/admin/sire/LibroVentas'))
const LibroCompras = cargaPerezosa(() => import('./pages/admin/sire/LibroCompras'))
const AdminResellers = cargaPerezosa(() => import('./pages/admin/sistema/Resellers'))
const CatalogoWebPage = cargaPerezosa(() => import('./pages/admin/sistema/CatalogoWebPage'))
const SistemaUsuarios = cargaPerezosa(() => import('./pages/admin/sistema/SistemaUsuarios'))
const SistemaFinanzas = cargaPerezosa(() => import('./pages/admin/sistema/SistemaFinanzas'))
const SistemaCobros = cargaPerezosa(() => import('./pages/admin/sistema/Cobros'))
const MiPlan = cargaPerezosa(() => import('./pages/admin/MiPlan'))
const SistemaRubros = cargaPerezosa(() => import('./pages/admin/sistema/SistemaRubros'))
const DisenoRubroPage = cargaPerezosa(() => import('./pages/admin/sistema/DisenoRubroPage'))
const ResellerLayout = cargaPerezosa(() => import('./layouts/ResellerLayout'))
const ResellerDashboard = cargaPerezosa(() => import('./pages/reseller/Dashboard'))
const ResellerClientes = cargaPerezosa(() => import('./pages/reseller/Clientes'))
const ResellerRecargas = cargaPerezosa(() => import('./pages/reseller/Recargas'))
const ResellerEstadoCuenta = cargaPerezosa(() => import('./pages/reseller/EstadoCuenta'))
const SedeSelectionScreen = cargaPerezosa(() => import('./features/auth/sede-selection/SedeSelectionScreen'))
const ForgotPasswordPage = cargaPerezosa(() => import('./pages/ForgotPassword'))
const ResetPasswordPage = cargaPerezosa(() => import('./pages/ResetPassword'))
const ProduccionRecetasPage = cargaPerezosa(() => import('./pages/admin/produccion/Recetas'))
const ProduccionOrdenesPage = cargaPerezosa(() => import('./pages/admin/produccion/Ordenes'))
const ReservasPage = cargaPerezosa(() => import('./pages/admin/reservas/ReservasPage'))
const SistemaSoporte = cargaPerezosa(() => import('./pages/admin/sistema/Soporte'))
const VehiculosPage = cargaPerezosa(() => import('./pages/admin/vehiculos/Vehiculos'))
const ContratosVehicularesPage = cargaPerezosa(() => import('./pages/admin/vehiculos/ContratosVehiculares'))

// Módulo Logística
const LogisticaDashboard = cargaPerezosa(() => import('./features/admin/logistica/dashboard/LogisticaDashboard'))
const ConductoresPage = cargaPerezosa(() => import('./features/admin/logistica/conductores/ConductoresPage'))
const VehiculosLogisticaPage = cargaPerezosa(() => import('./features/admin/logistica/vehiculos/VehiculosPage'))
const AlmacenesPage = cargaPerezosa(() => import('./features/admin/logistica/almacenes/AlmacenesPage'))
const ZonasPage = cargaPerezosa(() => import('./features/admin/logistica/zonas/ZonasPage'))
const ClientesLogisticaPage = cargaPerezosa(() => import('./features/admin/logistica/clientes/ClientesLogisticaPage'))
const PedidosLogisticaPage = cargaPerezosa(() => import('./features/admin/logistica/pedidos/PedidosLogisticaPage'))
const DespachosPage = cargaPerezosa(() => import('./features/admin/logistica/despachos/DespachosPage'))
const TrackingPage = cargaPerezosa(() => import('./features/admin/logistica/tracking/TrackingPage'))
const MantenimientoPage = cargaPerezosa(() => import('./features/admin/logistica/mantenimiento/MantenimientoPage'))
const CombustiblePage = cargaPerezosa(() => import('./features/admin/logistica/combustible/CombustiblePage'))
const PeajesPage = cargaPerezosa(() => import('./features/admin/logistica/peajes/PeajesPage'))
const DocumentosPage = cargaPerezosa(() => import('./features/admin/logistica/documentos/DocumentosPage'))
const DispositivosPage = cargaPerezosa(() => import('./features/admin/logistica/dispositivos/DispositivosPage'))
const GeocercasPage = cargaPerezosa(() => import('./features/admin/logistica/geocercas/GeocercasPage'))
const ImportarPage = cargaPerezosa(() => import('./features/admin/logistica/importar/ImportarPage'))
const IntegracionesPage = cargaPerezosa(() => import('./features/admin/logistica/integraciones/IntegracionesPage'))
const LeadsPage = cargaPerezosa(() => import('./features/admin/leads/LeadsPage'))
const PrivacidadPage = cargaPerezosa(() => import('./pages/legal/PrivacidadPage'))
const EntregaRepartidorPage = cargaPerezosa(() => import('./pages/entrega/EntregaRepartidorPage'))
const EliminarDatosPage = cargaPerezosa(() => import('./pages/legal/EliminarDatosPage'))
import SeoTienda from './components/tienda/SeoTienda'

function App() {
  console.log('App initialized - Checkpoint')
  return (
    <BrowserRouter>
      <SeoTienda />
      <Alert />
      {/* Cada pantalla se descarga al abrirla: quien entra a una tienda ya no baja
          el panel completo (antes, un solo archivo de 11 MB). */}
      <PantallaNoCargo>
      <Suspense fallback={<CargandoPagina />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Política de privacidad pública (requerida por Meta para publicar la app de WhatsApp) */}
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route path="/privacy" element={<PrivacidadPage />} />
        {/* Eliminación de datos (requerida por Meta para el App Review de WhatsApp) */}
        <Route path="/eliminar-datos" element={<EliminarDatosPage />} />
        <Route path="/data-deletion" element={<EliminarDatosPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
        {/* Redirects de compatibilidad para enlaces viejos */}
        <Route path="/forgot-password" element={<Navigate to="/recuperar-contrasena" replace />} />
        <Route path="/reset-password" element={<Navigate to="/restablecer-contrasena" replace />} />
        <Route path="/sede-seleccion" element={<SedeSelectionScreen />} />
        {/* La pantalla del repartidor. Pública a propósito: el motorizado no
            tiene cuenta y el token del enlace es su credencial — darle un
            usuario implicaría abrirle el módulo de Ventas entero. */}
        <Route path="/entrega/:token" element={<EntregaRepartidorPage />} />
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
          <Route path="instagram/callback" element={<InstagramCallback />} />
          <Route path="messenger/callback" element={<MessengerCallback />} />
          <Route path="empresas" element={<EmpresasIndex />} />
          {/* Rutas de crear/editar migradas a modal: redirigir al listado */}
          <Route path="empresas/crear" element={<Navigate to="/administrador/empresas" replace />} />
          <Route path="empresas/editar/:id" element={<Navigate to="/administrador/empresas" replace />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="medicos" element={<DoctorsPage />} />

          <Route path="compras" element={<ComprasIndex />} />
          <Route path="compras/proveedores" element={<ProveedoresPage />} />
          <Route path="compras/ordenes" element={<OrdenesCompraPage />} />
          <Route path="guia-remision" element={<GuiaRemision />} />
          <Route path="facturacion/guia-remision" element={<GuiaRemision />} />
          <Route path="contabilidad" element={<Navigate to="/administrador/contabilidad/reporte" replace />} />
          <Route path="contabilidad/reporte" element={<ReporteContabilidad />} />
          <Route path="contabilidad/reporte-informales" element={<ReporteInformales />} />
          <Route path="contabilidad/arqueo" element={<ArqueoCaja />} />
          <Route path="sire/ventas" element={<LibroVentas />} />
          <Route path="sire/compras" element={<LibroCompras />} />
          <Route path="caja" element={<CajaIndex />} />
          <Route path="ventas/caja" element={<CajaIndex />} />
          <Route path="facturacion/comprobantes" element={<ComprobantesPage />} />
          <Route path="facturacion/comprobantes-informales" element={<ComprobantesInformales />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="pagos/cuentas-cobrar" element={<CuentasPorCobrar />} />
          <Route path="ventas/couriers" element={<CouriersView />} />
          <Route path="ventas/pagos" element={<Pagos />} />
          <Route path="ventas/pagos/cuentas-cobrar" element={<CuentasPorCobrar />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/nuevo" element={<Invoice />} />
          <Route path="facturacion/cotizaciones" element={<Cotizaciones />} />
          <Route path="facturacion/cotizaciones/nuevo" element={<Invoice />} />
          <Route path="facturacion/nuevo" element={<Invoice />} />
          <Route path="finanzas/dashboard" element={<FinanceDashboard />} />
          <Route path="mi-negocio/marketing/finanzas" element={<FinanceDashboard />} />
          <Route path="mis-comisiones" element={<MisComisionesPage />} />
          <Route path="mi-negocio/marketing/campanas" element={<Campanas />} />
          <Route path="mi-negocio/resumen" element={<ResumenNegocio />} />
          <Route path="kardex" element={<KardexIndex />} />
          <Route path="kardex/productos" element={<KardexProductos />} />
          <Route path="kardex/traslados" element={<KardexTraslados />} />
          <Route path="kardex/lotes" element={<Lotes />} />
          <Route path="kardex/libro-control" element={<LibroControl />} />
          <Route path="kardex/mermas" element={<KardexMermas />} />
          <Route path="api-krezka" element={<ApiKrezka />} />
          <Route path="kardex/entradas-salidas" element={<KardexEntradasSalidas />} />
          <Route path="kardex/series-garantias" element={<SeriesGarantias />} />
          <Route path="reservas" element={<ReservasPage />} />
          {/* Alias: el submódulo kardex:reservas tuvo guardada esta ruta en BD y
              caía en el catch-all (→ login → dashboard). Se mantiene para no
              romper enlaces o marcadores viejos. */}
          <Route path="kardex/reservas" element={<Navigate to="/administrador/reservas" replace />} />
          <Route
            path="sistema/soporte"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <SistemaSoporte />
              </RoleRoute>
            }
          />
          <Route path="kardex/combos" element={<CombosTienda />} />
          <Route path="kardex/dashboard" element={<InventarioDashboard />} />
          <Route
            path="produccion/recetas"
            element={
              <ProduccionRoute>
                <ProduccionRecetasPage />
              </ProduccionRoute>
            }
          />
          <Route
            path="produccion/ordenes"
            element={
              <ProduccionRoute>
                <ProduccionOrdenesPage />
              </ProduccionRoute>
            }
          />
          <Route path="usuarios" element={<UsuariosIndex />} />
          <Route path="usuarios/vendedores" element={<VendedoresView />} />
          <Route path="usuarios/repartidores" element={<RepartidoresView />} />
          <Route path="usuarios/clientes" element={<ClientesPage />} />
          <Route path="usuarios/proveedores" element={<ProveedoresPage />} />
          <Route path="sedes" element={<SedesIndex />} />
          <Route path="listas-precio" element={<ListasPrecioIndex />} />
          <Route path="listas-precio/reprecio" element={<ReprecioMasivo />} />
          <Route path="notificaciones" element={<NotificacionesIndex />} />
          {/* Su propia suscripción: el empresario ve su plan y sus pagos. */}
          <Route path="mi-plan" element={<MiPlan />} />
          <Route path="tienda/configuracion" element={<ConfiguracionTienda />} />
          <Route path="tienda/template" element={<TemplateTienda />} />
          <Route path="tienda/pedidos" element={<PedidosTienda />} />
          <Route path="tienda/reviews" element={<ReviewsTienda />} />
          <Route path="tienda/blog" element={<BlogTienda />} />
          <Route path="ventas" element={<PanelVentasView />} />
          <Route path="repartidores" element={<RepartidoresView />} />
          <Route path="tienda/combos" element={<CombosTienda />} />
          <Route path="tienda/modificadores" element={<ModificadoresTienda />} />
          {/* Módulo Vehicular (GPS / Alarmas / Seguridad Electrónica) */}
          <Route path="vehiculos" element={<VehiculosPage />} />
          <Route path="vehiculos/contratos" element={<ContratosVehicularesPage />} />

          {/* Módulo Logística — gateado por el módulo 'logistica' del plan */}
          <Route element={<ModuleRoute module="logistica" />}>
            <Route path="logistica/dashboard" element={<LogisticaDashboard />} />
            <Route path="logistica/conductores" element={<ConductoresPage />} />
            <Route path="logistica/vehiculos" element={<VehiculosLogisticaPage />} />
            <Route path="logistica/almacenes" element={<AlmacenesPage />} />
            <Route path="logistica/zonas" element={<ZonasPage />} />
            <Route path="logistica/clientes" element={<ClientesLogisticaPage />} />
            <Route path="logistica/pedidos" element={<PedidosLogisticaPage />} />
            <Route path="logistica/despachos" element={<DespachosPage />} />
            <Route path="logistica/tracking" element={<TrackingPage />} />
            <Route path="logistica/mantenimiento" element={<MantenimientoPage />} />
            <Route path="logistica/combustible" element={<CombustiblePage />} />
            <Route path="logistica/peajes" element={<PeajesPage />} />
            <Route path="logistica/documentos" element={<DocumentosPage />} />
            <Route path="logistica/dispositivos" element={<DispositivosPage />} />
            <Route path="logistica/geocercas" element={<GeocercasPage />} />
            <Route path="logistica/importar" element={<ImportarPage />} />
            <Route path="logistica/integraciones" element={<IntegracionesPage />} />
          </Route>

          {/* Módulo IA de Ventas / Leads — gateado por el módulo 'leads' del plan */}
          <Route element={<ModuleRoute module="leads" />}>
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/:vista" element={<LeadsPage />} />
          </Route>

          {/* Rutas de ADMIN_SISTEMA */}

          <Route
            path="sistema/rubros"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <SistemaRubros />
              </RoleRoute>
            }
          />
          <Route path="sistema/catalogo-global" element={<CatalogoGlobal />} />
          <Route path="sistema/planes" element={<Planes />} />
          <Route
            path="sistema/disenos-tienda"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <DisenoRubroPage />
              </RoleRoute>
            }
          />
          <Route path="sistema/modulos" element={<ModulosPage />} />
          <Route
            path="sistema/resellers"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <AdminResellers />
              </RoleRoute>
            }
          />
          <Route
            path="sistema/catalogo-web"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <CatalogoWebPage />
              </RoleRoute>
            }
          />
          <Route
            path="sistema/usuarios"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <SistemaUsuarios />
              </RoleRoute>
            }
          />
          <Route
            path="sistema/finanzas"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA", "ADMIN_EMPRESA"]} fallbackPath="/administrador">
                <SistemaFinanzas />
              </RoleRoute>
            }
          />
          {/* Cobros: solo ADMIN_SISTEMA. Acá se registra plata y se reactivan
              cuentas, así que no se comparte con ADMIN_EMPRESA como Finanzas. */}
          <Route
            path="sistema/cobros"
            element={
              <RoleRoute allowedRoles={["ADMIN_SISTEMA"]} fallbackPath="/administrador">
                <SistemaCobros />
              </RoleRoute>
            }
          />
        </Route>

        {/* Rutas de Reseller (Distribuidor) */}
        <Route
          path="/reseller"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["RESELLER"]} fallbackPath="/administrador">
                <ResellerLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<ResellerDashboard />} />
          <Route path="clientes" element={<ResellerClientes />} />
          <Route path="recargas" element={<ResellerRecargas />} />
          <Route path="estado-cuenta" element={<ResellerEstadoCuenta />} />
        </Route>
        {/* Rutas de tienda */}
        {/* Home de tienda para emprendedor (requiere estar logueado, usa mismo token) */}
        <Route path="/diseno-preview" element={<StorePreviewPage />} />
        <Route path="/tienda/home" element={<TiendaHome />} />
        <Route path="/tienda/preview/:previewPage" element={<StorePreviewPage />} />
        {/* Ficha dentro del preview de plantillas: debe ir ANTES de /tienda/:slug/producto/:id,
            si no cae en la tienda pública con slug "preview" y muestra "Producto no encontrado". */}
        <Route path="/tienda/preview/producto/:previewProductId" element={<StorePreviewPage />} />
        {/* Rutas públicas de tienda para clientes finales */}
        <Route path="/tienda/:slug" element={<TiendaPublica />} />
        <Route path="/tienda/:slug/catalogo" element={<Catalogo />} />
        <Route path="/tienda/:slug/producto/:id" element={<ProductoDetalleRouter />} />
        {/* URL canónica del producto para Google: el nombre va en su propio segmento
            y la ficha sigue leyendo :id como siempre (ver pos-bd src/seo/seo-texto.ts). */}
        <Route path="/tienda/:slug/producto/:id/:nombre" element={<ProductoDetalleRouter />} />
        <Route path="/tienda/:slug/checkout" element={<Checkout />} />
        <Route path="/tienda/:slug/seguimiento" element={<SeguimientoPedido />} />
        <Route path="/tienda/:slug/contacto" element={<ContactoRouter />} />
        <Route path="/tienda/:slug/blog" element={<BlogRouter />} />
        <Route path="/tienda/:slug/blog/:blogId" element={<BlogRouter />} />
        {/* Catch-all para tienda pública: Evita que links rotos en banners manden al login/admin */}
        <Route path="/tienda/:slug/*" element={<TiendaPublica />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
      </PantallaNoCargo>
    </BrowserRouter>
  )
}

export default App

function CargandoPagina() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0A0D14]" role="status" aria-label="Cargando">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
    </div>
  )
}
