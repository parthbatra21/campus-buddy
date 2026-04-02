-- Create multiple databases for Campus Buddy services
CREATE DATABASE campus_buddy_auth;
CREATE DATABASE campus_buddy_academic;
CREATE DATABASE campus_buddy_campus;

-- Standard user setup (matching current docker-compose config)
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_auth TO parth;
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_academic TO parth;
GRANT ALL PRIVILEGES ON DATABASE campus_buddy_campus TO parth;
