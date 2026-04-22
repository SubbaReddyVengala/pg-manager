# PG Manager - AI Documentation (GEMINI.md)

This document serves as the foundational mandate for all AI interactions within the `pg-manager` project. It defines the architecture, technical standards, and conventions to ensure consistency across the microservices and frontend.

## 1. Project Overview
A multi-tenant PG (Paying Guest) Management System built with a Spring Boot microservices backend and an Angular standalone frontend.

## 2. Infrastructure & Microservices
All services communicate via the **API Gateway** on port `8080`.

| Service | Port | Database Schema | Description |
| :--- | :--- | :--- | :--- |
| **api-gateway** | `8080` | N/A | Entry point, Routing, JWT Validation |
| **auth-service** | `8081` | `auth_schema` | Authentication, JWT Issuance, Registration |
| **room-service** | `8082` | `room_schema` | Room management and availability |
| **tenant-service** | `8083` | `tenant_schema` | Tenant profiles and lifecycle |
| **payment-service** | `8084` | `payment_schema` | Rent collection and receipt generation |
| **complaint-service**| `8085` | `complaint_schema` | (Legacy) Moved to Maintenance |
| **expense-service** | `8086` | `expense_schema` | (Legacy) Moved to Maintenance |
| **notification-service**| `8087` | `notification_schema` | Alerts and communications |
| **report-service**  | `8088` | `report_schema` | Aggregated Analytics & Dashboard trends |
| **maintenance-service**| `8089` | `maintenance_schema` | Tickets, Expenses, & Profit Tracking |
| **notification-service**| `8087` | `notification_schema` | Email (Brevo) & WhatsApp (Twilio) alerts |
| **PostgreSQL** | `5432` | Multiple | Shared instance with schema isolation |
| **Angular App** | `4200` | N/A | Standalone Component Architecture |

## 3. Technology Stack
- **Backend:** Java 17, Spring Boot 3.5+, Spring Security, Spring Data JPA.
- **Database:** PostgreSQL with **Flyway** for migrations.
- **Inter-service:** `RestTemplate` with internal client wrappers.
- **Mapping:** MapStruct for Entity <-> DTO mapping.
- **Frontend:** Angular 17+, Standalone Components, Vanilla CSS/SCSS (No Tailwind), Reactive Forms.
- **Auth:** Stateless JWT. Gateway validates tokens; services trust gateway headers.

## 4. Current Status (April 2026)
- [x] Phase 1: Auth Service + API Gateway
- [x] Phase 2: Room Service
- [x] Phase 3: Tenant Service
- [x] Phase 4: Payment Service
- [x] Phase 5: Maintenance Service (Unified)
- [x] Phase 6: Report Service (Orchestrated Stats)
- [x] Phase 7: Notification Service (Email/WhatsApp)
- [ ] Phase 8: Production Deployment

## 5. Coding Conventions

### Backend (Spring Boot)
- **Layered Architecture:** `Controller` -> `Service (Interface)` -> `ServiceImpl` -> `Repository`.
- **Naming:** CamelCase for classes/methods. snake_case for database columns.
- **DTOs:** Use `Request` and `Response` suffixes (e.g., `PaymentRequest`, `PaymentResponse`).
- **Error Handling:** Centralized `@RestControllerAdvice` returning a consistent `ErrorResponse` object.
- **Database:** Every service MUST have its own schema defined in `application.yaml` and `init-schemas.sql`.

### Frontend (Angular)
- **Architecture:** `core/` (services/guards), `shared/` (models/components), `features/` (domain-specific pages).
- **Standalone:** All new components must be `standalone: true`.
- **Modals:** Use the `modal-overlay` pattern with template-based visibility (`*ngIf`) instead of complex dialog frameworks unless required.
- **Styling:** Prefer Vanilla SCSS. Maintain the "Clean/Modern" aesthetic:
  - Background: `#f8fafc` (Slate 50)
  - Primary Action: `#1e293b` (Slate 800)
  - Success: `#22c55e` | Danger: `#ef4444` | Info: `#3b82f6`

## 5. Maintenance & Profit Logic
- **Maintenance Service** is the source of truth for "Net Profit".
- **Formula:** `Profit = (Revenue from Payment Service) - (Ticket Costs + General Expenses)`.
- Inter-service calls must be wrapped in `Client` classes (e.g., `PaymentServiceClient`).

## 6. Development Workflow (RAM Optimized)
If your system hangs when running all services, use the following workflow:
1. **Initial Build:** Run `./build-all.ps1` once. This builds JAR files for all microservices.
2. **Selective Startup:** Run `./start-dev.ps1` and choose **Mode [1] Core Only** or **Mode [2] Selective**.
   - Running JARs directly (`java -jar`) saves ~200MB RAM per service compared to Maven.
   - Core Only starts only the Gateway, Auth, and Frontend.
3. **Database Limits:** `docker-compose.yml` is now configured with a 512MB RAM limit for Postgres.

---
*Note: This file takes precedence over general defaults. Always verify against this schema before creating new modules.*
