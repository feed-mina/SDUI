import axios, { AxiosInstance } from 'axios';

// 서버 에러 응답 규격 정의
interface ErrorResponse {
    code: string;
    message: string;
    status: number;
}

//   Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
});
// 브라우저가 HttpOnly 쿠키를 알아서 보냄
api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);
// 3. 응답 인터셉터: 에러 핸들링 및 토큰 재발급 로직 통합
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const {response} = error;
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

        if (response?.status === 401 && !originalRequest._retry) {
            // [방어 로직] 이미 로그인 페이지라면 재발급 시도나 리다이렉트를 하지 않음
            if (currentPath === "/view/LOGIN_PAGE") {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // 토큰 재발급 시도
                await axios.post('http://localhost:8080/api/auth/refresh', {}, { withCredentials: true });
                return api(originalRequest); // 재발급 성공 시 원래 요청 재시도
            } catch (err) {
                // 재발급 실패 시 로그아웃 처리
                if (currentPath !== "/view/LOGIN_PAGE") {
                    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                    window.location.href = "/view/LOGIN_PAGE";
                }
            }
            return Promise.reject(error);
        }

        // 재발급 실패 후의 비즈니스 에러 처리
        if (response?.data) {
            const {code, message} = response.data;

            switch (code) {
                case 'AUTH_001': // 로그인 실패
                    alert(message || '아이디 또는 비밀번호를 확인해주세요.');
                    break;
                case 'AUTH_004': // 이메일 미인증
                    if (window.confirm(message || '이메일 인증이 필요합니다. 인증 페이지로 이동할까요?')) {
                        window.location.href = '/verify-email';
                    }
                    break;
                case 'AUTH_002': // 계정 비활성화
                case 'AUTH_003': // 탈퇴 계정
                    alert(message);
                    window.location.href = '/support';
                    break;
                case 'SYS_001':
                    alert('서버 오류가 발생했습니다.');
                    break;
                default:
                    // 명시되지 않은 에러는 서버 메시지 그대로 출력
                    if (message) alert(message);
            }
        }

        return Promise.reject(error);
    }
);

export default api;