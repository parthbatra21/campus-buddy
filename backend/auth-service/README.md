# Auth Service - Campus Buddy Platform

Production-grade authentication microservice with JWT-based authentication and role-based access control.

## 🚀 Quick Start

### Prerequisites
- Java 21
- PostgreSQL 14+
- Maven 3.8+

### Setup

1. **Create Database:**
   ```bash
   createdb campus_buddy_auth
   ```

2. **Configure Environment (Optional):**
   ```bash
   export DB_USERNAME=postgres
   export DB_PASSWORD=postgres
   export JWT_SECRET=your-super-secret-key
   ```

3. **Run Application:**
   ```bash
   ./mvnw spring-boot:run
   ```

Server starts on **http://localhost:8081**

---

## 📋 API Endpoints

### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "studentId": "MUJ1234",
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

### Get Current User (Protected)
```bash
GET /auth/me
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔑 Roles

- **STUDENT** - Regular student users
- **FACULTY** - Faculty members
- **ADMIN** - System administrators

---

## 🛠️ Technology Stack

- **Spring Boot 4.0.2** - Framework
- **Spring Security** - Authentication & Authorization
- **JWT (jjwt 0.12.3)** - Token-based authentication
- **PostgreSQL** - Database
- **BCrypt** - Password hashing
- **Hibernate** - ORM
- **Lombok** - Boilerplate reduction

---

## 📁 Project Structure

```
auth-service/
├── controller/     - REST API endpoints
├── service/        - Business logic
├── repository/     - Database access
├── model/          - Entities (User, Role)
├── dto/            - Data Transfer Objects
├── security/       - JWT & Spring Security config
└── exception/      - Error handling
```

---

## 🔐 Security Features

✅ BCrypt password hashing (strength 12)  
✅ JWT token-based authentication  
✅ 24-hour token expiration  
✅ Stateless session management  
✅ Role-based access control  
✅ Input validation  
✅ Centralized exception handling

---

## 🧪 Testing

Use curl or Postman with the examples above.

**Example:**
```bash
# Register
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{"studentId":"MUJ1234","email":"test@example.com","password":"test123","role":"STUDENT"}'

# Login
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get User (replace <TOKEN>)
curl -X GET http://localhost:8081/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ⚙️ Configuration

See `src/main/resources/application.yaml`:

- **Database**: PostgreSQL connection settings
- **JWT**: Secret and expiration time
- **Server**: Port 8081

---

## 📝 Notes

- Passwords are never stored in plaintext (BCrypt hashed)
- JWT tokens contain user email, role, and ID
- Other microservices can validate tokens using the same JWT secret
- Designed to be the central authentication authority for the platform

---

## 🔗 Integration

Other microservices should:
1. Accept JWT tokens in `Authorization` header
2. Use same JWT secret for validation
3. Extract user info (email, role) from token claims
4. Apply role-based authorization

---

Built with ❤️ for Campus Buddy Platform
