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
    login: (userData: any) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    // 로그인 성공 시 호출할 함수
    const login = (userData: any) => {
        setUser(userData);
        setIsLoggedIn(true);
    };
    const checkLoginStatus = async () => {
        try {
            // /api/auth/me를 호출하면 브라우저가 HttpOnly 쿠키를 자동으로 실어 보냄 
            const res = await api.get('/api/auth/me');
            setUser(res.data);
            setIsLoggedIn(res.data.isLoggedIn);
        } catch (err) {
            setUser(null);
            setIsLoggedIn(false);

        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkLoginStatus();
    }, []);

    return (

        <AuthContext.Provider value={{ user, isLoggedIn, isLoading, updateUser: setUser, login  }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth는 AuthProvider 안에서 사용.");
    return context;
};