import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/app/routes';
import { PageIntro } from '@/components/common/shared';
export const Route=createFileRoute('/policies')({validateSearch:(s:Record<string,unknown>)=>({section:s.section==='privacy'?'privacy':'terms'}),head:()=>pageHead('Políticas de la demostración','Información sobre condiciones de reserva y privacidad en la demostración de DMGOTRAVEL.'),component:Page});
function Page(){const {section}=Route.useSearch();return <div className="container page-shell"><PageIntro title={section==='privacy'?'Política de privacidad':'Términos y condiciones'} description="Información ilustrativa. Estas condiciones no constituyen un contrato comercial real."/><div className="detail-copy"><h3>Un entorno de demostración</h3><p>No se realizan reservas, cobros ni autenticación reales.</p></div></div>}
