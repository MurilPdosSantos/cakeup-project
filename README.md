# CakeUp

Base do projeto com arquitetura conforme `TODO.md`.

## Estrutura

- `backend/` NestJS (JWT + Redis + Postgres)
- `frontend/` Vite + Tailwind + Framer Motion
- `nginx/` Reverse proxy
- `docker-compose.yml` Infra local

## Como subir (desenvolvimento)

1. `docker compose up --build`
2. Frontend: `http://localhost`
3. API: `http://localhost/api`

## Fluxo de autenticacao (exemplo)

- Login: `POST /api/auth/login`
- Cookie HttpOnly: `access_token`
- Rota protegida: `GET /api/protected`

## Credenciais de exemplo

- Email: `admin@cakeup.com`
- Senha: `admin123`

## Seguranca e performance (recomendado)

- JWT curto + refresh token
- Cookies HttpOnly + SameSite + Secure em producao
- Rate limit (Nginx + Redis)
- Cache com Redis para leituras frequentes
- Indices no Postgres para campos de busca
- TLS obrigatorio no Nginx em producao
