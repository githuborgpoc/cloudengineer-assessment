# nginx/Dockerfile

# Use the latest Nginx image as the base
FROM nginx:latest

ENV HOSTNAME=nginx
# Copy custom Nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY webapp.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]