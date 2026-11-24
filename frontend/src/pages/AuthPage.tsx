import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Compass,
  KeyRound,
  Lock,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../api/services';
import { SmartImage } from '../components/ui/SmartImage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { STITCH_MEDIA } from '../lib/mediaCatalog';

type AuthMode = 'login' | 'register' | 'verify' | 'forgot';

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register, updateLocalUser, apiOnline } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const rawMode = searchParams.get('mode');
  const mode: AuthMode =
    rawMode === 'register' || rawMode === 'verify' || rawMode === 'forgot' ? rawMode : 'login';
  const returnTo = searchParams.get('returnTo') || '/';

  // Campos de formulario (Login / Register / Verify / Reset)
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+51 ');
  const [verifyToken, setVerifyToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: AuthMode) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mode', next);
    setSearchParams(nextParams);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const session = await login({ email: email.trim(), password });
      notifySuccess('Bienvenido de nuevo', `Sesión iniciada como ${session.user.fullName}.`);
      if (session.user.role.toLowerCase() === 'admin' && returnTo === '/') {
        navigate('/admin/reportes');
      } else {
        navigate(returnTo);
      }
    } catch (err) {
      notifyError(err, 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const session = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: cleanPhone.length > 3 ? cleanPhone : null,
      });
      notifySuccess(
        'Cuenta creada exitosamente',
        'Verifica tu correo electrónico para habilitar reservas y pagos.'
      );
      setEmail(session.user.email);
      switchMode('verify');
    } catch (err) {
      notifyError(err, 'No se pudo completar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.verifyEmail(verifyToken.trim());
      updateLocalUser({ emailVerified: true });
      notifySuccess('Correo verificado', 'Tu cuenta ya puede reservar y procesar pagos.');
      navigate(returnTo);
    } catch (err) {
      notifyError(err, 'Enlace o prueba de verificación inválida');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setSubmitting(true);
    try {
      const res = await authApi.resendVerification();
      notifySuccess(
        'Nuevo enlace admitido (Spec 005-C)',
        `Solo el último enlace emitido es válido (expira: ${new Date(res.expiresAt).toLocaleTimeString('es-PE')}).`
      );
    } catch (err) {
      notifyError(err, 'No se pudo reenviar la verificación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevAutoFetchVerifyToken = async () => {
    const targetEmail = (email || user?.email || '').trim();
    if (!targetEmail) {
      notifyError(new Error('Ingresa primero el correo de la cuenta registrada.'));
      return;
    }
    try {
      const { token } = await authApi.devGetVerificationToken(targetEmail);
      setVerifyToken(token);
      notifySuccess('Token de desarrollo obtenido', 'Haz clic en Confirmar Verificación.');
    } catch (err) {
      notifyError(err, 'No hay token pendiente en memoria local para ese correo');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setResetRequested(true);
      notifySuccess(
        'Solicitud recibida',
        'Si la cuenta existe y está activa, se envió una prueba de recuperación de un solo uso.'
      );
    } catch (err) {
      notifyError(err, 'No se pudo procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevAutoFetchResetToken = async () => {
    if (!email.trim()) return;
    try {
      const { token } = await authApi.devGetPasswordResetToken(email.trim());
      setResetToken(token);
      notifySuccess('Token de recuperación obtenido', 'Ingresa tu nueva contraseña y confirma.');
    } catch (err) {
      notifyError(err, 'No se encontró token de recuperación local');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.resetPassword(resetToken.trim(), newPassword);
      notifySuccess('Contraseña restablecida', 'Ya puedes iniciar sesión con tu nueva clave.');
      setResetRequested(false);
      switchMode('login');
    } catch (err) {
      notifyError(err, 'No se pudo restablecer la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleOAuth = () => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    window.location.href = `${apiBase}/api/v1/auth/google/start?returnPath=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Panel Izquierdo Editorial */}
        <div className="lg:col-span-5 relative bg-[#091E32] text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-45">
            <SmartImage
              src={STITCH_MEDIA.machuPicchu}
              alt="Amanecer en los Andes Peruanos"
              category="package"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091E32] via-[#091E32]/70 to-[#091E32]/50" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D95D39] flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-extrabold text-lg tracking-tight">
                DMGOTRAVEL
              </span>
            </div>

            <div className="space-y-3 pt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                Identidad y Seguridad (Spec 005)
              </span>
              <h1 className="font-headline font-extrabold text-2xl sm:text-3xl leading-tight">
                Gestiona tus reservas y comprobantes con seguridad empresarial
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Autenticación respaldada por JWT de corta duración, rotación de Refresh Cookies{' '}
                <code className="text-emerald-300">HttpOnly</code> con validación{' '}
                <code className="text-emerald-300">X-CSRF-Token</code> y vinculación OAuth 2.0.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-2.5 pt-8 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin duplicación de cuentas por correo electrónico</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Aislamiento estricto por usuario y rol (RBAC)</span>
            </div>
            <div className="flex items-center gap-2">
              <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verificación de un solo uso con sustitución segura (005-C)</span>
            </div>
          </div>
        </div>

        {/* Panel Derecho de Formularios */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6">
          {/* Pestañas superiores */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="inline-flex p-1 rounded-xl bg-slate-100">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-[#0B3B5B] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-[#0B3B5B] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Crear Cuenta
              </button>
              <button
                type="button"
                onClick={() => switchMode('verify')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'verify' ? 'bg-[#0B3B5B] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Verificar Correo
              </button>
            </div>

            <Link to="/catalogo" className="text-xs font-semibold text-slate-500 hover:text-[#0B3B5B]">
              Explorar sin cuenta →
            </Link>
          </div>

          {/* ================= MODO LOGIN ================= */}
          {mode === 'login' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline font-extrabold text-xl text-slate-900">
                  Accede a tu cuenta DMGOTRAVEL
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa tus credenciales o utiliza Google OAuth 2.0.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={apiOnline === false}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
              >
                <span className="w-4 h-4 rounded-full bg-[#4285F4] text-white text-[10px] font-extrabold flex items-center justify-center">
                  G
                </span>
                Continuar con Google (OpenID Connect)
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="px-3 text-[11px] text-slate-400 font-medium">
                  o con tu correo registrado
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@example.test"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-[#D95D39] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] disabled:opacity-50 text-white font-headline font-bold text-sm shadow-md transition-colors cursor-pointer"
                >
                  {submitting ? 'Autenticando...' : 'Iniciar Sesión'}
                </button>
              </form>
            </div>
          )}

          {/* ================= MODO REGISTRO ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="font-headline font-extrabold text-xl text-slate-900">
                  Crear Cuenta de Viajero
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Las cuentas públicas se crean con rol <code className="font-mono">client</code>{' '}
                  (RN-27).
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Valeria Mendoza Quispe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B3B5B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="valeria@correo.pe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Teléfono móvil (opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contraseña segura
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 12 caracteres (ej. Clave-Segura-2026)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B3B5B]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] disabled:opacity-50 text-white font-headline font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                {submitting ? 'Registrando cuenta...' : 'Registrarme e Iniciar Sesión'}
              </button>
            </form>
          )}

          {/* ================= MODO VERIFICACIÓN DE CORREO (SPEC 005-C) ================= */}
          {mode === 'verify' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline font-extrabold text-xl text-slate-900">
                  Verificación de Correo Electrónico (Spec 005-C)
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Ingresa el token de un solo uso enviado a tu bandeja. Si solicitas un nuevo enlace,
                  los anteriores quedan sustituidos automáticamente y solo el más reciente es
                  consumible.
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Correo de la cuenta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="valeria@correo.pe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Token de verificación
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="Pega aquí el token recibido"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0B3B5B]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl bg-[#146C53] hover:bg-[#0D4B39] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Verificación
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleResendVerification()}
                    className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Reenviar enlace nuevo
                  </button>
                </div>
              </form>

              {import.meta.env.DEV && (
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-sky-950">
                    <strong>Asistente Desarrollo Local:</strong> Obtiene el token desde{' '}
                    <code className="font-mono">/api/v1/auth/dev/verification-token</code> sin SMTP.
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDevAutoFetchVerifyToken()}
                    className="px-3.5 py-2 rounded-lg bg-[#0B3B5B] text-white font-bold cursor-pointer"
                  >
                    Obtener Token Dev
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= MODO RECUPERACIÓN DE CONTRASEÑA ================= */}
          {mode === 'forgot' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-headline font-extrabold text-xl text-slate-900 inline-flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#D95D39]" />
                  Recuperación Segura de Contraseña
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  La respuesta es uniforme para no revelar si un correo existe en el sistema.
                </p>
              </div>

              {!resetRequested ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Correo electrónico de tu cuenta
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.pe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold cursor-pointer"
                  >
                    Solicitar enlace de recuperación
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Token de recuperación de un solo uso
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Token de restablecimiento"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña segura"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-3 rounded-xl bg-[#D95D39] text-white text-xs font-bold cursor-pointer"
                    >
                      Restablecer Contraseña
                    </button>
                    {import.meta.env.DEV && (
                      <button
                        type="button"
                        onClick={() => void handleDevAutoFetchResetToken()}
                        className="px-4 py-3 rounded-xl bg-sky-100 text-[#0B3B5B] text-xs font-bold cursor-pointer"
                      >
                        Autocompletar Token Dev
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
