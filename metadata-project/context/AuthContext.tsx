// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/services/axios';

interface User {
    userId?: string;
    userSqno?: number;
    email?: string;
    socialType?: string;
    isLoggedIn: boolean;
    role?: string;
}
interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    updateUser: (userData: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);


    const [isLoading, setIsLoading] = useState(true);

    const checkLoginStatus = async () => {
        try {
            // /api/auth/me를 호출하면 브라우저가 HttpOnly 쿠키를 자동으로 실어 보냄 
            const res = await api.get('/api/auth/me');
            setUser(res.data);
            setIsLoggedIn(res.data.isLoggedIn);// 서버가 로그인이 아니라고 하면 로컬 스토리지도 청소한다
            if (!res.data.isLoggedIn) {
                localStorage.removeItem('isLoggedIn');
            }
        } catch (err) {
            setUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('isLoggedIn');

        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkLoginStatus();
    }, []);

    return (

        <AuthContext.Provider value={{ user, isLoggedIn, isLoading, updateUser: setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth는 AuthProvider 안에서 사용.");
    return context;
};