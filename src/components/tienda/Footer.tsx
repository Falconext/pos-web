import { Icon } from '@iconify/react';

interface FooterProps {
    tienda: any;
    diseno: any;
}

export default function Footer({ tienda, diseno }: FooterProps) {
    const year = new Date().getFullYear();
    const primaryColor = diseno.colorPrimario || '#045659';
    const accentColor = '#ff9900'; // Naranja para botón de suscribir y hovers

    return (
        <footer className="bg-[#002626] text-gray-300 font-sans mt-auto border-t border-[#045659]/30">
            {/* Main Footer Content */}
            <div className="max-w-screen-xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                    {/* Column 1: Brand & Subscribe */}
                    <div className="space-y-6">
                        {/* Brand */}
                        <div className="mb-4">
                            {tienda.logo ? (
                                <img src={tienda.logo} alt={tienda.nombreComercial} className="h-16 w-auto object-contain bg-white/10 p-2 rounded-lg backdrop-blur-sm" />
                            ) : (
                                <h2 className="text-3xl font-bold text-white tracking-tight">{tienda.nombreComercial || 'FalconStore'}</h2>
                            )}
                        </div>

                        <p className="text-sm leading-relaxed text-gray-400">
                            {tienda.descripcionTienda || 'Construimos experiencias de comercio electrónico escalables y de alto rendimiento.'}
                        </p>

                        {/* Social Media */}
                        <div className="pt-4 space-y-3">
                            <h4 className="text-white font-bold text-sm">Redes Sociales</h4>
                            <div className="flex gap-3">
                                {tienda.facebookUrl && (
                                    <a href={tienda.facebookUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#043d3d] flex items-center justify-center hover:bg-[#064e4e] transition-colors group">
                                        <Icon icon="ic:baseline-facebook" width={20} className="text-white group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                                {tienda.instagramUrl && (
                                    <a href={tienda.instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#043d3d] flex items-center justify-center hover:bg-[#064e4e] transition-colors group">
                                        <Icon icon="mdi:instagram" width={20} className="text-white group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                                {tienda.tiktokUrl && (
                                    <a href={tienda.tiktokUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#043d3d] flex items-center justify-center hover:bg-[#064e4e] transition-colors group">
                                        <Icon icon="ic:baseline-tiktok" width={20} className="text-white group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                                {tienda.linkedinUrl && (
                                    <a href={tienda.linkedinUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#043d3d] flex items-center justify-center hover:bg-[#064e4e] transition-colors group">
                                        <Icon icon="mdi:linkedin" width={20} className="text-white group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Information */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Información</h3>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Sobre Nosotros</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Información de Delivery</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Políticas de Privacidad</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Términos y Condiciones</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Política de Devoluciones</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Ser Vendedor</a></li>
                        </ul>
                    </div>

                    {/* Column 3: Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Enlaces Rápidos</h3>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Mi Cuenta</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Carrito de Compras</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Lista de Deseos</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Historial de Pedidos</a></li>
                            <li><a href="#" className="hover:text-[#ff9900] transition-colors">Pedidos Internacionales</a></li>
                        </ul>
                    </div>

                    {/* Column 4: My Accounts (Adapted to Store Info) */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Contacto & Ayuda</h3>
                        <ul className="space-y-4 text-sm">
                            {tienda.whatsappTienda && (
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#043d3d] flex items-center justify-center flex-shrink-0">
                                        <Icon icon="mdi:whatsapp" className="text-[#ff9900]" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Whatsapp</div>
                                        <div className="text-white font-medium">{tienda.whatsappTienda}</div>
                                    </div>
                                </li>
                            )}
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#043d3d] flex items-center justify-center flex-shrink-0">
                                    <Icon icon="mdi:email-outline" className="text-[#ff9900]" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Email</div>
                                    <div className="text-white font-medium">{tienda.correo || tienda.email || 'soporte@falconext.com'}</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#043d3d] flex items-center justify-center flex-shrink-0">
                                    <Icon icon="mdi:map-marker-outline" className="text-[#ff9900]" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Ubicación</div>
                                    <div className="text-white font-medium">{tienda.direccion || 'Lima, Perú'}</div>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-[#045659]/30 bg-[#001f1f]">
                <div className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">
                        &copy; {year} <span className="text-[#ff9900] font-bold">Falconext</span>. Todos los derechos reservados.
                    </p>

                    {/* Payment Icons */}
                    <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-1 rounded h-8 min-w-[50px] flex items-center justify-center overflow-hidden shadow-sm">
                            <span className="text-xs font-black text-[#7D00FF]">Yape</span>
                        </div>
                        <div className="bg-white px-3 py-1 rounded h-8 min-w-[50px] flex items-center justify-center overflow-hidden shadow-sm">
                            <span className="text-xs font-black text-[#00C8FF]">Plin</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
