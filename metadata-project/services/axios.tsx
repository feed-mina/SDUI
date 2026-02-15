import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from 'axios';

// 서버 에러 응답 규격 정의
interface ErrorResponse {
    code: string;
    message: string;
    status: number;
}

// 1. Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
});

// 쿠키에서 특정 키의 값을 가져오는 유틸 함수
const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

// 2. 요청 인터셉터: 모든 요청 헤더에 Access Token 주입
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getCookie('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. 응답 인터셉터: 에러 핸들링 및 토큰 재발급 로직 통합
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ErrorResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const { response } = error;

        // CASE 1: 토큰 만료 (401) 시 재발급 시도
        if (response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // 주의: 인스턴스(api)가 아닌 생 axios를 써야 무한 루프를 방지함
                await axios.post('http://localhost:8080/api/auth/refresh', {}, { withCredentials: true });

                // 재발급 성공 시 기존 요청 다시 보냄
                return api(originalRequest);
            } catch (refreshError) {
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                window.location.href = "/view/LOGIN_PAGE";
                return Promise.reject(refreshError);
            }
        }

        // CASE 2: 401이 아니거나 재발급 실패 후의 비즈니스 에러 처리
        if (response?.data) {
            const { code, message } = response.data;

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