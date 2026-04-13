-- campus_buddy_auth is already created by POSTGRES_DB env var
-- Create additional databases for other services

CREATE DATABASE campus_buddy_academic;
CREATE DATABASE campus_buddy_vectors;
CREATE DATABASE campus_buddy_notices;
CREATE DATABASE campus_buddy_bookings;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_auth TO parth;
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_academic TO parth;
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_vectors TO parth;
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_notices TO parth;
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_bookings TO parth;

-- Enable pgvector extension in the vectors database
\c campus_buddy_vectors;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the documents table for RAG
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING hnsw (embedding vector_cosine_ops);

-- Seed Auth Users
\c campus_buddy_auth;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Default student: student@campus.com / password
INSERT INTO users (student_id, email, password_hash, role) 
VALUES ('S12345', 'student@campus.com', '$2a$12$8.Un7zLUg96T.K6n9wGnOOE4w7.8Zp.Fm3l5mX2g9u6o0vY0m7aB6', 'STUDENT') 
ON CONFLICT (email) DO NOTHING;

-- Default faculty: faculty@campus.com / password
INSERT INTO users (student_id, email, password_hash, role) 
VALUES ('F98765', 'faculty@campus.com', '$2a$12$8.Un7zLUg96T.K6n9wGnOOE4w7.8Zp.Fm3l5mX2g9u6o0vY0m7aB6', 'FACULTY') 
ON CONFLICT (email) DO NOTHING;
