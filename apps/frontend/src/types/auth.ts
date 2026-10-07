export interface Permission { code: string; name: string; module: string }
export interface User { id: number; username: string; name: string; email: string | null; role: string; permissions: Permission[] }
export interface LoginResponse { accessToken: string; user: User }
