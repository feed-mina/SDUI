# 1단계: 빌드 스테이지 (도커 안에서 자바 빌드)
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# 설정 파일과 소스 코드를 도커 내부로 복사
COPY pom.xml .
COPY src ./src
# 직접 빌드해서 JAR 파일 생성 (테스트는 스킵)
RUN mvn clean package -DskipTests

# 2단계: 실행 스테이지 (안정적인 Temurin 이미지 사용)
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
# 1단계에서 만든 결과물만 쏙 가져오기
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]