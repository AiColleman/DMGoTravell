import {
  calculateReservationTotals,
  canTransitionReservation,
  detectAllowedImageMime,
  isReservationExpired,
  isValidProblemDetails,
  maskRecipientEmail,
  MAX_IMAGE_BYTES,
  signCulqiWebhook,
  verifyCulqiWebhookSignature
} from '../src/domainRules';

describe('Reglas de dominio y negocio DMGOTRAVEL (Specs 001-013)', () => {
  describe('Cálculo de totales de reserva (Spec 001 / 007)', () => {
    it('calcula reserva simple de tour en PEN con redondeo exacto', () => {
      const result = calculateReservationTotals(120.5, 3);
      expect(result).toEqual({
        touristSubtotal: 361.5,
        lodgingSubtotal: 0,
        total: 361.5,
        currency: 'PEN'
      });
    });

    it('calcula reserva compuesta tour + alojamiento multi-noche', () => {
      const result = calculateReservationTotals(150, 2, 185.75, 2);
      expect(result).toEqual({
        touristSubtotal: 300,
        lodgingSubtotal: 371.5,
        total: 671.5,
        currency: 'PEN'
      });
    });

    it('rechaza precios, viajeros o noches inválidas', () => {
      expect(() => calculateReservationTotals(0, 2)).toThrow();
      expect(() => calculateReservationTotals(100, 0)).toThrow();
      expect(() => calculateReservationTotals(100, 1.5)).toThrow();
      expect(() => calculateReservationTotals(100, 2, -10, 1)).toThrow();
      expect(() => calculateReservationTotals(100, 2, 100, -1)).toThrow();
    });
  });

  describe('Transiciones de estado de reserva (Spec 001 / 009)', () => {
    it('permite pending -> confirmed únicamente mediante pago validado', () => {
      expect(canTransitionReservation('pending', 'confirmed', 'payment')).toBe(true);
      expect(canTransitionReservation('pending', 'confirmed', 'admin')).toBe(false);
      expect(canTransitionReservation('pending', 'confirmed', 'client')).toBe(false);
    });

    it('permite cancelar pending por cliente o sistema y confirmed solo por admin', () => {
      expect(canTransitionReservation('pending', 'cancelled', 'client')).toBe(true);
      expect(canTransitionReservation('pending', 'cancelled', 'system')).toBe(true);
      expect(canTransitionReservation('pending', 'cancelled', 'admin')).toBe(false);
      expect(canTransitionReservation('confirmed', 'cancelled', 'admin')).toBe(true);
      expect(canTransitionReservation('confirmed', 'cancelled', 'client')).toBe(false);
    });

    it('permite completar solo reservas confirmadas por admin y prohíbe reactivar canceladas', () => {
      expect(canTransitionReservation('confirmed', 'completed', 'admin')).toBe(true);
      expect(canTransitionReservation('pending', 'completed', 'admin')).toBe(false);
      expect(canTransitionReservation('cancelled', 'confirmed', 'payment')).toBe(false);
    });
  });

  describe('Vencimiento automático de reservas (Spec 003)', () => {
    const createdAt = new Date('2026-11-23T15:00:00Z');

    it('vence a los 15 minutos sin pago en curso', () => {
      expect(isReservationExpired(createdAt, new Date('2026-11-23T15:14:59Z'), false)).toBe(false);
      expect(isReservationExpired(createdAt, new Date('2026-11-23T15:15:00Z'), false)).toBe(true);
    });

    it('extiende hasta 20 minutos cuando existe pago oportuno en validación', () => {
      expect(isReservationExpired(createdAt, new Date('2026-11-23T15:19:59Z'), true)).toBe(false);
      expect(isReservationExpired(createdAt, new Date('2026-11-23T15:20:00Z'), true)).toBe(true);
    });
  });

  describe('Privacidad de notificaciones y validación multimedia (Spec 004 / 012)', () => {
    it('enmascara destinatarios sin exponer el correo completo', () => {
      expect(maskRecipientEmail('Cliente.Viajero@Example.com')).toBe('cl***@example.com');
      expect(maskRecipientEmail('ab@test.pe')).toBe('a***@test.pe');
      expect(maskRecipientEmail('invalido')).toBe('***');
    });

    it('detecta magic bytes válidos JPEG, PNG y WebP y rechaza falsificados o > 5 MB', () => {
      expect(detectAllowedImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
      expect(
        detectAllowedImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ).toBe('image/png');
      expect(
        detectAllowedImageMime(
          new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
        )
      ).toBe('image/webp');
      expect(detectAllowedImageMime(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBeNull();
      expect(detectAllowedImageMime(new Uint8Array(0))).toBeNull();

      const oversized = new Uint8Array(MAX_IMAGE_BYTES + 1);
      oversized.set([0xff, 0xd8, 0xff]);
      expect(detectAllowedImageMime(oversized)).toBeNull();
    });
  });

  describe('Seguridad de webhooks Culqi y contrato ProblemDetails (AC04 / AC08)', () => {
    it('verifica firma HMAC-SHA256 válida y rechaza firmas manipuladas', () => {
      const secret = 'whsec_test_secret';
      const body = '{"id":"evt_1","type":"payment.succeeded"}';
      const sig = signCulqiWebhook(secret, body);

      expect(verifyCulqiWebhookSignature(secret, body, sig)).toBe(true);
      expect(verifyCulqiWebhookSignature(secret, body, `sha256=${sig}`)).toBe(true);
      expect(verifyCulqiWebhookSignature(secret, body, 'firma_invalida')).toBe(false);
      expect(verifyCulqiWebhookSignature('', body, sig)).toBe(false);
    });

    it('valida estructura RFC 7807 ProblemDetails', () => {
      expect(
        isValidProblemDetails({
          type: 'https://dmgotravel.com/errors/conflict',
          title: 'Conflicto',
          status: 409,
          code: 'insufficient_capacity',
          detail: 'No existen cupos suficientes.'
        })
      ).toBe(true);
      expect(isValidProblemDetails({ message: 'error sin estándar' })).toBe(false);
      expect(isValidProblemDetails(null)).toBe(false);
    });
  });
});
