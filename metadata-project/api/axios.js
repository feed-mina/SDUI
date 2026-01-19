import axios from 'axios'

// 1. Axios 인스턴스 생성
const instance = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true // 쿠키를 주고받기 위해 필수 설정
})

// 2. 요청 인터셉터(모든 요청 직전에 실행
instance.interceptors.request.use(
    (config) => {
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('accessToken='))?.split('=')[1];

        if (token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// 3. 응답 인터셉터(모든 응답 직후에 실행)
instance.interceptors.response.use(
(response) => response, // 성공 시 그대로 반환
async (eeror) => {
    const originalRequest = eeror.config;

    // 401에러 (만료)가 발생했고 재시도 한 적이 없다면
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
            // 백앤드의 리프레시 API 호출 (쿠키의 refreshToken이 자동 전송됨)
            const res = await axios.post('/api/auth/refresh', {}, {withCredentials: true});

            if (res.status === 200) {
                // 새 토큰으로 기존 요청 재실행
                return instance(originalRequest);
            }
        } catch (refreshError) {
            // 리프레시 토큰도 만료되었다면 로그인 페이지로 이동,
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            window.location.href = "/view/LOGIN_PAGE";
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error);
    }
);

export default instance;