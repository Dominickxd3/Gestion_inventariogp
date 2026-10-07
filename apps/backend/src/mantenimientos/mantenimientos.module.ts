import { Module } from '@nestjs/common';
import { MantenimientosController } from './mantenimientos.controller';
import { MantenimientosRepository } from './mantenimientos.repository';
import { MantenimientosService } from './mantenimientos.service';

@Module({
  controllers: [MantenimientosController],
  providers: [MantenimientosService, MantenimientosRepository],
  exports: [MantenimientosService, MantenimientosRepository],
})
export class MantenimientosModule {}
