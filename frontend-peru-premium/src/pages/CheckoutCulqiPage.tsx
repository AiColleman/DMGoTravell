import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Lock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { paymentsApi, reservationsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  createCulqiCheckoutAdapter,
  type CulqiTokenResult,
} from '../integrations/culqiCheckout';
import {
  canCustomerCancel,
  createIdempotencyKey,
  formatLimaDate,
  formatLimaDateTime,
  formatPen,
} from '../lib/format';
import { PERU_ASSETS } from '../lib/peruCatalog';
import type { PaymentAttemptDto, PaymentMethodType, ReservationDto } from '../types/api';
import { CountdownPill, PeruPhoto, StatusPill } from '../components/ui/EditorialPrimitives';

export const CheckoutCulqiPage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const { user, apiOnline, isDemoSession, demoReservations, upsertDemoReservation } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const culqiAdapter = useMemo(() => createCulqiCheckoutAdapter(), []);

  const [reservation, setReservation] = useState<ReservationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethodType>('card');
  const [lastToken, setLastToken] = useState<CulqiTokenResult | null>(null);
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttemptDto | null>(null);
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const attemptIdemKeyRef = useRef<string>(createIdempotencyKey());

  useEffect(() => {
    let active = true;
    if (!reservationId) return;

    (async () => {
      setLoading(true);
      try {
        if (reservationId.startsWith('demo-') || apiOnline === false || isDemoSession) {
          const found = demoReservations.find((r) => r.id === reservationId) ?? demoReservations[0];
          if (active && found) setReservation(found);
        } else {
          const res = await reservationsApi.getById(reservationId);
          if (active) setReservation(res);
        }
      } catch (err) {
        notifyError(err, 'No se pudo recuperar la reserva');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reservationId, apiOnline, isDemoSession, demoReservations, notifyError]);

  const handleMethodChange = (next: PaymentMethodType) => {
    setMethod(next);
    setLastToken(null);
    attemptIdemKeyRef.current = createIdempotencyKey();
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    setProcessing(true);
    try {
      // 1. Tokenización aislada vía Adaptador Culqi Checkout v4 / Sandbox AC11 (RS07: cero PAN/CVV en React)
      const tokenized = await culqiAdapter.tokenize({
        reservationNumber: reservation.reservationNumber,
        amountPen: reservation.total,
        email: user?.email ?? 'viajero@dmgotravel.com',
        method,
      });
      setLastToken(tokenized);

      // 2. Modo Vista Previa cuando la API local no está levantada
      if (reservation.id.startsWith('demo-') || apiOnline === false || isDemoSession) {
        const confirmedRes: ReservationDto = {
          ...reservation,
          status: 'confirmed',
          version: reservation.version + 1,
        };
        setPaymentAttempt({
          id: `pay-${Date.now()}`,
          reservationId: reservation.id,
          method,
          status: 'approved',
          amount: reservation.total,
          currency: 'PEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        });
        setProviderRef(`culqi_chg_${tokenized.tokenId.slice(-8)}`);
        setReservation(confirmedRes);
        upsertDemoReservation(confirmedRes);
        notifySuccess(
          '¡Reserva Confirmada!',
          `Pago validado por ${formatPen(reservation.total)} (${tokenized.tokenId}). Comprobante enviado.`
        );
        return;
      }

      // 3. Procesamiento oficial en DMGoTravel.Api (ADR-007 / RN-03: el backend usa exclusivamente el monto persistido)
      const response = await paymentsApi.startPayment(
        reservation.id,
        method,
        attemptIdemKeyRef.current
      );
      setPaymentAttempt(response.payment);
      setProviderRef(response.providerData?.providerReference ?? tokenized.tokenId);

      const updated = await reservationsApi.getById(reservation.id);
      setReservation(updated);

      if (response.payment.status === 'approved' || updated.status === 'confirmed') {
        notifySuccess(
          '¡Pago validado en Culqi!',
          `Reserva ${updated.reservationNumber} confirmada por ${formatPen(updated.total)}.`
        );
      } else if (response.payment.status === 'unknown') {
        notifyError(
          new Error(
            'El cobro entró en verificación bancaria (ventana de 20 min). Bloqueamos reintentos para protegerte contra doble cargo.'
          ),
          'Pago en verificación (unknown)'
        );
      } else {
        attemptIdemKeyRef.current = createIdempotencyKey();
        notifyError(
          new Error('El intento fue rechazado. Puedes reintentar dentro de los 15 minutos.'),
          'Pago rechazado'
        );
      }
    } catch (err) {
      notifyError(err, 'No se pudo procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!paymentAttempt || !reservation || reservation.id.startsWith('demo-')) return;
    try {
      const [pay, res] = await Promise.all([
        paymentsApi.getPayment(paymentAttempt.id),
        reservationsApi.getById(reservation.id),
      ]);
      setPaymentAttempt(pay);
      setReservation(res);
    } catch (err) {
      notifyError(err, 'Error al consultar estado de pago');
    }
  };

  const handleCancelPending = async () => {
    if (!reservation || !canCustomerCancel(reservation.status)) return;

    if (reservation.id.startsWith('demo-') || apiOnline === false || isDemoSession) {
      const cancelled = { ...reservation, status: 'cancelled', version: reservation.version + 1 };
      setReservation(cancelled);
      upsertDemoReservation(cancelled);
      notifySuccess('Reserva cancelada sin cargo', 'Se liberaron tus cupos bloqueados.');
      return;
    }

    setCancelling(true);
    try {
      const cancelled = await reservationsApi.cancel(reservation.id, reservation.version);
      setReservation(cancelled);
      notifySuccess('Reserva cancelada', 'Cupos e inventario liberados correctamente.');
    } catch (err) {
      notifyError(err, 'No se pudo cancelar la reserva');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 rounded-2xl bg-[#F3EDE2] animate-pulse" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-xl mx-auto my-20 text-center space-y-4">
        <h1 className="font-editorial text-3xl text-[#12232E]">Reserva no encontrada</h1>
        <Link
          to="/cuenta"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#12232E] text-white text-xs font-bold"
        >
          Ir a Mis Reservas
        </Link>
      </div>
    );
  }

  const isPending = canCustomerCancel(reservation.status);
  const isConfirmed = reservation.status.toLowerCase() === 'confirmed';
  const isUnknown = paymentAttempt?.status?.toLowerCase() === 'unknown';
  const nowMs = Date.now();
  const paymentDeadlineMs = new Date(reservation.paymentDeadlineAt).getTime();
  const validationDeadlineMs = new Date(reservation.validationDeadlineAt).getTime();
  // Spec 001 RF-60 & RF-87: durante los 5 min de tolerancia tras vencer los 15 min iniciales, se impiden nuevos intentos de pago
  const inToleranceWindow =
    isPending &&
    Number.isFinite(paymentDeadlineMs) &&
    nowMs >= paymentDeadlineMs &&
    (!Number.isFinite(validationDeadlineMs) || nowMs < validationDeadlineMs);
  const isPaymentBlocked = !isPending || isUnknown || inToleranceWindow;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E5DDD0] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            to="/cuenta"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6B73] hover:text-[#B84A27]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Mis Reservas
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#12232E]">
              Checkout Seguro · {reservation.reservationNumber}
            </h1>
            <StatusPill status={reservation.status} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#E7F3EE] border border-[#B6DEC9] text-xs font-semibold text-[#15523F]">
          <Lock className="w-3.5 h-3.5" />
          Pago Seguro Verificado en Soles (PEN)
        </div>
      </div>

      {/* Ventana Temporal 15 / 20 Minutos */}
      {isPending && (
        <div className="rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A4E0D]">
              Cupos bloqueados transaccionalmente a tu favor
            </p>
            <p className="text-xs text-[#6B4A14] leading-relaxed max-w-2xl">
              Cuentas con <strong>15 minutos</strong> para iniciar el pago (hasta{' '}
              <span className="font-mono">{formatLimaDateTime(reservation.paymentDeadlineAt)}</span>
              ) y una guarda adicional hasta 20 min (
              <span className="font-mono">
                {formatLimaDateTime(reservation.validationDeadlineAt)}
              </span>
              ) en caso de verificación bancaria.
            </p>
          </div>
          <CountdownPill deadlineIso={reservation.paymentDeadlineAt} />
        </div>
      )}

      {/* Banner de Éxito */}
      {isConfirmed && (
        <div className="rounded-2xl bg-[#E7F3EE] border border-[#B6DEC9] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B5E4A] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
                ¡Tu experiencia en Perú está confirmada!
              </h2>
              <p className="text-xs text-[#15523F] leading-relaxed max-w-xl">
                Pago oficial validado por <strong>{formatPen(reservation.total)} PEN</strong>. Hemos
                enviado la confirmación y el resumen de tu reserva a{' '}
                <strong>{user?.email ?? 'tu correo verificado'}</strong>.
              </p>
              {providerRef && (
                <p className="font-mono text-[11px] text-[#1B5E4A]">
                  Ref. Culqi: {providerRef}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/cuenta')}
            className="px-5 py-3 rounded-xl bg-[#12232E] text-white text-xs font-bold cursor-pointer shrink-0"
          >
            Ver en Mi Cuenta
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Panel de Tokenización y Procesamiento Culqi (ADR-007 / RS07) */}
        <div className="lg:col-span-7 space-y-6">
          {inToleranceWindow && !isUnknown && (
            <div className="rounded-2xl bg-[#FBECE9] border border-[#EABCB3] p-5 space-y-2">
              <h3 className="text-xs font-bold text-[#8E2B17] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Ventana inicial de 15 minutos concluida — En tolerancia de validación (Spec 001 · RF-60, RF-87)
              </h3>
              <p className="text-xs text-[#8E2B17]">
                No se admiten nuevos intentos de pago durante los 5 minutos de tolerancia (hasta{' '}
                <span className="font-mono">{formatLimaDateTime(reservation.validationDeadlineAt)}</span>
                ); esta ventana solo permite completar la validación de un pago iniciado a tiempo.
              </p>
            </div>
          )}

          {isUnknown && (
            <div className="rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#855814] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-[#7A4E0D]">
                    Pago en verificación (Spec 001 · RF-66, RF-67, RF-75)
                  </h3>
                  <p className="text-xs text-[#6B4A14] mt-1">
                    Se bloquean nuevos intentos y cancelaciones voluntarias para evitar cobros
                    duplicados mientras Culqi confirma el resultado o entrega el Webhook firmado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleRefreshVerification()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A4E0D] text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar verificación
              </button>
            </div>
          )}

          <div className="hairline-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-editorial text-2xl font-medium text-[#12232E]">
                  Pasarela Oficial Culqi
                </h2>
                <p className="text-xs text-[#5C6B73] mt-1">
                  Elige tu medio de pago preferido para completar tu reserva por{' '}
                  <strong className="text-[#12232E]">{formatPen(reservation.total)} PEN</strong>.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EDE2] border border-[#D2C6B4] text-[10px] font-semibold text-[#12232E]">
                <KeyRound className="w-3 h-3 text-[#B84A27]" />
                {culqiAdapter.publicKeyConfigured ? 'Conexión Segura' : 'Entorno de Prueba Seguro'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isPaymentBlocked}
                onClick={() => handleMethodChange('card')}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 cursor-pointer disabled:opacity-50 ${
                  method === 'card'
                    ? 'border-[#12232E] bg-[#12232E] text-white'
                    : 'border-[#E5DDD0] bg-[#FAF7F2] text-[#12232E]'
                }`}
              >
                <CreditCard className="w-5 h-5 shrink-0 text-[#C89B54]" />
                <div>
                  <p className="text-xs font-bold">Tarjeta Crédito / Débito</p>
                  <p className="text-[11px] opacity-75">Visa, Mastercard, Amex, Diners</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isPaymentBlocked}
                onClick={() => handleMethodChange('yape')}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 cursor-pointer disabled:opacity-50 ${
                  method === 'yape'
                    ? 'border-[#6B217E] bg-[#6B217E] text-white'
                    : 'border-[#E5DDD0] bg-[#FAF7F2] text-[#12232E]'
                }`}
              >
                <Smartphone className="w-5 h-5 shrink-0 text-[#E5B8F4]" />
                <div>
                  <p className="text-xs font-bold">Yape Instantáneo</p>
                  <p className="text-[11px] opacity-75">Tokenización oficial sin exponer claves</p>
                </div>
              </button>
            </div>

            <form onSubmit={handleStartPayment} className="space-y-4">
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  method === 'yape'
                    ? 'bg-[#FAF5FC] border-[#E2C8EB]'
                    : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#12232E]">
                    {method === 'card'
                      ? 'Tokenización aislada de Tarjeta (Culqi Checkout)'
                      : 'Autorización instantánea con Yape (Culqi Checkout)'}
                  </span>
                  <span className="font-mono text-[11px] text-[#5C6B73]">
                    Moneda: PEN · Soles
                  </span>
                </div>

                <p className="text-xs text-[#5C6B73] leading-relaxed">
                  Tu pago se procesa de forma encriptada mediante <strong>Culqi</strong> sin
                  almacenar los datos de tu tarjeta en nuestra página, protegiendo tu operación
                  contra cargos duplicados.
                </p>

                <div className="pt-2 border-t border-[#E5DDD0]/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#5C6B73] block">Comprobante enviado a:</span>
                    <strong className="text-[#12232E]">{user?.email ?? 'viajero@dmgotravel.com'}</strong>
                  </div>
                  <div>
                    <span className="text-[#5C6B73] block">Protección anti-duplicado:</span>
                    <span className="font-semibold text-[#1B5E4A]">Activa para esta orden</span>
                  </div>
                </div>

                {lastToken && (
                  <div className="pt-2 border-t border-[#E5DDD0]/80 flex items-center justify-between text-[11px]">
                    <span className="text-[#5C6B73]">Último token emitido:</span>
                    <code className="font-mono font-semibold text-[#12232E]">
                      {lastToken.tokenId}
                    </code>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD0] text-[11px] text-[#5C6B73] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1B5E4A] shrink-0 mt-0.5" />
                <span>
                  <strong>Tarifa protegida:</strong> cobramos exactamente el importe acordado en tu
                  resumen y tu reserva se confirma de inmediato al aprobarse el pago.
                </span>
              </div>

              {isPending && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={processing || isPaymentBlocked}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {processing
                      ? 'Tokenizando y validando con Culqi...'
                      : inToleranceWindow
                        ? 'Ventana de 15 min vencida (RF-87)'
                        : `Tokenizar y Pagar ${formatPen(reservation.total)} PEN`}
                  </button>

                  {!isUnknown && (
                    <button
                      type="button"
                      disabled={cancelling || processing}
                      onClick={() => void handleCancelPending()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-xl border border-[#EABCB3] text-[#8E2B17] hover:bg-[#FBECE9] text-xs font-bold cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      {cancelling ? 'Cancelando...' : 'Cancelar reserva'}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Resumen Fijo y Centrado de la Orden */}
        <aside className="lg:col-span-5 lg:self-stretch">
          <div className="lg:sticky lg:top-20 lg:py-2">
            <div className="hairline-card rounded-3xl overflow-hidden shadow-lg border-[#D8CCBA]">
              <div className="h-40 relative">
                <PeruPhoto
                  src={PERU_ASSETS.cusco}
                  alt="Resumen de reserva"
                  category="tour"
                  hintText={reservation.offerNameHint || 'Ayacucho'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720]/85 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 text-[#FAF7F2]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C89B54]">
                    Resumen de tu Viaje
                  </span>
                  <p className="font-editorial text-2xl font-medium mt-0.5">
                    Orden #{reservation.reservationNumber}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs bg-[#FFFCF8]">
                {reservation.offerNameHint && (
                  <p className="font-bold text-[#12232E] text-sm">{reservation.offerNameHint}</p>
                )}

                {reservation.departure && (
                  <div className="space-y-1.5 pb-3.5 border-b border-[#E5DDD0]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B73]">
                      Experiencia Turística
                    </p>
                    <p className="font-semibold text-[#12232E]">
                      Salida: {formatLimaDateTime(reservation.departure.startDate)}
                    </p>
                    <p className="text-[#5C6B73]">
                      Viajeros: <strong>{reservation.travelers}</strong> · Tarifa por persona:{' '}
                      {formatPen(reservation.departure.price)}
                    </p>
                  </div>
                )}

                {reservation.lodging ? (
                  <div className="space-y-1.5 pb-3.5 border-b border-[#E5DDD0]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E4A]">
                      Alojamiento Aliado Incluido
                    </p>
                    <p className="font-bold text-[#12232E]">{reservation.lodging.hotelName}</p>
                    <p className="text-[#5C6B73]">
                      {reservation.lodging.roomTypeName} · {reservation.lodging.nights}{' '}
                      {reservation.lodging.nights === 1 ? 'noche' : 'noches'} (
                      {formatLimaDate(reservation.lodging.checkInDate)} →{' '}
                      {formatLimaDate(reservation.lodging.checkOutDate)})
                    </p>
                    <p className="font-semibold text-[#1B5E4A] tabular-nums">
                      Subtotal alojamiento: {formatPen(reservation.lodging.subtotal)}
                    </p>
                  </div>
                ) : (
                  <p className="pb-3.5 border-b border-[#E5DDD0] text-[#5C6B73]">
                    Modalidad: <strong>Solo experiencia turística</strong>.
                  </p>
                )}

                <div className="text-center py-2 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0]">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5C6B73]">
                    Total a Pagar (PEN)
                  </span>
                  <strong className="font-editorial text-3xl sm:text-4xl font-semibold text-[#12232E] tabular-nums">
                    {formatPen(reservation.total)}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-[#E7F3EE] border border-[#B6DEC9] text-[11px] text-[#15523F] flex items-start gap-2">
                  <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Enviaremos tu confirmación y comprobante a{' '}
                    <strong>{user?.email ?? 'tu correo registrado'}</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
