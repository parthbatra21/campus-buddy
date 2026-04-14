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
cd /app/rag-service
if [ ! -d "db" ]; then
    echo "No RAG database found. Running initial ingestion..."
    python3 ingest.py
fi

# Disable Chroma telemetry to clean up logs
export ANONYMIZED_TELEMETRY=False
export CHROMA_TELEMETRY_DISABLED=1

# Start uvicorn with explicit 0.0.0.0
uvicorn rag_api:app --host 0.0.0.0 --port 8000 > /app/logs/rag.log 2>&1 &
cd /app

# Wait for RAG service to be healthy (up to 2 minutes)
echo "Waiting for RAG service to be ready on 127.0.0.1:8000..."
MAX_RETRIES=60
RETRY_COUNT=0
while ! curl -s http://127.0.0.1:8000/health > /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "Warning: RAG service timed out after 120s. Continuing..."
        break
    fi
    sleep 2
done

# Check if actually healthy for logging
if curl -s http://127.0.0.1:8000/health | grep -q "ready"; then
    echo "RAG service is READY! Starting Java business services..."
else
    echo "RAG service is starting in background. Starting Java business services..."
fi

# 2-5. Start Java Services
echo "Starting Business Microservices..."
java $JAVA_OPTS -jar /app/auth-service.jar > /app/logs/auth.log 2>&1 &
java $JAVA_OPTS -jar /app/academic-service.jar > /app/logs/academic.log 2>&1 &
java $JAVA_OPTS -jar /app/notice-service.jar > /app/logs/notice.log 2>&1 &
java $JAVA_OPTS -jar /app/booking-service.jar > /app/logs/booking.log 2>&1 &

# 6. Start BFF Service (The main entry point)
echo "Starting BFF Service on port ${PORT:-7860}..."
export SERVER_PORT=${PORT:-7860}
java -Xmx1024m -jar /app/bff-service.jar
