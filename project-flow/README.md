# project-flow

`project-flow` is a Docker-first setup that:

- Uses backend image directly: `abhinav775/postman-flow:backend`
- Uses frontend image directly: `abhinav775/postman-flow:frontend`
- Wraps the frontend image inside a Vite Module Federation remote (`frontend-bridge`)
- Loads that remote from a React 19 + Vite host app (`host`)

## Services

- `host` -> http://localhost:3300
- `frontend-bridge` (federated remote) -> http://localhost:4273
- `legacy-frontend` (your pushed frontend image) -> http://localhost:8181
- `backend` (your pushed backend image) -> http://localhost:5101
- `mongodb` -> localhost:27017

## Run

```bash
cd project-flow
docker compose up --build
```

## Local Dev (without Docker)

```bash
cd project-flow/frontend-bridge && npm install && npm run dev
cd project-flow/host && npm install && npm run dev
```

## Notes

- Host consumes `frontendBridge/LegacyFrontend` over Module Federation.
- `LegacyFrontend` renders your Docker Hub frontend image as an iframe.
- Backend is consumed directly via Docker image without rebuilding from source.
- For local `npm run dev`, `host` defaults to `http://localhost:3000` and loads the bridge from `http://localhost:4173`.
