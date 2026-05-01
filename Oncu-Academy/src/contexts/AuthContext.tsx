import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '@/types';
import { API_BASE_URL } from '@/services/publicApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: 'student' | 'teacher') => Promise<boolean>;
  loginWithGoogle: (credential: string, role: 'student' | 'teacher') => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  password: string;
  role: 'student' | 'teacher';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProfilePayload = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
};

const mapStudentUser = (student: AuthProfilePayload): User => ({
  id: student.id,
  name: student.name,
  surname: student.surname,
  email: student.email,
  phone: student.phoneNumber,
  avatar: student.avatar,
  role: 'student',
  createdAt: new Date(),
});

const mapTeacherUser = (teacher: AuthProfilePayload): User => ({
  id: teacher.id,
  name: teacher.name,
  surname: teacher.surname,
  email: teacher.email,
  phone: teacher.phoneNumber || '',
  avatar: teacher.avatar,
  role: 'teacher',
  createdAt: new Date(),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('rim_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Kayıtlı kullanıcı verisi okunamadı', e);
        return null;
      }
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const persistSession = useCallback((mappedUser: User, token: string) => {
    setUser(mappedUser);
    localStorage.setItem('rim_auth_token', token);
    localStorage.setItem('rim_user', JSON.stringify(mappedUser));
  }, []);

  const login = useCallback(async (email: string, password: string, role: 'student' | 'teacher'): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      if (role === 'student') {
        const response = await fetch(`${API_BASE_URL}/student/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
          persistSession(mapStudentUser(data.student), data.token);
          return true;
        } else {
          console.error(data.message);
          return false;
        }
      } else if (role === 'teacher') {
        const response = await fetch(`${API_BASE_URL}/teacher/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
          persistSession(mapTeacherUser(data.teacher), data.token);
          return true;
        } else {
          console.error(data.message);
          return false;
        }
      }
    } catch (err) {
      console.error('Giriş hatası:', err);
      return false;
    } finally {
      setIsLoading(false);
    }

    return false;
  }, [persistSession]);

  const loginWithGoogle = useCallback(async (credential: string, role: 'student' | 'teacher'): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${role}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      const data = await response.json();

      if (data.success && data.token) {
        const mappedUser = role === 'student' ? mapStudentUser(data.student) : mapTeacherUser(data.teacher);
        persistSession(mappedUser, data.token);
        return true;
      }

      console.error(data.message);
      return false;
    } catch (err) {
      console.error('Google giriş hatası:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [persistSession]);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      if (userData.role === 'student') {
        const response = await fetch(`${API_BASE_URL}/student/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            password: userData.password,
            phoneNumber: userData.phone || ''
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
          persistSession(mapStudentUser(data.student), data.token);
          return true;
        } else {
          console.error(data.message);
          return false;
        }
      } else {
        // Mock teacher registration
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newUser: User = {
          id: `u${Date.now()}`,
          name: userData.name,
          surname: userData.surname,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          createdAt: new Date(),
        };
        setUser(newUser);
        return true;
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('rim_auth_token');
    localStorage.removeItem('rim_user');
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
