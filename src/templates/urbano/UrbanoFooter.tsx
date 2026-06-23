interface UrbanoFooterProps {
  tienda: any;
}

export default function UrbanoFooter({ tienda }: UrbanoFooterProps) {
  return (
    <footer className="w-full bg-[#1A1A1A] text-white py-16 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <h2
            className="text-2xl font-black tracking-tighter uppercase mb-6"
            style={{ fontFamily: '"Impact", "Arial Black", sans-serif' }}
          >
            {tienda?.nombre || 'BLNK'}
          </h2>
          <p className="text-[11px] text-gray-400 leading-loose">
            {tienda?.diseno?.urbanoSlogan || tienda?.slogan || 'Moda urbana minimalista para vestir tu día con estilo.'}
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6">Tienda</h4>
          <ul className="space-y-4 text-[11px] text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Polos</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Poleras</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Casacas</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pantalones</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6">Ayuda</h4>
          <ul className="space-y-4 text-[11px] text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Preguntas frecuentes</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Envíos y cambios</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Guía de tallas</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contáctanos</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6">Novedades</h4>
          <p className="text-[11px] text-gray-400 mb-4">Suscríbete para recibir lanzamientos, ofertas y novedades.</p>
          <div className="flex border-b border-gray-700 pb-2">
            <input
              type="email"
              placeholder="Ingresa tu correo"
              className="bg-transparent outline-none text-[11px] flex-1 text-white placeholder-gray-600"
            />
            <button className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-gray-400 transition-colors">
              Suscribirme
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-gray-500 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} {tienda?.nombre || 'BLNK'}. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">TikTok</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
