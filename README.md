# El Camino Secreto

Invitación inmersiva de boda de Gladiola y Jordi.

## Desarrollo local

```bash
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Validación

```bash
npm run lint
npm run test:unit
npm run build
```

## Despliegue en Hostinger

Cada cambio publicado en `main` ejecuta las comprobaciones y construye la
imagen `ghcr.io/belucci21/el-camino-secreto:latest`.

En hPanel, abre **Docker Manager → Compose → Compose desde URL** y utiliza:

```text
https://raw.githubusercontent.com/belucci21/el-camino-secreto/main/docker-compose.yml
```

Nombre del proyecto:

```text
el-camino-secreto
```

El Compose conecta la aplicación con la red externa `traefik-proxy` y publica:

- `https://gladiolajordivinculoeterno.com`
- `https://www.gladiolajordivinculoeterno.com` (redirige al dominio principal)

No se guardan contraseñas, claves del VPS ni secretos en el repositorio.

Los datos finales de la boda se centralizan en `src/config/wedding.ts`. La
palabra del umbral es narrativa; el código entregado al navegador es público.
