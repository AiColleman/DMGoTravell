import { createIdempotencyKey, parseDecimal } from '../lib/format';
import type { PaymentMethodType } from '../types/api';

/**
 * Contrato de salida del Adaptador de Tokenización de Culqi (ADR-007, RC14, RS07, AC11).
 * Garantiza que React nunca almacene ni envíe PAN, fecha de expiración ni CVV al backend.
 */
export interface CulqiTokenResult {
  tokenId: string;
  method: PaymentMethodType;
  email: string;
  amountCents: number;
  currency: 'PEN';
  providerMode: 'culqi-js-v4' | 'sandbox-ac11';
}

export interface CulqiTokenizeInput {
  reservationNumber: string;
  amountPen: string;
  email: string;
  method: PaymentMethodType;
}

export interface ICulqiCheckoutPort {
  readonly mode: 'culqi-js-v4' | 'sandbox-ac11';
  readonly publicKeyConfigured: boolean;
  tokenize(input: CulqiTokenizeInput): Promise<CulqiTokenResult>;
}

interface CulqiGlobalSdk {
  publicKey: string;
  token?: { id: string; email?: string };
  error?: { user_message?: string; merchant_message?: string };
  settings: (cfg: {
    title: string;
    currency: 'PEN';
    amount: number;
    description?: string;
  }) => void;
  options?: (opts: {
    lang?: 'es' | 'auto';
    installments?: boolean;
    paymentMethods?: {
      tarjeta?: boolean;
      yape?: boolean;
    };
  }) => void;
  open: () => void;
  close?: () => void;
}

declare global {
  interface Window {
    Culqi?: CulqiGlobalSdk;
    culqi?: () => void;
  }
}

const CULQI_SDK_SRC = 'https://checkout.culqi.com/js/v4';

function loadCulqiScriptOnce(): Promise<CulqiGlobalSdk> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Culqi Checkout requiere un entorno de navegador.'));
  }
  if (window.Culqi) {
    return Promise.resolve(window.Culqi);
  }

  return new Promise<CulqiGlobalSdk>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CULQI_SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.Culqi) resolve(window.Culqi);
        else reject(new Error('No se inicializó window.Culqi tras cargar el SDK v4.'));
      });
      existing.addEventListener('error', () =>
        reject(new Error('No se pudo cargar el SDK oficial de Culqi Checkout v4.'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = CULQI_SDK_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Culqi) resolve(window.Culqi);
      else reject(new Error('Culqi Checkout v4 cargó sin exponer window.Culqi.'));
    };
    script.onerror = () =>
      reject(new Error('Error de red al cargar https://checkout.culqi.com/js/v4.'));
    document.head.appendChild(script);
  });
}

/**
 * Adaptador productivo conectado al SDK oficial Culqi Checkout v4 (`VITE_CULQI_PUBLIC_KEY`).
 * Captura los datos sensibles dentro del iframe aislado de Culqi (cumplimiento RS07).
 */
class CulqiSdkV4Adapter implements ICulqiCheckoutPort {
  public readonly mode = 'culqi-js-v4' as const;
  public readonly publicKeyConfigured = true;
  private readonly publicKey: string;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  public async tokenize(input: CulqiTokenizeInput): Promise<CulqiTokenResult> {
    const sdk = await loadCulqiScriptOnce();
    const amountCents = Math.max(100, Math.round(parseDecimal(input.amountPen) * 100));

    return new Promise<CulqiTokenResult>((resolve, reject) => {
      sdk.publicKey = this.publicKey;
      sdk.settings({
        title: 'DMGOTRAVEL · Viajes Perú Premium',
        currency: 'PEN',
        amount: amountCents,
        description: `Reserva ${input.reservationNumber}`,
      });
      sdk.options?.({
        lang: 'es',
        installments: false,
        paymentMethods: {
          tarjeta: input.method === 'card',
          yape: input.method === 'yape',
        },
      });

      window.culqi = () => {
        if (sdk.token?.id) {
          sdk.close?.();
          resolve({
            tokenId: sdk.token.id,
            method: input.method,
            email: sdk.token.email || input.email,
            amountCents,
            currency: 'PEN',
            providerMode: 'culqi-js-v4',
          });
          return;
        }
        const message =
          sdk.error?.user_message ||
          sdk.error?.merchant_message ||
          'Culqi rechazó la tokenización del medio de pago.';
        reject(new Error(message));
      };

      sdk.open();
    });
  }
}

/**
 * Doble determinista de tokenización para desarrollo local y pruebas automatizadas sin
 * credenciales externas reales, conforme a AC11 (Testabilidad) y RS07 (cero PAN/CVV en DOM).
 */
class LocalSandboxCulqiAdapter implements ICulqiCheckoutPort {
  public readonly mode = 'sandbox-ac11' as const;
  public readonly publicKeyConfigured = false;

  public async tokenize(input: CulqiTokenizeInput): Promise<CulqiTokenResult> {
    const amountCents = Math.max(100, Math.round(parseDecimal(input.amountPen) * 100));
    const suffix = createIdempotencyKey().replace(/-/g, '').slice(0, 16);
    return {
      tokenId: `tok_sandbox_${input.method}_${suffix}`,
      method: input.method,
      email: input.email,
      amountCents,
      currency: 'PEN',
      providerMode: 'sandbox-ac11',
    };
  }
}

export function createCulqiCheckoutAdapter(explicitPublicKey?: string): ICulqiCheckoutPort {
  const key = (explicitPublicKey ?? import.meta.env.VITE_CULQI_PUBLIC_KEY ?? '').trim();
  if (key.startsWith('pk_')) {
    return new CulqiSdkV4Adapter(key);
  }
  return new LocalSandboxCulqiAdapter();
}
