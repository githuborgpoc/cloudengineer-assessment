FROM nginx:latest

ENV HOSTNAME=nginx

COPY webapp.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]