# Use the official MySQL image from the Docker Hub
FROM mysql:8.0

# Set environment variables (same as in docker-compose.yml)
ENV MYSQL_DATABASE=linksdb
ENV MYSQL_USER=fazt
ENV MYSQL_PASSWORD=mypassword
ENV MYSQL_ROOT_PASSWORD=mypassword

# Add custom configuration for the MySQL server
CMD ["--default-authentication-plugin=mysql_native_password", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]

# Copy the SQL initialization script into the container
COPY ./database/db.sql /docker-entrypoint-initdb.d/db.sql

# Expose MySQL's default port
EXPOSE 3306
