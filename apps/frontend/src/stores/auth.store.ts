import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '../types/auth';

interface AuthState {
  user: User | null; accessToken: string | null; permissions: string[]; isAuthenticated: boolean;
  setSession: (accessToken: string, user: User) => void; setUser: (user: User) => void; logout: () => void;
}
export const useAuthStore = create<AuthState>()(persist(set => ({
  user: null, accessToken: null, permissions: [], isAuthenticated: false,
  setSession: (accessToken, user) => set({ accessToken, user, permissions: user.permissions.map(item => item.code), isAuthenticated: true }),
  setUser: user => set({ user, permissions: user.permissions.map(item => item.code), isAuthenticated: true }),
  logout: () => {
    set({ user: null, accessToken: null, permissions: [], isAuthenticated: false });
    sessionStorage.removeItem('gp-session');
  },
}), { name: 'gp-session', storage: createJSONStorage(() => sessionStorage) }));
