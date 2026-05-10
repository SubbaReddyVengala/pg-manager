FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app

# Copy maven wrapper from root
COPY mvnw .
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copy common library
COPY backend/pg-manager-common backend/pg-manager-common
# Install common library to local repo
RUN cd backend/pg-manager-common && /app/mvnw clean install -DskipTests

# Copy API service
COPY backend/pg-manager-api backend/pg-manager-api
# Build API service
RUN cd backend/pg-manager-api && /app/mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/backend/pg-manager-api/target/pg-manager-api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 7860

ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-Dspring.profiles.active=prod", "-jar", "app.jar", "--server.port=7860"]
