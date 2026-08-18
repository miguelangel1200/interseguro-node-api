# interseguro-node-api

API HTTP escrita en **Node.js/TypeScript** con **Express**.

Autentica usuarios mediante **JWT** (HS256) y calcula estadísticas sobre
matrices. Es el servicio al que `interseguro-go-api` delega el cómputo de
estadísticas tras la factorización QR.

Sigue arquitectura hexagonal (dominio → aplicación → infraestructura).

## Endpoints

| Método | Ruta          | Descripción                                               | Auth |
|--------|---------------|-----------------------------------------------------------|------|
| GET    | `/health`     | Health check (usado por Cloud Run).                       | No   |
| POST   | `/auth/login` | `{ username, password }` → `{ token, expiresIn }`.        | No   |
| POST   | `/statistics` | `{ Q, R, rotated?, original? }` → estadísticas.           | JWT  |

### POST /statistics

Calcula, para cada matriz, sumas, medias, máximos/mínimos, diagonalidad y
norma de Frobenius; para la factorización QR incluye determinante de R,
ortogonalidad de Q y estadísticas globales.

## Variables de entorno

| Variable        | Descripción                                 | Default                |
|-----------------|---------------------------------------------|------------------------|
| `PORT`          | Puerto HTTP (Cloud Run lo inyecta).         | `3000`                 |
| `AUTH_USER`     | Usuario de login.                           | `admin`                |
| `AUTH_PASSWORD` | Hash bcrypt de la contraseña (no claro).    | hash de `password123`  |
| `JWT_SECRET`    | Secreto HS256 compartido con go-api.        | `interseguro-dev-secret`|
| `JWT_ISSUER`    | Issuer del JWT.                             | `interseguro`          |
| `JWT_AUDIENCE`  | Audience del JWT.                           | `interseguro-api`      |
| `JWT_EXPIRES_IN`| Duración del token.                         | `2h`                   |
| `CORS_ORIGIN`   | Origen CORS permitido.                      | `*`                    |

## Ejecución local

```bash
npm install
npm run dev        # servidor de desarrollo (tsx watch)
npm test           # tests
npm run test:coverage  # tests con reporte de cobertura
npm run typecheck  # tsc --noEmit
```

## Despliegue

- **CI (GitHub Actions):** en cada push a `main` se ejecutan los tests y se
  construye/publica la imagen en Artifact Registry (`.github/workflows/build.yml`).
- **Manual:** `./deploy.sh [PROJECT_ID] [REGION]` construye y sube la imagen
  con Cloud Build.

## Tests y cobertura

Organización por capa:

| Capa                              | Archivos de test                                              |
|-----------------------------------|---------------------------------------------------------------|
| Dominio                           | `src/domain/statistics.test.ts`                               |
| Aplicación (casos de uso)         | `src/application/auth.service.test.ts`, `statistics.service.test.ts` (con mocks) |
| Infraestructura (adaptadores)     | `env-user-repository.test.ts`, `jwt-middleware.test.ts`, `in-memory-repository.test.ts` |
| HTTP (controllers + DTOs + errores)| `controllers.test.ts`, `dto.test.ts`, `error-handler.test.ts` |
| Integración/E2E                   | `api.integration.test.ts`, `api.e2e.test.ts` (servidor real + fetch), `server.test.ts` |

El umbral de cobertura (85%) se valida en `vitest.config.mts` y el reporte se
genera en `coverage/`.
