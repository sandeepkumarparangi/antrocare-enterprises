# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:17-jdk-alpine AS backend-build
WORKDIR /workspace
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline
COPY src ./src
RUN echo "===== AntrocareException.java =====" && \
    cat src/main/java/com/antrocare/catalog/exception/AntrocareException.java
COPY --from=frontend-build /workspace/frontend/dist/ ./src/main/resources/static/
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /workspace/target/antrocare-enterprises-0.0.1-SNAPSHOT.jar app.jar
ENV JAVA_OPTS=""
EXPOSE 8081
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8081} -jar /app/app.jar"]
