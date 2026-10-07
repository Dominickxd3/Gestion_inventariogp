import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../src/auth/auth.repository';
import { DatabaseService } from '../src/database/database.service';
import { Environment } from '../src/config/environment';

describe('AuthRepository', () => {
  const mockConfig = {
    get: jest.fn((key: string) => (key === 'AUTH_MODE' ? 'ERP' : undefined)),
  } as unknown as ConfigService<Environment, true>;

  it('autentica contra la vista ERP sin devolver ni almacenar User_PassBin en modo ERP', async () => {
    const request = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ Success: 1 }] }) };
    const database = { request: jest.fn().mockResolvedValue(request) };
    const repository = new AuthRepository(database as unknown as DatabaseService, mockConfig);

    await expect(repository.authenticateCorporate('usuario.erp', 'password-only-for-test')).resolves.toEqual({ Success: 1 });
    expect(request.input).toHaveBeenNthCalledWith(1, 'Usuario', expect.anything(), 'usuario.erp');
    expect(request.input).toHaveBeenNthCalledWith(2, 'Contrasena', expect.anything(), 'password-only-for-test');
    const sql = String(request.query.mock.calls[0][0]);
    expect(sql).toContain('[DB_GP_Trabajos_TEST].[dbo].[vw_ERP_Usuarios]');
    expect(sql).toContain('CONVERT(VARCHAR(15), User_PassBin) = @Contrasena');
    expect(sql).not.toContain('sp_login_usuario');
    expect(sql).not.toMatch(/SELECT\s+User_PassBin/i);
  });

  it('devuelve rechazo cuando la vista ERP no encuentra coincidencia en modo ERP', async () => {
    const request = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ Success: 0 }] }) };
    const repository = new AuthRepository({ request: jest.fn().mockResolvedValue(request) } as unknown as DatabaseService, mockConfig);
    await expect(repository.authenticateCorporate('usuario.erp', 'invalid-test-value')).resolves.toEqual({ Success: 0 });
  });

  it('autentica con verificación local en modo LOCAL_TEST', async () => {
    const localConfig = {
      get: jest.fn((key: string) => (key === 'AUTH_MODE' ? 'LOCAL_TEST' : undefined)),
    } as unknown as ConfigService<Environment, true>;
    const request = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ id_usuario_sistema: 1 }] }) };
    const repository = new AuthRepository({ request: jest.fn().mockResolvedValue(request) } as unknown as DatabaseService, localConfig);
    await expect(repository.authenticateCorporate('usuario.local', 'password-test')).resolves.toEqual({ Success: 1 });
  });
});
