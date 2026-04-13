#!/bin/sh

# Ensure logs directory exists
mkdir -p /app/logs

echo "Starting Campus Buddy Unified Stack..."

# Set inter-service URLs to localhost
export SERVICES_AUTH_URL=http://localhost:8081
export SERVICES_ACADEMIC_URL=http://localhost:8082
export SERVICES_NOTICES_URL=http://localhost:8083
export SERVICES_BOOKINGS_URL=http://localhost:8084
export SERVICES_RAG_PYTHON_URL=http://localhost:8000
export GOOGLE_API_KEY=${GEMINI_API_KEY}

# Memory limits for Java services (total usage should stay under 16GB, but let's keep it healthy)
JAVA_OPTS="-Xmx256m -Xms64m"

# 1. Start Python RAG Service (Port 8000)
echo "Starting Python RAG Service..."
cd /app/rag-service && uvicorn rag_api:app --host 0.0.0.0 --port 8000 > /app/logs/rag.log 2>&1 &

# 2. Start Auth Service (Port 8081)
echo "Starting Auth Service..."
java $JAVA_OPTS -jar /app/auth-service.jar > /app/logs/auth.log 2>&1 &

# 3. Start Academic Service (Port 8082)
echo "Starting Academic Service..."
java $JAVA_OPTS -jar /app/academic-service.jar > /app/logs/academic.log 2>&1 &

# 4. Start Notice Service (Port 8083)
echo "Starting Notice Service..."
java $JAVA_OPTS -jar /app/notice-service.jar > /app/logs/notice.log 2>&1 &

# 5. Start Booking Service (Port 8084)
echo "Starting Booking Service..."
java $JAVA_OPTS -jar /app/booking-service.jar > /app/logs/booking.log 2>&1 &

# Wait for sidecars to start a bit
sleep 5

# 6. Start BFF Service (The main entry point, listens on $PORT)
echo "Starting BFF Service on port ${PORT:-7860}..."
export SERVER_PORT=${PORT:-7860}
# We run BFF in foreground to keep the container alive and stream logs
java -Xmx512m -Xms128m -jar /app/bff-service.jar
