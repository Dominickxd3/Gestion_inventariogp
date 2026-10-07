import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/auth/permissions.guard';

describe('PermissionsGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new PermissionsGuard(reflector as unknown as Reflector);
  const context = (permissions: string[]) => ({
    getHandler: () => undefined, getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: { permissions: permissions.map(code => ({ code })) } }) }),
  }) as unknown as ExecutionContext;

  it('permite cuando el permiso efectivo existe', () => {
    reflector.getAllAndOverride.mockReturnValue(['ACTIVOS_VER']);
    expect(guard.canActivate(context(['ACTIVOS_VER']))).toBe(true);
  });
  it('deniega cuando el permiso efectivo no existe', () => {
    reflector.getAllAndOverride.mockReturnValue(['ACTIVOS_CREAR']);
    expect(() => guard.canActivate(context(['ACTIVOS_VER']))).toThrow(ForbiddenException);
  });
});
