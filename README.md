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
| `AUTH_PASSWORD` | Contraseña de login.                     | `password123`          |
| `JWT_SECRET`    | Secreto HS256 compartido con go-api.     | `interseguro-dev-secret`|
| `JWT_ISSUER`    | Issuer del JWT.                          | `interseguro`          |
| `JWT_AUDIENCE`  | Audience del JWT.                        | `interseguro-api`      |
| `JWT_EXPIRES_IN`| Duración del token.                      | `2h`                   |
| `CORS_ORIGIN`   | Origen CORS permitido (`*` en la prueba).| `*`                    |

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
npm run typecheck  # tsc --noEmit
```
