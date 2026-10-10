import { medidasReducidas, nombreJpeg, LADO_MAXIMO } from '../fotoParaSubir';

describe('reducir la foto del celular', () => {
  it('una foto de 12 MP baja al lado máximo manteniendo la proporción', () => {
    // 4032×3024 es lo que da un iPhone.
    expect(medidasReducidas(4032, 3024)).toEqual({ ancho: 1600, alto: 1200 });
  });

  it('en vertical reduce por el lado largo', () => {
    expect(medidasReducidas(3024, 4032)).toEqual({ ancho: 1200, alto: 1600 });
  });

  it('no agranda una foto chica: estirarla solo suma peso', () => {
    expect(medidasReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it('la que mide justo el máximo se queda igual', () => {
    expect(medidasReducidas(LADO_MAXIMO, 900)).toEqual({
      ancho: LADO_MAXIMO,
      alto: 900,
    });
  });

  it('nunca devuelve 0 px: un canvas de lado 0 no dibuja nada', () => {
    expect(medidasReducidas(4000, 1)).toEqual({ ancho: 1600, alto: 1 });
  });

  it('con medidas inválidas no revienta', () => {
    expect(medidasReducidas(0, 0)).toEqual({ ancho: 1, alto: 1 });
  });
});

describe('el nombre del archivo', () => {
  it('un HEIC del iPhone queda como .jpg, que es lo que de verdad se sube', () => {
    expect(nombreJpeg('IMG_4821.HEIC')).toBe('IMG_4821.jpg');
  });

  it('sin extensión igual sale con .jpg', () => {
    expect(nombreJpeg('entrega')).toBe('entrega.jpg');
  });

  it('sin nombre no deja el archivo sin nombre', () => {
    expect(nombreJpeg('')).toBe('foto.jpg');
  });
});
