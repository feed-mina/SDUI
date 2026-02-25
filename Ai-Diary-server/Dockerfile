# 1. 자바 17 버전의 실행 환경을 기본 베이스로 가져온다.
FROM openjdk:17-jdk-slim

# 2. 컨테이너 내부의 작업 디렉토리를 /app으로 설정한다.
WORKDIR /app

# 3. Maven 빌드 결과물인 jar 파일을 컨테이너 내부로 복사한다.
# 파일명은 네 pom.xml 설정에 따라 다를 수 있으니 나중에 확인 필요해.
COPY target/*.jar app.jar

# 4. 컨테이너가 시작될 때 자바 명령어로 jar 파일을 실행한다.
ENTRYPOINT ["java", "-jar", "app.jar"]