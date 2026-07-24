# Progress — admin-ent

## Pendientes / roadmap

- [ ] Cloudflare delante del servidor (DNS proxied, Origin Cert, cerrar Security Group a IPs de Cloudflare, Cloudflare Access) — a cargo de Alex (infra)
- [ ] Backups de BD prod → S3 `/backups` + watchdog de Apache/MySQL — a cargo de Alex (infra)
- [ ] Verificación final y hardening (quitar acceso SSH temporal, revisar `php.ini`) — a cargo de Alex (infra)
- [ ] Credenciales de producción reales para `EXTERNAL_BILLING_*` (actualmente apunta a `dev-api.easynexttime.cl`)
- [ ] `MAIL_MAILER` real en prod (actualmente `log`, no manda emails de facturas)

## Bitácora de despliegues

| Fecha | Ambiente | Cambio | Resultado |
|---|---|---|---|
| 2026-07-15 | test + prod | Deploy inicial end-to-end (Laravel en raíz, datos reales importados, Node 22, build frontend) | OK |
| 2026-07-22 | test + prod | Fix bug HASH_VERIFY / bcrypt `$2a$` (500 en login) | OK |
| 2026-07-24 | test + prod | Rediseño de login (layout split-screen, panel de marca + formulario) — deploy solo-frontend | OK |

Para el procedimiento exacto de un deploy solo-frontend (sin migraciones ni cambios de composer), ver la memoria del proyecto o replicar: `git pull` → `npm install` (si cambió `package.json`) → `npm run build` → `cp -r dist/* ../public/` → verificar hash en `public/index.html`.
