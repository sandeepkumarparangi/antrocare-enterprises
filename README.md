# Antrocare Enterprises

Full-stack product catalog for Antrocare Enterprises, built with:

- React + Vite frontend
- Tailwind CSS modern UI
- Spring Boot REST backend
- H2 in-memory database
- Product images and brochure pages extracted from the original brochure

## Project Structure

```text
Antrocare Enterprises/
  frontend/               React + Tailwind application
  src/main/java/          Spring Boot backend
  src/main/resources/     Backend config and static product assets
```

## Run Backend

```bash
./mvnw spring-boot:run
```

Backend runs at:

```text
http://localhost:8081
```

H2 console:

```text
http://localhost:8081/h2-console
```

JDBC URL:

```text
jdbc:h2:mem:antrocare
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://127.0.0.1:5175
```

## Admin

Admin passcode:

```text
admin123
```

Users can browse active products. Admins can update product costs and hide or show products. The brochure did not contain numeric prices, so all products start with `Price on request`.

## API

```text
GET /api/products
GET /api/products?includeHidden=true   requires X-Admin-Key
GET /api/categories
GET /api/summary
PATCH /api/products/{id}               requires X-Admin-Key
```

## Deploy On Render

This repo includes a `Dockerfile` and `render.yaml` for a single public Render web service. The Docker build compiles the Vite frontend, copies it into Spring Boot static resources, builds the Java app, and serves the website plus API from one URL.

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository, or create a Web Service using Docker.
3. Use the root `Dockerfile`.
4. Render provides `PORT`; the app reads it automatically.
5. Set `ANTROCARE_ADMIN_KEY` in Render to choose the admin passcode for the deployed site.
