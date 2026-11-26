import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeadContent, Link, Outlet, Scripts, createRootRouteWithContext, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import appCss from '../styles.css?url';
import { reportLovableError } from '../lib/lovable-error-reporting';
import { DemoProvider } from '@/app/demo-context';
import { SiteLayout } from '@/components/layout/site-layout';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

function NotFoundComponent() {
  return <div className="container standalone-state"><span className="eyebrow">ERROR 404</span><h1>Esta ruta no lleva a ningún destino.</h1><p>La página que buscas no existe o cambió de dirección.</p><Button asChild><Link to="/">Volver al inicio</Link></Button></div>;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: 'tanstack_root_error_component' }); }, [error]);
  return <div className="container standalone-state"><span className="eyebrow">NO PUDIMOS CARGAR ESTA PÁGINA</span><h1>Algo interrumpió el recorrido.</h1><p>Puedes intentarlo otra vez o volver al inicio.</p><div className="button-row"><Button onClick={() => { router.invalidate(); reset(); }}>Intentar de nuevo</Button><Button asChild variant="outline"><Link to="/">Volver al inicio</Link></Button></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DMGOTRAVEL · Experiencias en Perú' },
      { name: 'description', content: 'Descubre experiencias y alojamientos en Perú con DMGOTRAVEL.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap' },
    ],
  }),
  shellComponent: ({ children }: { children: ReactNode }) => <html lang="es"><head><HeadContent /></head><body>{children}<Scripts /></body></html>,
  component: function RootComponent() {
    const { queryClient } = Route.useRouteContext();
    return <QueryClientProvider client={queryClient}><DemoProvider><SiteLayout><Outlet /></SiteLayout><Toaster richColors /></DemoProvider></QueryClientProvider>;
  },
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
