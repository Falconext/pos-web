import { debeRecargar } from '../cargaPerezosa';

describe('recarga ante un pedazo que ya no existe (despliegue nuevo)', () => {
  beforeEach(() => sessionStorage.clear());

  it('recarga la primera vez y no vuelve a recargar dentro de 10 s', () => {
    expect(debeRecargar(1_000_000)).toBe(true);
    expect(debeRecargar(1_005_000)).toBe(false); // segundo fallo: se muestra el error, sin bucle
  });

  it('pasado el plazo, un despliegue posterior vuelve a recargar', () => {
    expect(debeRecargar(1_000_000)).toBe(true);
    expect(debeRecargar(1_020_000)).toBe(true);
  });
});
