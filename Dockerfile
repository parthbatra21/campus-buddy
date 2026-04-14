# Build Stage for Java
FROM maven:3.9-eclipse-temurin-21 AS java-builder
WORKDIR /build

# Copy backend source code (only for services we have)
COPY backend/auth-service /build/auth-service
COPY backend/academic-service /build/academic-service
COPY backend/bff-service /build/bff-service
COPY backend/booking-service /build/booking-service
COPY backend/notice-service /build/notice-service

# Build all services with aggressive memory limits for the build itself
RUN cd auth-service && mvn clean package -DskipTests
RUN cd academic-service && mvn clean package -DskipTests
RUN cd bff-service && mvn clean package -DskipTests
RUN cd booking-service && mvn clean package -DskipTests
RUN cd notice-service && mvn clean package -DskipTests

# Build Stage for Python RAG
FROM python:3.12-slim-bookworm AS python-builder
WORKDIR /python-build
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libxml2-dev \
    libxslt-dev \
    swig \
    pkg-config \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*
COPY model/ieee_vam/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Runtime Stage
FROM eclipse-temurin:21
WORKDIR /app

# Install Python 3.12, runtime libs for RAG (poppler, tesseract, magic), and cleanup
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy Java JARs
COPY --from=java-builder /build/auth-service/target/*.jar auth-service.jar
COPY --from=java-builder /build/academic-service/target/*.jar academic-service.jar
COPY --from=java-builder /build/bff-service/target/*.jar bff-service.jar
COPY --from=java-builder /build/booking-service/target/*.jar booking-service.jar
COPY --from=java-builder /build/notice-service/target/*.jar notice-service.jar

# Copy Python RAG dependencies and source
COPY --from=python-builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/root/.local/lib/python3.12/site-packages
COPY model/ieee_vam /app/rag-service

# Copy entrypoint script
COPY start-all.sh /app/start-all.sh
RUN chmod +x /app/start-all.sh

# Environment variables for HF Spaces / Production
ENV PORT=7860
ENV SPRING_PROFILES_ACTIVE=prod
ENV PYTHONUNBUFFERED=1

EXPOSE 7860

CMD ["/app/start-all.sh"]
