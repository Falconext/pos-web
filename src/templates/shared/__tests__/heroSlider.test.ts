/**
 * Qué banners del hero se muestran.
 *
 * Las plantillas traen tres de ejemplo y no había forma de usar menos: quien
 * tenía una sola foto quedaba obligado a inventar dos más o a dejar las de
 * muestra publicadas en su tienda.
 */
import { claveSlideOculto, slidesVisibles } from '../heroSlider';

const S = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe('Banners que se muestran', () => {
  it('sin nada configurado se muestran los tres, como siempre', () => {
    // La garantía de que esto no le cambia la tienda a nadie al desplegarlo.
    expect(slidesVisibles({}, 'retail', S)).toEqual(S);
    expect(slidesVisibles(undefined, 'retail', S)).toEqual(S);
  });

  it('oculta el que se marque', () => {
    expect(slidesVisibles({ retailSlide2Oculto: true }, 'retail', S))
      .toEqual([{ id: 1 }, { id: 3 }]);
  });

  it('se puede dejar uno solo', () => {
    // El caso que motivó esto: el negocio tiene un banner, no tres.
    const d = { retailSlide2Oculto: true, retailSlide3Oculto: true };
    expect(slidesVisibles(d, 'retail', S)).toEqual([{ id: 1 }]);
  });

  it('también se puede ocultar el primero', () => {
    expect(slidesVisibles({ retailHeroOculto: true }, 'retail', S))
      .toEqual([{ id: 2 }, { id: 3 }]);
  });

  it('si ocultan TODOS se conserva el primero', () => {
    // Un hero en blanco se ve como una tienda rota, y el editor no avisa de eso
    // en el momento. Preferible mostrar uno a publicar un hueco.
    const d = { retailHeroOculto: true, retailSlide2Oculto: true, retailSlide3Oculto: true };
    expect(slidesVisibles(d, 'retail', S)).toEqual([{ id: 1 }]);
  });

  it('acepta el interruptor venga como venga del editor', () => {
    for (const v of [true, 'true', '1', 1, 'on', 'si']) {
      expect(slidesVisibles({ retailSlide2Oculto: v }, 'retail', S)).toHaveLength(2);
    }
  });

  it('un valor apagado no oculta nada', () => {
    for (const v of [false, 'false', '0', 0, '', null, undefined]) {
      expect(slidesVisibles({ retailSlide2Oculto: v }, 'retail', S)).toHaveLength(3);
    }
  });

  it('cada plantilla tiene sus propias claves', () => {
    // Ocultar en una tienda no puede apagar el banner de otra plantilla.
    expect(slidesVisibles({ retailSlide2Oculto: true }, 'tones', S)).toEqual(S);
  });

  it('las claves siguen la convención de las imágenes', () => {
    expect(claveSlideOculto('retail', 0)).toBe('retailHeroOculto');
    expect(claveSlideOculto('retail', 1)).toBe('retailSlide2Oculto');
    expect(claveSlideOculto('retail', 2)).toBe('retailSlide3Oculto');
  });
});
