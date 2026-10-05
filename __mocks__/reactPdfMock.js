/**
 * Stub de `@react-pdf/renderer` para Jest. El paquete es ESM puro y Jest no
 * transforma node_modules, así que cualquier suite que lo importe —aunque sea
 * de forma indirecta, como el dashboard de finanzas— ni arrancaba.
 *
 * Ninguna prueba genera PDFs; si alguna lo hiciera, este stub tiene que crecer.
 */
const Componente = () => null;

module.exports = {
    __esModule: true,
    Document: Componente,
    Page: Componente,
    View: Componente,
    Text: Componente,
    Image: Componente,
    Link: Componente,
    Svg: Componente,
    PDFViewer: Componente,
    PDFDownloadLink: Componente,
    BlobProvider: Componente,
    Font: { register: () => {}, registerHyphenationCallback: () => {} },
    StyleSheet: { create: (estilos) => estilos, absoluteFill: {} },
    pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }),
    renderToStream: () => Promise.resolve(null),
    usePDF: () => [{ loading: false, blob: null, url: null, error: null }, () => {}],
};
