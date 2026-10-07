import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionPool, Request, Transaction } from 'mssql';
import { PinoLogger } from 'nestjs-pino';
import { Environment } from '../config/environment';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: ConnectionPool;
  private connecting?: Promise<ConnectionPool>;

  constructor(config: ConfigService<Environment, true>, logger: PinoLogger) {
    this.pool = new ConnectionPool({
      server: config.get('DB_SERVER'), port: config.get('DB_PORT'),
      user: config.get('DB_USER'), password: config.get('DB_PASSWORD'),
      database: config.get('DB_DATABASE'),
      options: { encrypt: config.get('DB_ENCRYPT'), trustServerCertificate: config.get('DB_TRUST_SERVER_CERTIFICATE') },
      pool: { min: 0, max: config.get('DB_POOL_MAX'), idleTimeoutMillis: 30000 },
      connectionTimeout: config.get('DB_CONNECTION_TIMEOUT_MS'), requestTimeout: config.get('DB_REQUEST_TIMEOUT_MS'),
    });
    this.pool.on('error', () => logger.error('Error en pool SQL Server'));
  }

  async request(): Promise<Request> {
    if (!this.pool.connected) {
      this.connecting ??= this.pool.connect().catch((error: unknown) => {
        this.connecting = undefined;
        throw error;
      });
      await this.connecting;
      this.connecting = undefined;
    }
    return this.pool.request();
  }

  async isReady(): Promise<boolean> {
    try {
      const request = await this.request();
      await request.query('SELECT 1 AS ready');
      return true;
    } catch { return false; }
  }

  async transaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    await this.request();
    const transaction = new Transaction(this.pool);
    await transaction.begin();
    try {
      const result = await work(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.connecting) await this.connecting.catch(() => undefined);
    await this.pool.close();
  }
}

