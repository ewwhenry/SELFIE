# SELFIE — AGENTS.md

Guía de contexto para asistentes de IA que trabajan en este proyecto.

## Descripción del proyecto

SELFIE es un sistema de almacenamiento de archivos auto-hospedado (alternativa ligera a Google Drive/Dropbox). Cliente servidor en TypeScript, monorepo con Turborepo + pnpm.

## Stack tecnológico

| Capa | Tecnología |
|-------|-------------|
| Runtime | Node.js 20+ |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui |
| Backend | Hono 4 |
| ORM | Prisma 7 |
| DB | PostgreSQL |
| Auth | JWT (access + refresh tokens), httpOnly cookies, scrypt con salt+pepper |
| Monorepo | Turborepo + pnpm 10 |
| Linter/Formatter | Biome 2.4 |
| Paquetes | `apps/client`, `apps/server` |

## Estructura del proyecto

```
selfie/
├── apps/
│   ├── client/                    # Next.js 16 (App Router)
│   │   └── src/
│   │       ├── app/               # Páginas (layout, auth, dashboard, share)
│   │       ├── components/        # Componentes React (ui/, Dashboard*, Share*)
│   │       ├── contexts/          # UserContext (estado global del usuario)
│   │       ├── hooks/             # useUser hook
│   │       ├── lib/               # api.ts (cliente Axios), utils.ts (cn)
│   │       └── types/             # API.ts (interfaces de respuesta)
│   └── server/                    # Hono REST API
│       └── src/
│           ├── controllers/       # Handlers de rutas (auth, files, folders, share)
│           ├── middleware/        # authMiddleware, requireAdmin
│           ├── routes/            # Definiciones de rutas Hono
│           ├── services/          # Lógica de negocio (jwt, crypto, files, importer, device, validators)
│           ├── lib/               # prisma.ts (singleton)
│           └── types/             # jwt.ts (JWTPayload)
├── scripts/
│   └── setup.mjs                 # Script interactivo de configuración inicial
├── biome.json                     # Configuración de Biome
├── turbo.json                     # Pipeline de Turborepo
└── pnpm-workspace.yaml
```

## Convenciones de código

### Generales

- **TypeScript estricto** en toda la base de código.
- **Comillas dobles**, **punto y coma siempre** (configurado en Biome).
- Indentación con **2 espacios**.
- NO añadir comentarios a menos que sea necesario.
- **ESM**: el servidor usa `"type": "module"`, imports con extensión `.js`.

### Servidor (apps/server)

- **Rutas**: archivos en `routes/`, cada uno exporta un `new Hono()` por defecto. Se montan en `app.ts`.
- **Controladores**: funciones `Handler` asíncronas que reciben `c: Context`. Siguen el patrón: validar → operar → responder con `c.status()` + `c.json()`.
- **Servicios**: lógica pura sin dependencia de Hono (ej: `jwt.ts`, `crypto.ts`, `files.ts`).
- **Middleware**: `createMiddleware` de `hono/factory`. Inyecta `Variables` tipadas (`userId`, `role`).
- **Tipos de contexto**: definir un tipo local `type AuthEnv = { Variables: { userId: string } }` para cada controller que necesite autenticación.
- **Respuestas de error**: siempre retornar `c.status(XXX)` + `c.json({ message: "..." })` o `{ error: "..." }`.
- **Rutas públicas**: health (`/health`), auth (`/auth/register`, `/auth/login`, `/auth/refresh`), share (`/s/:token`, `/s/:token/download`).
- **Rutas autenticadas**: usan `authMiddleware` (cookie-based con rotación automática) o `authMiddlewareWithHeader` (Authorization header).
- **Rutas admin**: usan `requireAdmin` después de `authMiddleware`.
- **Transacciones Prisma**: usar `prisma.$transaction()` o `prisma.$transaction(async (tx) => { ... })` para operaciones que modifican múltiples tablas.
- **Serialización**: `BigInt` se serializa a string con `.toString()`. `DateTime` se serializa con `.toISOString()`.
- **Upload de archivos**: almacenar en disco en `STORAGE_PATH` con nombre `uuid.ext`. Usar `crypto.randomUUID()` para nombres únicos.

### Cliente (apps/client)

- **App Router** de Next.js 16: layouts, segmentos de ruta, `"use client"` para interactividad.
- **Componentes**: en `components/`, con subdirectorio `ui/` para shadcn/ui.
- **Rutas del dashboard**: `(dashboard)/dashboard/` con layout que envuelve en `UserProvider`.
- **Estados**: `useState` + `useEffect` para carga de datos. No se usa React Query ni SWR.
- **API**: Axios instance configurada con `withCredentials: true`. Funciones en `lib/api.ts`.
- **Rutas**: Definir wrapper functions en `api.ts` que llaman a Axios y retornan datos tipados.
- **Path aliases**: `@/components/*`, `@/lib/*`, `@/hooks/*`, `@/types/*`, `@/contexts/*`, `@/config`.
- **Estilos**: Tailwind CSS 4 con `cn()` utility (`clsx` + `tailwind-merge`). Tema oscuro por defecto.
- **Manejo de errores**: usar `toast` de `sonner` para feedback al usuario.
- **Iconos**: `lucide-react`.

### Base de datos (Prisma + PostgreSQL)

Modelos en `apps/server/prisma/schema.prisma`:

- **User**: id (UUID), firstName, lastName, email (único), role (USER/ADMIN enum), passwordHash, quotaBytes (5GB default), usedBytes.
- **Session**: id (CUID), userId (FK), refreshToken (único), expiresAt, deviceName, deviceType, ipAddress, lastActiveAt.
- **Folder**: id (UUID), userId (FK), name, parentId (self-FK jerárquico). Unique `[userId, name, parentId]`.
- **File**: id (UUID), userId (FK), originalName, storedName, mimeType, sizeBytes, path, folderId (FK), shareToken (único), shareExpiresAt.

## Comandos de desarrollo

```bash
pnpm install          # Instalar dependencias
pnpm run setup        # Configuración inicial interactiva (.env, secrets, storage)
pnpm dev              # Inicia servidor + cliente en paralelo (Turborepo)
pnpm build            # Build de producción
pnpm start            # Inicia build de producción
pnpm lint             # Biome lint
pnpm format           # Biome format --write
pnpm check            # Biome check
pnpm check:fix        # Biome check --write
```

## Notas importantes

- **Testing**: el proyecto actualmente **no tiene tests**. No añadir dependencias de testing sin consultar.
- **CI/CD**: no hay pipeline configurado.
- **Migraciones Prisma**: ejecutar `pnpm --filter server exec prisma migrate dev` para nuevas migraciones.
- **Prisma Client** se genera en `apps/server/generated/prisma/`.
- **No usar Docker**: el proyecto está diseñado para ejecutarse sin Docker.
- **Almacenamiento local**: los archivos se guardan en el directorio `uploads/` (configurable vía `STORAGE_DIR`).
- **Auth**: los tokens JWT se transmiten en httpOnly cookies. El middleware de autenticación rota tokens automáticamente cuando el access token expira pero el refresh token sigue siendo válido.
- **.env** está en `.gitignore`. Generado por `setup.mjs`.
- **Biome** es la única herramienta de linting/formatting. VS Code está configurado para formatear con Biome al guardar.
