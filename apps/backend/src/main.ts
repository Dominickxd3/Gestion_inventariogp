import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { createApplication } from './bootstrap';
import { Environment } from './config/environment';

async function main(): Promise<void> {
  const app = await createApplication();
  const config = app.get(ConfigService<Environment, true>);
  await app.listen(config.get('PORT'), config.get('HOST'));
}
void main().catch(() => {
  process.stderr.write('No se pudo iniciar Gestión TI. Revise la configuración y el puerto.\n');
  process.exitCode = 1;
});

