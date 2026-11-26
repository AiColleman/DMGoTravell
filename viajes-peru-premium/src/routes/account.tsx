import { createFileRoute } from '@tanstack/react-router';
import { AccountLayout } from '@/features/account/account-pages';
export const Route=createFileRoute('/account')({component:()=> <AccountLayout/>});
