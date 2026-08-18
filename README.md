# interseguro-node-api

API en Node.js/TypeScript (Express) del Reto Interseguro. Autentica usuarios,
emite JWT y calcula estadísticas de las matrices generadas por
`interseguro-go-api`.

## Endpoints

| Método | Ruta             | Descripción                                      | Auth |
|--------|------------------|--------------------------------------------------|------|
| GET    | `/health`        | Health check para Cloud Run.                     | No   |
| POST   | `/auth/login`    | `{ username, password }` → `{ token, expiresIn }`| No   |
| POST   | `/statistics`    | `{ Q, R, rotated, original }` → estadísticas.    | JWT  |

## Variables de entorno

| Variable        | Descripción                              | Default                |
|-----------------|------------------------------------------|------------------------|
| `PORT`          | Puerto HTTP (Cloud Run lo inyecta).      | `3000`                 |
| `AUTH_USER`     | Usuario de login.                        | `admin`                |
| `AUTH_PASSWORD` | Hash bcrypt de la contraseña (no claro). | hash de `password123`  |
| `JWT_SECRET`    | Secreto HS256 compartido con go-api.     | `interseguro-dev-secret`|
| `JWT_ISSUER`    | Issuer del JWT.                          | `interseguro`          |
| `JWT_AUDIENCE`  | Audience del JWT.                        | `interseguro-api`      |
| `JWT_EXPIRES_IN`| Duración del token.                      | `2h`                   |
| `CORS_ORIGIN`   | Origen CORS permitido.                   | `*`                    |

Seguridad: contraseña comparada con **bcrypt**, **rate limit** en login
(10/15 min/IP), matrices máx. 100×100, body limit 1mb y cabeceras **helmet**.

## Despliegue

```bash
./deploy.sh                 # usa el proyecto de gcloud activo y us-central1
./deploy.sh MI-PROYECTO     # proyecto explícito
```

## Desarrollo local

```bash
npm install
npm run dev        # tsx watch
npm test           # vitest
npm run test:coverage  # vitest con reporte de cobertura (umbral 85%)
npm run typecheck  # tsc --noEmit
```

### Tests y cobertura

Organización por capa (arquitectura hexagonal):

| Capa                                  | Archivos de test                                              |
|---------------------------------------|---------------------------------------------------------------|
| Dominio                               | `src/domain/statistics.test.ts`                               |
| Aplicación (casos de uso)             | `src/application/auth.service.test.ts`, `statistics.service.test.ts` (con mocks) |
| Infraestructura (adaptadores)         | `env-user-repository.test.ts`, `jwt-middleware.test.ts`, `in-memory-repository.test.ts` |
| HTTP (controllers + DTOs + errores)   | `controllers.test.ts`, `dto.test.ts`, `error-handler.test.ts` |
| Integración/E2E (datos mockeados)     | `api.integration.test.ts`, `api.e2e.test.ts` (servidor real + fetch), `server.test.ts` |

Cobertura objetivo: >85% (statements, branches, functions, lines). El reporte
se genera en `coverage/` y el umbral se valida en `vitest.config.mts`.
