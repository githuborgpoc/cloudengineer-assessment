# nginx/Dockerfile

# Use the latest Nginx image as the base
FROM nginx:latest

# Copy custom Nginx configuration files
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/webapp.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the web server
EXPOSE 80
