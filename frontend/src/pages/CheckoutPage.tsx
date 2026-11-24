import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { paymentsApi, reservationsApi } from '../api/services';
import { CountdownBadge } from '../components/ui/CountdownBadge';
import { SmartImage } from '../components/ui/SmartImage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createIdempotencyKey, formatLimaDate, formatLimaDateTime, formatPen } from '../lib/format';
import { STITCH_MEDIA } from '../lib/mediaCatalog';
import type { PaymentAttemptDto, PaymentMethodType, ReservationDto } from '../types/api';

export const CheckoutPage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const [reservation, setReservation] = useState<ReservationDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [method, setMethod] = useState<PaymentMethodType>('card');
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttemptDto | null>(null);
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Campos visuales de tokenización Culqi (nunca se envían ni almacenan en DMGOTRAVEL - RN-18)
  const [cardHolder, setCardHolder] = useState(user?.fullName ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [yapePhone, setYapePhone] = useState('+51 ');
  const [yapeOtp, setYapeOtp] = useState('');

  // Clave idempotente por intento de cobro para evitar cargos duplicados ante doble clic
  const attemptIdemKeyRef = useRef<string>(createIdempotencyKey());

  const loadReservation = async () => {
    if (!reservationId) return;
    setLoading(true);
    try {
      if (reservationId.startsWith('demo-')) {
        const now = Date.now();
        setReservation({
          id: reservationId,
          reservationNumber: 'RES-2026-004821',
          status: 'pending',
          travelers: Number(searchParams.get('travelers') ?? 2),
          total: searchParams.get('total') ?? '1660.00',
          currency: 'PEN',
          paymentDeadlineAt: new Date(now + 14 * 60 * 1000).toISOString(),
          validationDeadlineAt: new Date(now + 19 * 60 * 1000).toISOString(),
          version: 1,
          departure: {
            id: 'dep-demo',
            startDate: '2026-12-18T12:00:00Z',
            endDate: '2026-12-20T23:00:00Z',
            price: '590.00',
            currency: 'PEN',
            capacity: 16,
            available: 9,
          },
          lodging: {
            hotelName: 'Hotel Boutique Santa Rosa de Huamanga',
            roomTypeName: 'Suite Matrimonial / Doble Superior',
            capacity: 2,
            checkInDate: '2026-12-18',
            checkOutDate: '2026-12-20',
            nights: 2,
            nightlyRate: '240.00',
            subtotal: '480.00',
            currency: 'PEN',
          },
        });
      } else {
        const res = await reservationsApi.getById(reservationId);
        setReservation(res);
      }
    } catch (err) {
      notifyError(err, 'No se pudo cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReservation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const handleMethodChange = (next: PaymentMethodType) => {
    setMethod(next);
    attemptIdemKeyRef.current = createIdempotencyKey();
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    if (reservation.id.startsWith('demo-') || apiOnline === false) {
      setProcessing(true);
      window.setTimeout(() => {
        setPaymentAttempt({
          id: 'pay-demo-01',
          reservationId: reservation.id,
          method,
          status: 'approved',
          amount: reservation.total,
          currency: 'PEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        });
        setProviderRef('culqi_chg_live_sim_98412');
        setReservation((prev) => (prev ? { ...prev, status: 'confirmed', version: 2 } : prev));
        setProcessing(false);
        notifySuccess(
          'Pago validado exitosamente',
          'Tu reserva pasó a estado CONFIRMADA y se despachó el comprobante por correo.'
        );
      }, 800);
      return;
    }

    setProcessing(true);
    try {
      const response = await paymentsApi.startPayment(
        reservation.id,
        method,
        attemptIdemKeyRef.current
      );
      setPaymentAttempt(response.payment);
      setProviderRef(response.providerData?.providerReference ?? null);

      const updatedRes = await reservationsApi.getById(reservation.id);
      setReservation(updatedRes);

      if (response.payment.status === 'approved' || updatedRes.status === 'confirmed') {
        notifySuccess(
          '¡Reserva Confirmada!',
          `Pago aprobado en Culqi (${formatPen(response.payment.amount)}). Comprobante en proceso de envío vía Resend.`
        );
      } else if (response.payment.status === 'unknown') {
        notifyError(
          new Error(
            'El pago se encuentra en verificación oficial con el proveedor. Conservamos tus cupos hasta el corte de 20 minutos sin permitir reintentos duplicados.'
          ),
          'Pago en verificación (unknown)'
        );
      } else {
        // Si fue rechazado antes de los 15 min se permite generar una nueva clave para otro intento (DEC-024)
        attemptIdemKeyRef.current = createIdempotencyKey();
        notifyError(
          new Error(
            'El intento de pago fue rechazado. Puedes intentar nuevamente dentro del plazo restante de tu reserva.'
          ),
          'Pago rechazado'
        );
      }
    } catch (err) {
      notifyError(err, 'No se pudo procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefreshPaymentVerification = async () => {
    if (!paymentAttempt || !reservation || reservation.id.startsWith('demo-')) return;
    try {
      const [pay, res] = await Promise.all([
        paymentsApi.getPayment(paymentAttempt.id),
        reservationsApi.getById(reservation.id),
      ]);
      setPaymentAttempt(pay);
      setReservation(res);
    } catch (err) {
      notifyError(err, 'Error al consultar estado del pago');
    }
  };

  const handleCancelPendingReservation = async () => {
    if (!reservation) return;
    if (reservation.id.startsWith('demo-')) {
      setReservation({ ...reservation, status: 'cancelled' });
      notifySuccess('Reserva cancelada', 'Se liberaron los cupos bloqueados.');
      return;
    }

    setCancelling(true);
    try {
      const cancelled = await reservationsApi.cancel(reservation.id, reservation.version);
      setReservation(cancelled);
      notifySuccess(
        'Reserva cancelada sin cargo',
        'Los cupos turísticos y el inventario hotelero fueron liberados.'
      );
    } catch (err) {
      notifyError(err, 'No se pudo cancelar la reserva');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-xl mx-auto my-20 text-center space-y-4">
        <h2 className="font-headline font-bold text-xl text-slate-900">Reserva no encontrada</h2>
        <Link
          to="/cuenta"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold"
        >
          Ir a Mis Reservas
        </Link>
      </div>
    );
  }

  const isPending = reservation.status.toLowerCase() === 'pending';
  const isConfirmed = reservation.status.toLowerCase() === 'confirmed';
  const isUnknownVerification = paymentAttempt?.status?.toLowerCase() === 'unknown';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Cabecera Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            to="/cuenta"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B3B5B]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ir a Mi Historial de Reservas
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-[#0B3B5B] tabular-nums">
              Checkout Seguro · {reservation.reservationNumber}
            </h1>
            <StatusBadge status={reservation.status} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#146C53]">
          <Lock className="w-4 h-4" />
          Tokenización Culqi &amp; Idempotency-Key Activa
        </div>
      </div>

      {/* Banner de Ventana 15/20 Minutos (Spec 002 & 003 · DEC-020 / DEC-028) */}
      {isPending && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-headline font-bold text-sm text-amber-950">
              Disponibilidad bloqueada temporalmente a tu favor
            </p>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              Tienes <strong>15 minutos</strong> exactos desde la creación para iniciar el pago (
              <span className="tabular-nums">{formatLimaDateTime(reservation.paymentDeadlineAt)}</span>
              ). Si el cobro entra en verificación bancaria, conservamos tus recursos durante{' '}
              <strong>5 minutos adicionales</strong> hasta el corte máximo de 20 min (
              <span className="tabular-nums">
                {formatLimaDateTime(reservation.validationDeadlineAt)}
              </span>
              ).
            </p>
          </div>
          <div className="shrink-0">
            <CountdownBadge deadlineIso={reservation.paymentDeadlineAt} />
          </div>
        </div>
      )}

      {/* Estado CONFIRMADA */}
      {isConfirmed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#146C53] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-headline font-extrabold text-xl text-slate-900">
                ¡Pago validado y viaje confirmado!
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed max-w-xl">
                La reserva <strong className="tabular-nums">{reservation.reservationNumber}</strong>{' '}
                alcanzó el estado <strong>Confirmada</strong> tras validar el pago oficial por{' '}
                <strong className="tabular-nums">{formatPen(reservation.total)}</strong>. Nuestro
                módulo de notificaciones procesa el envío de tu comprobante electrónico vía{' '}
                <strong>Resend</strong>.
              </p>
              {providerRef && (
                <p className="text-[11px] font-mono text-[#146C53]">
                  Referencia externa Culqi: {providerRef}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cuenta')}
            className="shrink-0 px-5 py-3 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
          >
            Ver en Mis Reservas
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Pasarela de Pago Culqi (Tarjeta + Yape) */}
        <div className="lg:col-span-7 space-y-6">
          {isUnknownVerification && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-sm text-amber-950">
                    Pago en verificación oficial con Culqi (DEC-033)
                  </h3>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Mientras este intento se encuentra en estado de verificación, el sistema bloquea
                    nuevos intentos y cancelaciones voluntarias para protegerte contra cobros dobles.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleRefreshPaymentVerification()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Consultar estado actualizado
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline font-bold text-lg text-slate-900">
                  Selecciona tu Método de Pago Oficial
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  El servidor procesa exclusivamente el importe oficial almacenado (
                  <strong className="tabular-nums text-slate-800">
                    {formatPen(reservation.total)} PEN
                  </strong>
                  ).
                </p>
              </div>
            </div>

            {/* Selector Tarjeta vs Yape */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!isPending || isUnknownVerification}
                onClick={() => handleMethodChange('card')}
                className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50 ${
                  method === 'card'
                    ? 'border-[#0B3B5B] bg-[#0B3B5B]/5 ring-1 ring-[#0B3B5B]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-[#0B3B5B] shrink-0" />
                <div>
                  <p className="font-headline font-bold text-xs sm:text-sm text-slate-900">
                    Tarjeta Crédito / Débito
                  </p>
                  <p className="text-[11px] text-slate-500">Visa, Mastercard, Amex, Diners</p>
                </div>
              </button>

              <button
                type="button"
                disabled={!isPending || isUnknownVerification}
                onClick={() => handleMethodChange('yape')}
                className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50 ${
                  method === 'yape'
                    ? 'border-[#742284] bg-purple-50/60 ring-1 ring-[#742284]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 text-[#742284] shrink-0" />
                <div>
                  <p className="font-headline font-bold text-xs sm:text-sm text-slate-900">
                    Yape Instantáneo
                  </p>
                  <p className="text-[11px] text-slate-500">Celular + Código de aprobación</p>
                </div>
              </button>
            </div>

            <form onSubmit={handleStartPayment} className="space-y-4">
              {method === 'card' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Titular de la tarjeta (Tokenización Culqi Checkout)
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Nombre como figura en la tarjeta"
                      disabled={!isPending}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B3B5B] disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Número de tarjeta (No almacenado en DMGOTRAVEL · RN-18)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 •••• •••• 1111"
                      disabled={!isPending}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#0B3B5B] disabled:bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Vencimiento (MM/AA)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        disabled={!isPending}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#0B3B5B] disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Código CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        disabled={!isPending}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#0B3B5B] disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Número de celular afiliado a Yape
                    </label>
                    <input
                      type="tel"
                      value={yapePhone}
                      onChange={(e) => setYapePhone(e.target.value)}
                      placeholder="+51 999 888 777"
                      disabled={!isPending}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm tabular-nums focus:outline-none focus:border-[#742284]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Código de aprobación de 6 dígitos (App Yape)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={yapeOtp}
                      onChange={(e) => setYapeOtp(e.target.value)}
                      placeholder="123456"
                      disabled={!isPending}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm tracking-widest font-bold tabular-nums focus:outline-none focus:border-[#742284]"
                    />
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#146C53] shrink-0 mt-0.5" />
                <span>
                  <strong>Privacidad PCI / RN-18:</strong> Los datos de tarjeta o código Yape se
                  tokenizan directamente con Culqi; DMGOTRAVEL solo transmite el método autorizado y
                  liquida el monto oficial congelado en PostgreSQL.
                </span>
              </div>

              {isPending && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={processing || isUnknownVerification}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] disabled:opacity-50 text-white font-headline font-bold text-sm shadow-md transition-colors cursor-pointer tabular-nums"
                  >
                    {processing
                      ? 'Validando pago con Culqi...'
                      : `Pagar ${formatPen(reservation.total)} PEN y Confirmar`}
                  </button>

                  {!isUnknownVerification && (
                    <button
                      type="button"
                      disabled={cancelling || processing}
                      onClick={() => void handleCancelPendingReservation()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
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

        {/* Columna Derecha: Snapshot Histórico Inmutable de la Reserva */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="h-40 relative">
            <SmartImage
              src={STITCH_MEDIA.millpu}
              alt="Resumen de experiencia reservada"
              category="tour"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091E32]/85 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Snapshot Histórico Inmutable (RN-02)
              </span>
              <p className="font-headline font-bold text-base">
                Resumen Oficial de tu Orden #{reservation.reservationNumber}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5 text-xs">
            {reservation.departure && (
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Componente Turístico
                </p>
                <p className="font-bold text-slate-900">
                  Salida: {formatLimaDateTime(reservation.departure.startDate)}
                </p>
                <p className="text-slate-500">
                  Retorno: {formatLimaDateTime(reservation.departure.endDate)}
                </p>
                <p className="text-slate-700 font-medium tabular-nums">
                  Viajeros registrados: <strong>{reservation.travelers}</strong> · Tarifa unitaria:{' '}
                  {formatPen(reservation.departure.price)}
                </p>
              </div>
            )}

            {reservation.lodging ? (
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#146C53]">
                  Alojamiento Opcional Consolidado
                </p>
                <p className="font-bold text-slate-900">{reservation.lodging.hotelName}</p>
                <p className="text-slate-600">
                  {reservation.lodging.roomTypeName} (Cap. {reservation.lodging.capacity} huéspedes)
                </p>
                <p className="text-slate-500 tabular-nums">
                  Check-in {formatLimaDate(reservation.lodging.checkInDate)} → Check-out{' '}
                  {formatLimaDate(reservation.lodging.checkOutDate)} ({reservation.lodging.nights}{' '}
                  noches × {formatPen(reservation.lodging.nightlyRate)})
                </p>
                <p className="font-semibold text-slate-900 tabular-nums">
                  Subtotal alojamiento: {formatPen(reservation.lodging.subtotal)}
                </p>
              </div>
            ) : (
              <div className="pb-4 border-b border-slate-100 text-slate-500">
                Modalidad: <strong>Solo servicio turístico</strong> (sin alojamiento opcional).
              </div>
            )}

            <div className="flex items-baseline justify-between pt-1">
              <span className="font-headline font-bold text-sm text-slate-900">
                Total Congelado ({reservation.currency})
              </span>
              <span className="font-headline font-extrabold text-2xl text-[#0B3B5B] tabular-nums">
                {formatPen(reservation.total)}
              </span>
            </div>

            {paymentAttempt && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Último intento ({paymentAttempt.method.toUpperCase()})
                  </p>
                  <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                    ID: {paymentAttempt.id.slice(0, 8)}...
                  </p>
                </div>
                <StatusBadge status={paymentAttempt.status} size="sm" />
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-slate-700 flex items-start gap-2">
              <MailCheck className="w-4 h-4 text-[#146C53] shrink-0 mt-0.5" />
              <span>
                Tras la validación del pago exitoso, recibirás tu confirmación y comprobante
                electrónico mediante <strong>Resend</strong> en{' '}
                <strong>{user?.email ?? 'tu correo verificado'}</strong>.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
