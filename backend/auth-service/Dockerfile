# Use Eclipse Temurin for a lightweight Java 17 runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the target directory
COPY target/*.jar app.jar

# Expose the port the service runs on
EXPOSE 8081

# Run the application with memory limits
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
