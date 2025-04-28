# Use the official MySQL image from the Docker Hub
FROM mysql:8.0

# Set environment variables
ENV MYSQL_DATABASE=node_app
ENV MYSQL_USER=fazt
ENV MYSQL_PASSWORD=mypassword
ENV MYSQL_ROOT_PASSWORD=mypassword
ENV HOSTNAME=db
ENV TZ=America/New_York
# Add custom configuration for the MySQL server
CMD ["mysqld", "--default-authentication-plugin=mysql_native_password", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]

# Copy the SQL initialization script into the container
COPY db.sql /docker-entrypoint-initdb.d/db.sql

# Expose MySQL's default port
EXPOSE 3306
