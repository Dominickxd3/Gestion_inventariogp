export interface Permission { code: string; name: string; module: string }
export interface AuthUser { id: number; username: string; name: string; email: string | null; role: string; permissions: Permission[] }
export interface JwtPayload { sub: number; username: string; nombre: string; rol: string }
