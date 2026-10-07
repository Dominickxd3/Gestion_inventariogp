import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { AuthRepository } from '../src/auth/auth.repository';
import { AuthService } from '../src/auth/auth.service';
import { AuthUser } from '../src/auth/auth.types';

describe('AuthService', () => {
  const user: AuthUser = { id: 96, username: 'test.user', name: 'Usuario Prueba', email: 'test@example.test', role: 'ADMIN', permissions: [{ code: 'ACTIVOS_VER', name: 'Ver activos', module: 'ACTIVOS' }] };
  const repository = { authenticateCorporate: jest.fn(), authorizeLocal: jest.fn(), isRoleActive: jest.fn(), findEffectiveUser: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const service = new AuthService(repository as unknown as AuthRepository, jwt as unknown as JwtService, logger as unknown as PinoLogger);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.authenticateCorporate.mockResolvedValue({ Success: 1 });
    repository.authorizeLocal.mockResolvedValue({ Success: 1, id_usuario_sistema: 96, user_logon: 'test.user', id_rol: 1, rol_codigo: 'ADMIN' });
    repository.isRoleActive.mockResolvedValue(true);
    repository.findEffectiveUser.mockResolvedValue(user);
  });

  it('rechaza el login corporativo invÃ¡lido sin intentar autorizaciÃ³n local', async () => {
    repository.authenticateCorporate.mockResolvedValue({ Success: 0 });
    await expect(service.login('test.user', 'not-a-real-password')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.authorizeLocal).not.toHaveBeenCalled();
  });

  it.each([
    ['usuario sin autorizaciÃ³n local', 'El usuario no tiene acceso autorizado'],
    ['usuario ERP inactivo', 'Usuario inactivo en el sistema corporativo'],
    ['usuario sin rol', 'El usuario no tiene un rol asignado'],
  ])('rechaza %s', async (_case, message) => {
    repository.authorizeLocal.mockResolvedValue({ Success: 0, Message: message });
    await expect(service.login('test.user', 'not-a-real-password')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza un rol deshabilitado', async () => {
    repository.isRoleActive.mockResolvedValue(false);
    await expect(service.login('test.user', 'not-a-real-password')).rejects.toThrow('El rol asignado estÃ¡ deshabilitado');
  });

  it('genera un JWT para un login vÃ¡lido sin incluir contraseÃ±a', async () => {
    await expect(service.login(' test.user ', 'not-a-real-password')).resolves.toEqual({ accessToken: 'signed-token', user });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 96, username: 'test.user', nombre: 'Usuario Prueba', rol: 'ADMIN' });
    expect(jwt.signAsync).not.toHaveBeenCalledWith(expect.objectContaining({ password: expect.anything() }));
  });
});
