# 1단계: 빌드 스테이지 (도커 안에서 자바 빌드)
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Gradle 래퍼와 설정 파일들을 먼저 복사 (캐싱 활용)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
# 종속성 먼저 다운로드
RUN ./gradlew build -x test --stacktrace || return 0
# 소스 코드 복사 및 실제 빌드
COPY src ./src
RUN ./gradlew clean bootJar -x test
# 2단계: 실행 스테이지 (안정적인 Temurin 이미지 사용)
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
# 그레들은 빌드 결과물이 build/libs 폴더에 생성됨
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]