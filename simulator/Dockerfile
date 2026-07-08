# Skid simulator — pure-stdlib Python, no dependencies to install.
FROM python:3.12-alpine

WORKDIR /app
COPY sim.py tags.json ./

# Run as a non-root user, matching the backend image's convention.
RUN adduser -S -G nogroup sim
USER sim

CMD ["python", "sim.py"]
