-- LOGIN_PAGE의 카카오 로그인 버튼 URL을 운영 환경 도메인으로 수정
UPDATE ui_metadata
SET action_url = 'https://kauth.kakao.com/oauth/authorize?client_id=2d22c7fa1d59eb77a5162a3948a0b6fe&redirect_uri=https://yerin.duckdns.org/api/kakao/callback&response_type=code'
WHERE screen_id = 'LOGIN_PAGE'
    AND component_id = 'kakao_login_btn';
