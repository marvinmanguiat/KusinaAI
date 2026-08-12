FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

# Install Node.js 20 so the frontend build runs during Maven packaging.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN chmod +x mvnw && ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app

COPY --from=build /workspace/target/*.jar /app/app.jar

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
