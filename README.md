# Campus Buddy

Campus Buddy is a comprehensive campus management application designed to streamline interactions between students, faculty, and administration. It features a microservices architecture for the backend and a modern React-based frontend.

## 🚀 Key Features

*   **Authentication & User Management**: Secure login for Students, Faculty, and Admins.
*   **Academic Management**: Attendance tracking, timetable management, and academic records.
*   **Campus Services**: Notices, events, and other campus-related updates.
*   **Modern UI**: A responsive and aesthetic user interface built with React and TailwindCSS.

## 🛠️ Technology Stack

*   **Backend**: Java 21, Spring Boot (Microservices)
*   **Frontend**: React (Vite), JavaScript
*   **Database**: PostgreSQL (Auth, Academic), H2 (Campus)
*   **Build Tools**: Maven (Backend), npm/Vite (Frontend)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   **Java 21 JDK**: [Download](https://www.oracle.com/java/technologies/downloads/#java21)
*   **Maven**: [Download](https://maven.apache.org/download.cgi)
*   **Node.js (v18+)**: [Download](https://nodejs.org/)
*   **PostgreSQL**: [Download](https://www.postgresql.org/download/)

## ⚙️ Database Setup

You need to create two PostgreSQL databases before running the backend. The `campus-service` uses an in-memory H2 database, so no setup is required for it.

1.  Open your terminal or a database tool (like pgAdmin or DBeaver).
2.  Run the following SQL commands:

```sql
CREATE DATABASE campus_buddy_auth;
CREATE DATABASE campus_buddy_academic;
```

> **Note**: The application assumes the default PostgreSQL user is `postgres` with no password or `parth` with no password based on configuration.
> Check `backend/*/src/main/resources/application.yaml` if you need to update `spring.datasource.username` and `spring.datasource.password` to match your local setup.

## 🐳 Running with Docker (Recommended)

The easiest way to run Campus Buddy is using Docker. This will set up all services and databases automatically.

### Prerequisites
*   **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/)

### Quick Start
1.  Open your terminal in the root directory.
2.  Run the following command:
    ```bash
    docker-compose up --build -d
    ```
3.  Access the application:
    *   **Frontend**: [http://localhost](http://localhost)
    *   **BFF Service API**: [http://localhost:8080](http://localhost:8080)

4.  To stop the application:
    ```bash
    docker-compose down
    ```

## 🏃‍♂️ How to Run (Manual Setup)

### 1. Backend (Microservices)

We have provided a convenient script to start all backend services at once.

1.  Open a terminal in the root directory (`campus-buddy`).
2.  Run the startup script:

    ```bash
    ./start_backend.sh
    ```

    This will start:
    *   **Auth Service** (Port 8081)
    *   **Academic Service** (Port 8082)
    *   **Campus Service** (Port 8083)
    *   **BFF Service** (Port 8080) - *The frontend communicates with this.*

    > **Tip**: Logs for each service are written to `startup.log` in their respective directories (e.g., `backend/auth-service/startup.log`).

### 2. Frontend

1.  Open a new terminal window.
2.  Navigate to the frontend directory:

    ```bash
    cd frontend/campus-buddy-ui
    ```

3.  Install dependencies (first time only):

    ```bash
    npm install
    ```

4.  Start the development server:

    ```bash
    npm run dev
    ```

5.  Open your browser and visit: `http://localhost:5173`

## 🧪 Testing Credentials

*   **Student**: `student@example.com` / `password` (if seeded)
*   **Faculty**: `faculty@example.com` / `password` (if seeded)

## 📁 Project Structure

```
campus-buddy/
├── backend/
│   ├── auth-service/       # Authentication & User Service
│   ├── academic-service/   # Academics, Attendance, Timetable
│   ├── campus-service/     # Notices, Events (H2 DB)
│   └── bff-service/        # Backend for Frontend (API Gateway logic)
├── frontend/
│   └── campus-buddy-ui/    # React Application
└── start_backend.sh        # unified startup script
```
