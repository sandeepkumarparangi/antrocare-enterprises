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
./run-local.sh
```

`run-local.sh` loads private local settings from the git-ignored `.env.local` file before starting Spring Boot. Use `./mvnw spring-boot:run` when no local environment file is needed.

### VS Code local startup

OAuth is optional and disabled by default. A normal local backend must start without Google credentials:

```bash
./mvnw spring-boot:run
```

Do not add empty values for these properties to `application.properties` or the VS Code launch environment:

```text
spring.security.oauth2.client.registration.google.client-id
spring.security.oauth2.client.registration.google.client-secret
```

Spring Boot treats an empty client ID as an invalid OAuth registration and stops the application context. To enable Google login, define both non-empty environment variables and enable OAuth:

```bash
export ANTROCARE_OAUTH2_ENABLED=true
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your-client-id
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your-client-secret
./mvnw spring-boot:run
```

For Google OAuth2, register this exact local redirect URI in Google Cloud Console:

```text
http://localhost:8081/login/oauth2/code/google
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

Users can browse active products after signing up or logging in. Buying a product requires a user session. Admins can update product costs, stock, visibility, and review saved buy requests. Products start at `₹50` with stock tracking enabled.

Main admin controls approval. Product changes submitted by registered admins are saved as pending requests and do not update the live catalog until the main admin approves them. The main admin can approve or reject those requests from the admin dashboard. If an admin submits values that match the current product values, no approval request is created.

The main admin can sign in by leaving the admin email blank and entering the main passcode. Only the main admin can create more admins. New admins are created with name, email, phone number, and password, then they can sign in with their email and password.

## Local Email Alerts

Low-stock alerts are sent when a product has less than 5 units available. Approval notifications are also sent to the registered admin who requested the change when the main admin approves or rejects it. The main notification email defaults to:

```text
sandeepkumar.parangi@gmail.com
```

Email is disabled by default for local development. Enable either SMTP or AWS SES before testing real inbox delivery. For Gmail SMTP, use a Gmail App Password, not your normal Gmail password.

```bash
export ANTROCARE_MAIL_ALERTS_ENABLED=true
export ANTROCARE_ADMIN_EMAIL=sandeepkumar.parangi@gmail.com
export SMTP_USERNAME=your-gmail-address@gmail.com
export SMTP_PASSWORD=your-gmail-app-password
./mvnw spring-boot:run
```

After signing in as admin, use **Send test email** on the admin dashboard to send a test message to `sandeepkumar.parangi@gmail.com`.

Do not commit real SMTP passwords. Put private local values in `.env.local` or your terminal environment only.

## Mobile App

The frontend is configured as a Progressive Web App with:

- Mobile viewport metadata
- `manifest.webmanifest`
- Service worker caching
- Mobile bottom navigation
- Install prompt banner on supported browsers

## API

```text
GET /api/products
GET /api/products?includeHidden=true   requires X-Admin-Key
GET /api/categories
GET /api/summary
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/admin/login
POST /api/purchase-requests            requires X-Auth-Token
PATCH /api/products/{id}               requires admin X-Auth-Token or X-Admin-Key
```

## Deploy On Render

This repo includes a `Dockerfile` and `render.yaml` for a single public Render web service. The Docker build compiles the Vite frontend, copies it into Spring Boot static resources, builds the Java app, and serves the website plus API from one URL.

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository, or create a Web Service using Docker.
3. Use the root `Dockerfile`.
4. Render provides `PORT`; the app reads it automatically.
5. Set `ANTROCARE_ADMIN_KEY` in Render to choose the admin passcode for the deployed site.

<<<<<<< HEAD

## CI Pipeline Test

# _Last tested: 2026-06-23 20:06:03 UTC_

```bash
ANTROCARE_FRONTEND_URL=https://antrocare-enterprises.onrender.com
ANTROCARE_ALLOWED_ORIGINS=https://antrocare-enterprises.onrender.com
ANTROCARE_OAUTH2_ENABLED=true
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your-google-client-id
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your-google-client-secret
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_REDIRECT_URI={baseUrl}/login/oauth2/code/{registrationId}
```

`ANTROCARE_OAUTH2_ENABLED` can be omitted when both Google client variables are present; the app auto-enables Google login from those credentials. Set it to `false` only when you intentionally want to hide Google login.

In Google Cloud Console, add this exact Authorized redirect URI for the Render service:

```text
https://antrocare-enterprises.onrender.com/login/oauth2/code/google
```
