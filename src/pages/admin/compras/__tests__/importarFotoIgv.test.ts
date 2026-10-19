/**
 * La compra leída de una FOTO (IA) no debe quedar sin IGV.
 *
 * El backend devuelve `igv: 0` en cada línea de la foto porque la IA no lee el
 * IGV por línea. `lineaXmlSinIgv` toma `igv: 0` con subtotal > 0 como "esta
 * línea no lleva IGV", que es correcto para un XML pero no para una foto: la
 * compra entera se grababa sin IGV. La marca solo se aplica a lo importado por XML.
 */
import * as fs from 'fs';
import * as path from 'path';
import { lineaXmlSinIgv } from '@/features/admin/compras/utils/compraPorPaquete';

const MODAL = fs.readFileSync(path.join(__dirname, '..', 'ModalNuevaCompra.tsx'), 'utf-8');

describe('Importar compra: IGV por línea', () => {
    it('una línea de la foto (igv 0) se vería como "sin IGV" si se evaluara', () => {
        expect(lineaXmlSinIgv({ igv: 0, subtotal: 100 })).toBe(true);
    });

    it('por eso la marca sin IGV solo se aplica a lo importado por XML', () => {
        expect(MODAL).toContain("...(origen === 'xml' && lineaXmlSinIgv(item) ? { _gravado: false } : {}),");
        expect(MODAL).not.toContain('...(lineaXmlSinIgv(item) ? { _gravado: false } : {}),');
    });
});
