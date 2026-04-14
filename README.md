[---
title: Campus Buddy
emoji: 🎓
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---](https://campus-buddy-mmk0plq7f-parth-batras-projects-4fa1e7d2.vercel.app/)

# 🎓 Campus Buddy — Next-Generation Campus Management Platform

Campus Buddy is a state-of-the-art, semi-autonomous campus orchestration platform. Built on a professional **Microservices Architecture**, it integrates AI-powered academic assistance, real-time attendance tracking with computer vision, and streamlined campus resource management.

---

## 🏛️ System Architecture

The platform follows a **Backend-for-Frontend (BFF)** pattern to aggregate data from multiple specialized microservices:

- **Auth Service (8081)**: JWT-based secure authentication and RBAC.
- **Academic Service (8082)**: Manages Attendance (MediaPipe Vision), Timetables, and Student records.
- **Notice Service (8083)**: Priority-tagged campus announcements and notifications.
- **Booking Service (8084)**: Conflict-aware room and facility reservation system.
- **BFF Gateway (8080)**: The central brain and API aggregator.
- **RAG Service (8000)**: Python-based Local AI engine for document retrieval and analysis.
- **Ollama (11434)**: Local LLM runner (Llama 3.2:3b) powering the Campus Copilot.

---

## ✨ Key Features

### 🤖 Campus Copilot (AI assistant)
- **Local RAG**: Queries university documents using a vector database (ChromaDB).
- **Vision Processing**: Submit whiteboard photos or notes for instant summarization and indexing.
- **Action Chips**: Ready-to-use intents for timetable summaries and attendance checks.

### 📸 Smart Attendance
- **Liveness Verification**: Uses MediaPipe for QR scan + Face liveness checks.
- **Faculty Polling**: Real-time session management for teachers.
- **Student Dashboard**: Visualized attendance percentages and history.

### 📅 Resource Management
- **Interactive Timetable**: Professional weekly grid with role-based editing.
- **Room Booking**: Real-time availability checks for labs and seminar halls.
- **Priority Notice Board**: Tagged announcements (Urgent, Academic, Social) with read tracking.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS (Premium Design System) |
| **Microservices** | Java 21, Spring Boot 3, Spring Security |
| **AI / ML** | Python 3.10, FastAPI, LangChain, Ollama (Llama 3.2), MediaPipe |
| **Databases** | PostgreSQL 16 (with pgvector), ChromaDB |
| **Infrastructure** | Docker, Nginx, Docker Compose |

---

## 🐳 Getting Started (Docker)

The entire ecosystem is containerized for consistent deployment.

### 1. Requirements
- Docker Desktop (Windows/Mac/Linux)
- 8GB+ RAM (Recommended for local LLM)

### 2. Launch
```bash
# Clone the repository
git clone https://github.com/parthbatra21/campus-buddy.git
cd campus-buddy

# Build and start all services
docker-compose up --build -d
```

### 3. Access
- **Frontend**: [http://localhost:8088](http://localhost:8088)
- **BFF API**: [http://localhost:8080](http://localhost:8080)
- **Ollama**: [http://localhost:11434](http://localhost:11434)

---

## 🛡️ Security
The platform uses **Stateless JWT Authentication**. The `bff-service` acts as a security gateway, validating tokens before routing requests to internal microservices over a private Docker network.

---

## 📄 License
Designed and maintained by Parth Batra.
