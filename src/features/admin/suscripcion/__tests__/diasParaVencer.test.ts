import { diasParaVencer } from '../useMiPlanViewModel';

describe('días para que venza el plan', () => {
    const vence = '2026-10-25T00:00:00.000Z'; // vence el 25

    it('cuenta días de calendario de Lima, de día y de noche', () => {
        expect(diasParaVencer(vence, new Date('2026-10-22T14:00:00Z'))).toBe(3); // 9 a. m. del 22
        expect(diasParaVencer(vence, new Date('2026-10-23T02:00:00Z'))).toBe(3); // 9 p. m. del 22
    });

    it('el mismo día del vencimiento todavía es 0, no vencido', () => {
        expect(diasParaVencer(vence, new Date('2026-10-26T03:00:00Z'))).toBe(0); // 10 p. m. del 25
        expect(diasParaVencer(vence, new Date('2026-10-26T06:00:00Z'))).toBe(-1); // 1 a. m. del 26
    });

    it('sin fecha no hay cuenta', () => {
        expect(diasParaVencer(null)).toBeNull();
    });
});
