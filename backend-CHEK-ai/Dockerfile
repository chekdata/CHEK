FROM chek-images-cn-beijing.cr.volces.com/devops/eclipse-temurin:17-jre AS runtime
WORKDIR /app
COPY target/app.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

