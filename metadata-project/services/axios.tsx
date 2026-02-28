import axios, { AxiosInstance } from 'axios';

// 서버 에러 응답 규격 정의
interface ErrorResponse {
    code: string;
    message: string;
    status: number;
}

//   Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
    baseURL: '/',
    withCredentials: true,
});

// 1. 요청 인터셉터: 웹이라면 localStorage, 앱이라면 각 플랫폼의 저장소에서 토큰을 가져옴
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem('accessToken') : null;

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
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
            originalRequest._retry = true;

            try {
                // 토큰 재발급 시도
                const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });

                const newAccessToken = res.data.accessToken;

                if (newAccessToken) {
                    // 새 토큰 저장 (웹 기준)
                    localStorage.setItem('accessToken', newAccessToken);

                    // 원래 실패했던 요청의 헤더를 새 토큰으로 교체 후 재시도
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (err) {
                // 재발급 실패 시 저장된 토큰 삭제 및 리다이렉트
                localStorage.removeItem('accessToken');
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