# Use official Redis Stack image as the base
FROM redis/redis-stack:latest

# Expose Redis port
EXPOSE 6379

RUN echo "vm.overcommit_memory = 1" >> /etc/sysctl.conf

# Set the entrypoint to apply the sysctl configuration on container start
ENTRYPOINT ["sh", "-c", "sysctl -w vm.overcommit_memory=1 && exec redis-server /etc/redis-stack.conf"]
