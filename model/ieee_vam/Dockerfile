FROM python:3.10-slim

WORKDIR /app

# Install absolute minimum system dependencies + compiler for ChromaDB
RUN apt-get update && apt-get install -y \
    curl \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# Copy the rest of the app
COPY . .

# Set environment variables
ENV MODEL=llama3.2:3b
ENV EMBED_MODEL=nomic-embed-text
ENV PERSIST_DIRECTORY=db
ENV SOURCE_DIRECTORY=source_documents
ENV OLLAMA_BASE_URL=http://ollama:11434

# Create volume for persistent storage
VOLUME ["/app/db"]

# Healthcheck to ensure Python API is up
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start sequence: Ingest (pulls model) then Start API
CMD python ingest.py && uvicorn rag_api:app --host 0.0.0.0 --port 8000
