import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ConnectionPool, Transaction } from 'mssql';
import { DatabaseService } from '../src/database/database.service';
import { Environment, validateEnvironment } from '../src/config/environment';
jest.mock('mssql', () => ({ ConnectionPool: jest.fn(), Transaction: jest.fn() }));
describe('Pool SQL Server', () => {
  const query = jest.fn().mockResolvedValue({ recordset: [{ ready: 1 }] });
  const pool = { connected: false, connect: jest.fn(), request: jest.fn(() => ({ query })), close: jest.fn(), on: jest.fn() };
  let database: DatabaseService;
  beforeEach(() => {
    pool.connected = false;
    pool.connect.mockImplementation(async () => { pool.connected = true; return pool; });
    (ConnectionPool as unknown as jest.Mock).mockImplementation(() => pool);
    database = new DatabaseService(
      new ConfigService<Environment, true>(validateEnvironment({ DB_SERVER: 'localhost', DB_USER: 'test', DB_PASSWORD: 'test', CORS_ORIGINS: 'http://localhost:5173', JWT_SECRET: 'test-only-secret-with-at-least-32-characters' })),
      { error: jest.fn() } as unknown as PinoLogger,
    );
  });
  it('comparte la conexión entre requests concurrentes', async () => {
    await Promise.all([database.request(), database.request(), database.request()]);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.request).toHaveBeenCalledTimes(3);
  });
  it('permite reintentar después de una conexión fallida', async () => {
    pool.connect.mockRejectedValueOnce(new Error('SQL no disponible'));
    expect(await database.isReady()).toBe(false);
    expect(await database.isReady()).toBe(true);
    expect(pool.connect).toHaveBeenCalledTimes(2);
  });
  it('cierra el pool al detener la aplicación', async () => {
    await database.onApplicationShutdown();
    expect(pool.close).toHaveBeenCalledTimes(1);
  });
  it('revierte la transacción cuando falla cualquier operación', async () => {
    const tx = { begin: jest.fn().mockResolvedValue(undefined), commit: jest.fn().mockResolvedValue(undefined), rollback: jest.fn().mockResolvedValue(undefined) };
    (Transaction as unknown as jest.Mock).mockImplementation(() => tx);
    await expect(database.transaction(async () => { throw new Error('auditoría fallida'); })).rejects.toThrow('auditoría fallida');
    expect(tx.rollback).toHaveBeenCalledTimes(1); expect(tx.commit).not.toHaveBeenCalled();
  });
});

