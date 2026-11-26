import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  MailCheck,
  MapPin,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PERU_ASSETS } from '../lib/peruCatalog';
import { PeruPhoto, SectionEyebrow } from '../components/ui/EditorialPrimitives';

type AuthViewMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export const AuthEditorialPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    login,
    register,
    completeOAuthSession,
    refreshSession,
    loginDemoRole,
    user,
    apiOnline,
    updateLocalUser,
  } = useAuth();
  const { notifyError, notifySuccess } = useToast();

  const rawMode = (searchParams.get('mode') ?? 'login') as AuthViewMode;
  const mode: AuthViewMode = ['login', 'register', 'verify', 'forgot', 'reset'].includes(rawMode)
    ? rawMode
    : 'login';
  const returnTo = searchParams.get('returnTo') || '/cuenta';
  const oauthCode = searchParams.get('code');
  const oauthState = searchParams.get('state');
  const oauthSuccess = searchParams.get('oauthSuccess');
  const oauthError = searchParams.get('oauthError') || searchParams.get('error');

  React.useEffect(() => {
    if (!oauthError) return;
    const message =
      oauthError === 'google_oauth_not_configured'
        ? 'Falta configurar GoogleOAuth:ClientId y GoogleOAuth:ClientSecret en el backend (appsettings.Local.json).'
        : oauthError === 'access_denied'
          ? 'Cancelaste el inicio de sesión con Google.'
          : `No se pudo iniciar sesión con Google (${oauthError}).`;
    notifyError(new Error(message), 'Google OAuth 2.0');
    const cleaned = new URLSearchParams(searchParams);
    cleaned.delete('oauthError');
    cleaned.delete('error');
    setSearchParams(cleaned, { replace: true });
  }, [oauthError, notifyError, searchParams, setSearchParams]);

  React.useEffect(() => {
    if (oauthSuccess !== '1') return;
    let active = true;
    (async () => {
      setSubmitting(true);
      try {
        const refreshed = await refreshSession();
        if (active && refreshed) {
          notifySuccess(`¡Autenticado con Google como ${refreshed.user.fullName}!`);
          navigate(refreshed.user.role === 'admin' ? '/admin/reportes' : returnTo, {
            replace: true,
          });
        }
      } finally {
        if (active) setSubmitting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [oauthSuccess, refreshSession, navigate, notifySuccess, returnTo]);

  React.useEffect(() => {
    if (!oauthCode || !oauthState) return;
    let active = true;
    (async () => {
      setSubmitting(true);
      try {
        const sess = await authApi.googleCallback(oauthCode, oauthState);
        if (!active) return;
        completeOAuthSession(sess);
        notifySuccess(`¡Autenticado con Google como ${sess.user.fullName}!`);
        navigate(sess.user.role === 'admin' ? '/admin/reportes' : returnTo, { replace: true });
      } catch (err) {
        const refreshed = await refreshSession();
        if (active && refreshed) {
          notifySuccess(`¡Sesión iniciada como ${refreshed.user.fullName}!`);
          navigate(refreshed.user.role === 'admin' ? '/admin/reportes' : returnTo, {
            replace: true,
          });
          return;
        }
        if (active) notifyError(err, 'No se pudo completar el acceso con Google OAuth 2.0');
      } finally {
        if (active) setSubmitting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [oauthCode, oauthState, completeOAuthSession, refreshSession, navigate, notifyError, notifySuccess, returnTo]);

  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordStrength =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const switchMode = (next: AuthViewMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('mode', next);
    setSearchParams(params);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const sess = await login({ email: email.trim(), password });
        notifySuccess(`¡Bienvenido, ${sess.user.fullName}!`);
        navigate(sess.user.role === 'admin' ? '/admin/reportes' : returnTo);
      } else if (mode === 'register') {
        const sess = await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || null,
        });
        notifySuccess(
          'Cuenta creada en DMGOTRAVEL',
          'Verifica tu correo electrónico para habilitar reservas.'
        );
        if (!sess.user.emailVerified) {
          switchMode('verify');
        } else {
          navigate(returnTo);
        }
      } else if (mode === 'verify') {
        await authApi.verifyEmail(token.trim());
        updateLocalUser({ emailVerified: true });
        notifySuccess('Correo verificado exitosamente', 'Ya puedes generar reservas.');
        navigate(returnTo);
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(email.trim());
        notifySuccess('Enlace solicitado', 'Ingresa el token recibido para restablecer tu clave.');
        switchMode('reset');
      } else if (mode === 'reset') {
        await authApi.resetPassword(token.trim(), newPassword);
        notifySuccess('Contraseña actualizada', 'Inicia sesión con tu nueva clave.');
        switchMode('login');
      }
    } catch (err) {
      notifyError(err, 'No se pudo completar la operación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevToken = async () => {
    const targetEmail = email.trim() || user?.email;
    if (!targetEmail) return;
    try {
      const res =
        mode === 'verify'
          ? await authApi.devGetVerificationToken(targetEmail)
          : await authApi.devGetPasswordResetToken(targetEmail);
      setToken(res.token);
      notifySuccess('Token de desarrollo obtenido');
    } catch (err) {
      notifyError(err, 'Token dev no disponible');
    }
  };

  const handleDemoQuickAccess = (role: 'client' | 'admin') => {
    const sess = loginDemoRole(role);
    notifySuccess(
      `Sesión vista previa iniciada (${role === 'admin' ? 'Administrador' : 'Viajero'})`,
      `Activo como ${sess.user.fullName}`
    );
    navigate(role === 'admin' ? '/admin/reportes' : returnTo);
  };

  return (
    <div className="min-h-[calc(100vh-116px)] grid grid-cols-1 lg:grid-cols-12">
      {/* Fotografía Editorial Izquierda */}
      <div className="hidden lg:block lg:col-span-6 relative overflow-hidden bg-[#12232E]">
        <PeruPhoto
          src={PERU_ASSETS.peruHero}
          alt="Machu Picchu, Cusco"
          category="package"
          hintText="Machu Picchu Cusco"
          loading="eager"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720]/90 via-[#0B1720]/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-[#FAF7F2] space-y-4">
          <SectionEyebrow light>Identidad &amp; Acceso · Spec 005</SectionEyebrow>
          <h2 className="font-editorial text-5xl font-medium leading-tight">
            Cada gran historia en el Perú empieza con un primer paso.
          </h2>
          <p className="text-sm text-[#FAF7F2]/80 max-w-md leading-relaxed">
            Gestiona tus reservas compuestas, pagos verificados en Soles y preferencias personales
            con seguridad JWT y cookies protegidas.
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#C89B54]">
            <MapPin className="w-3.5 h-3.5" />
            Santuario Histórico de Machu Picchu · Cusco
          </span>
        </div>
      </div>

      {/* Formulario Derecho */}
      <div className="lg:col-span-6 flex items-center justify-center px-4 sm:px-10 py-12 bg-[#FAF7F2]">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <SectionEyebrow>Portal de Acceso DMGOTRAVEL</SectionEyebrow>
            <h1 className="font-editorial text-4xl font-medium text-[#12232E]">
              {mode === 'login' && 'Qué bueno verte de nuevo'}
              {mode === 'register' && 'Crea tu cuenta de viajero'}
              {mode === 'verify' && 'Verifica tu correo'}
              {mode === 'forgot' && 'Recupera tu contraseña'}
              {mode === 'reset' && 'Define tu nueva clave'}
            </h1>
          </div>

          {/* Selector Login / Registro */}
          {(mode === 'login' || mode === 'register') && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3EDE2] border border-[#E5DDD0]">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${mode === 'login' ? 'bg-[#FFFCF8] text-[#12232E] shadow-xs' : 'text-[#5C6B73]'
                  }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${mode === 'register' ? 'bg-[#FFFCF8] text-[#12232E] shadow-xs' : 'text-[#5C6B73]'
                  }`}
              >
                Registrarme
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="hairline-card rounded-2xl p-6 sm:p-7 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E] mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Valeria Quispe Mendoza"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E] mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                </div>
              </>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E] mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="viajero@correo.pe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#12232E]">
                    Contraseña
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-[#B84A27] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label="Mostrar u ocultar contraseña"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B73] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {mode === 'register' && password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full bg-[#F3EDE2] overflow-hidden">
                      <div
                        className="h-full bg-[#1B5E4A] transition-all"
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#5C6B73]">
                      Fortaleza: {passwordStrength >= 3 ? 'Alta' : passwordStrength === 2 ? 'Media' : 'Básica'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E] mb-1">
                    Token de un solo uso (Spec 005-C)
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Pega aquí el token enviado a tu correo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs font-mono"
                  />
                </div>

                {mode === 'reset' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#12232E] mb-1">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] text-xs"
                    />
                  </div>
                )}

                {import.meta.env.DEV && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDevToken()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EDE2] text-[11px] font-bold text-[#12232E] cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#B84A27]" />
                      Obtener Token Dev
                    </button>
                    {mode === 'verify' && (
                      <button
                        type="button"
                        onClick={() => void authApi.resendVerification().then(() => notifySuccess('Reenviado'))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7F3EE] text-[11px] font-bold text-[#1B5E4A] cursor-pointer"
                      >
                        <MailCheck className="w-3.5 h-3.5" />
                        Reenviar verificación
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-xl bg-[#B84A27] hover:bg-[#943618] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Confirmar operación'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {(mode === 'login' || mode === 'register') && (
              <a
                href={authApi.getGoogleStartUrl(returnTo)}
                className="w-full py-3 px-4 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#12232E] text-xs font-bold text-[#12232E] flex items-center justify-center gap-2 transition-colors"
              >
                <span className="font-serif font-bold text-sm text-[#B84A27]">G</span>
                Continuar con Google OAuth 2.0 / OIDC
              </a>
            )}
          </form>

          {/* Acceso Rápido Vista Previa (ideal cuando el backend aún no está levantado) */}
          <div className="rounded-2xl border border-[#E5DDD0] bg-[#F3EDE2]/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#12232E]">
              <Sparkles className="w-4 h-4 text-[#B84A27]" />
              Acceso Rápido de Exploración {apiOnline === false ? '(API local apagada)' : '(Vista Previa)'}
            </div>
            <p className="text-[11px] text-[#5C6B73] leading-relaxed">
              Explora de inmediato el flujo completo del Portal del Viajero o la Consola Ejecutiva
              Administrativa:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoQuickAccess('client')}
                className="py-2.5 px-3.5 rounded-xl bg-[#FFFCF8] border border-[#D2C6B4] hover:border-[#B84A27] text-xs font-bold text-[#12232E] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserRound className="w-3.5 h-3.5 text-[#B84A27]" />
                Entrar como Viajero
              </button>
              <button
                type="button"
                onClick={() => handleDemoQuickAccess('admin')}
                className="py-2.5 px-3.5 rounded-xl bg-[#12232E] hover:bg-[#263D4D] text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#C89B54]" />
                Entrar como Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
