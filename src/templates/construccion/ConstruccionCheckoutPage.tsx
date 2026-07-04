import TecnologiaCheckout from '@/pages/tienda/TecnologiaCheckout';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';

export default function ConstruccionCheckoutPage(props: TemplateCheckoutPageProps) {
  const cp = props.cp || props.diseno?.colorPrimario || '#F59E0B';
  return (
    <>
      <TecnologiaCheckout
        {...props}
        diseno={{ ...props.diseno, colorPrimario: cp }}
        carrito={props.carritoState}
      />
      {props.pedidoCreado && (
        <PaymentConfirmationModal
          isOpen={props.showPaymentModal}
          onClose={() => {
            props.setShowPaymentModal(false);
            window.location.href = `/tienda/${props.slug}/seguimiento?codigo=${props.pedidoCreado.codigoSeguimiento}`;
          }}
          orderData={{
            id: props.pedidoCreado.id,
            codigoSeguimiento: props.pedidoCreado.codigoSeguimiento,
            total: props.pedidoCreado.total || props.calcularTotal(),
            medioPago: props.formData.medioPago,
            tipoEntrega: props.formData.tipoEntrega,
            clienteNombre: props.formData.clienteNombre,
          }}
          paymentConfig={
            props.configPago
              ? {
                  yapeQR: props.configPago.yapeQR || props.configPago.yapeQrUrl || undefined,
                  plinQR: props.configPago.plinQR || props.configPago.plinQrUrl || undefined,
                  yapeNumero: props.configPago.yapeNumero || undefined,
                  plinNumero: props.configPago.plinNumero || undefined,
                  whatsappTienda: props.configPago.whatsappTienda || undefined,
                }
              : undefined
          }
          storeSlug={props.slug || ''}
        />
      )}
      <ConfirmOrderModal
        isOpen={props.showConfirmModal}
        onClose={() => props.setShowConfirmModal(false)}
        onConfirm={props.enviarPedido}
        total={props.calcularTotal()}
        loading={props.enviando}
        tiendaColor={cp}
      />
    </>
  );
}
