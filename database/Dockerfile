FROM mysql:8.0

ENV MYSQL_DATABASE=node_app
ENV MYSQL_USER=fazt
ENV MYSQL_PASSWORD=mypassword
ENV MYSQL_ROOT_PASSWORD=mypassword
ENV HOSTNAME=db
ENV TZ=America/New_York

VOLUME [ "/data" ]

CMD ["mysqld", "--default-authentication-plugin=mysql_native_password", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]

COPY db.sql /docker-entrypoint-initdb.d/db.sql

EXPOSE 3306
