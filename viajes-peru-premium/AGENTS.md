<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Frontend architecture
- Retain TanStack Router/Start and its Vite bootstrap rather than React Router because routing is fixed by the host template; all product behavior remains client-side and no server handlers are introduced.
- Keep domain types, fixtures and REST-ready services separate from feature UI; VITE_API_BASE_URL is the only future API base and mocks never initiate network requests.
- Use a React context for volatile simulated sessions, bookings and management changes because this demo must not create backend persistence or real authentication.
- Define all route metadata in leaf route files and shared brand/layout in reusable components because every page must remain independently navigable.
