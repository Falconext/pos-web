import { Icon } from '@iconify/react';

interface FooterProps {
    tienda: any;
    diseno: any;
}

export default function Footer({ tienda, diseno }: FooterProps) {
    const year = new Date().getFullYear();
    const textColor = diseno.colorPrimario || '#000';

    return (
        <footer className="bg-white border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    {/* Columna 1: Info Tienda */}
                    <div>
                        <h3 className="font-bold text-lg mb-4" style={{ color: textColor }}>{tienda.nombreComercial || 'Nuestra Tienda'}</h3>
                        <p className="text-gray-500 text-sm mb-4 max-w-xs">
                            {tienda.descripcionTienda || 'Los mejores productos para ti, con la calidad y garantía que mereces.'}
                        </p>
                        <div className="flex gap-3">
                            {tienda.facebookUrl && (
                                <a href={tienda.facebookUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                                    <Icon icon="mdi:facebook" width={24} />
                                </a>
                            )}
                            {tienda.instagramUrl && (
                                <a href={tienda.instagramUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                                    <Icon icon="mdi:instagram" width={24} />
                                </a>
                            )}
                            {tienda.tiktokUrl && (
                                <a href={tienda.tiktokUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black transition-colors">
                                    <Icon icon="ic:baseline-tiktok" width={24} />
                                </a>
                            )}
                            {tienda.whatsappTienda && (
                                <a href={`https://wa.me/${tienda.whatsappTienda.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-600 transition-colors">
                                    <Icon icon="mdi:whatsapp" width={24} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Columna 2: Enlaces Rápidos */}
                    <div>
                        <h3 className="font-bold text-lg mb-4" style={{ color: textColor }}>Enlaces</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-gray-900 transition-colors">Inicio</a></li>
                            <li><a href="#" className="hover:text-gray-900 transition-colors">Catálogo</a></li>
                            <li><a href="#" className="hover:text-gray-900 transition-colors">Ofertas</a></li>
                            <li><a href="#" className="hover:text-gray-900 transition-colors">Contacto</a></li>
                        </ul>
                    </div>

                    {/* Columna 3: Contacto */}
                    <div>
                        <h3 className="font-bold text-lg mb-4" style={{ color: textColor }}>Contacto</h3>
                        <ul className="space-y-3 text-sm text-gray-500">
                            {tienda.direccion && (
                                <li className="flex items-start gap-2">
                                    <Icon icon="mdi:map-marker" className="flex-shrink-0 mt-0.5" />
                                    <span>{tienda.direccion}</span>
                                </li>
                            )}
                            {tienda.whatsappTienda && (
                                <li className="flex items-center gap-2">
                                    <Icon icon="mdi:phone" className="flex-shrink-0" />
                                    <span>{tienda.whatsappTienda}</span>
                                </li>
                            )}
                            <li className="flex items-center gap-2">
                                <Icon icon="mdi:clock-outline" className="flex-shrink-0" />
                                <span>{tienda.horarioAtencion || 'Lun - Dom: 9am - 6pm'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400">
                        &copy; {year} {tienda.nombreComercial}. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Powered by</span>
                        <a href="https://falconnext.com" target="_blank" rel="noreferrer" className="font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
                            <Icon icon="mdi:lightning-bolt" className="text-yellow-500" />
                            FalconNext
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
