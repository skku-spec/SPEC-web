# Supabase Layer

5 files. Database access, auth, types.

## FILES
| File | Usage | Import from |
|------|-------|-------------|
| server.ts | Server-side client (cookies-based auth) | Server components, server actions, middleware |
| client.ts | Browser-side client | Client components only |
| admin.ts | Service-role client (bypasses RLS) | Admin operations, bucket management |
| middleware.ts | Session refresh in middleware | middleware.ts only |
| types.ts | Auto-generated DB types + manual additions | Everywhere |

## RULES
- NEVER import `server.ts` in client components (causes build error)
- NEVER import `client.ts` in server components
- Use `admin.ts` only for RLS-bypass operations (applications SELECT, tag mutations, bucket creation)
- `types.ts` is manually maintained (not auto-generated) — update after migrations

## TYPES
- `ProfileRole`: "outsider" | "learner" | "alumni" | "preneur"
- `Database["public"]["Tables"]`: profiles, members, posts, applications, spec_events, spec_logs, etc.
- Profile row includes `is_admin: boolean`

## RLS PATTERNS
- Most tables: authenticated can SELECT, role-based INSERT/UPDATE/DELETE
- `applications`: admin-only SELECT (use admin client), public INSERT
- `spec_events`: preneur or is_admin for writes
- `spec_logs`: learner+preneur for INSERT, author or is_admin for DELETE
