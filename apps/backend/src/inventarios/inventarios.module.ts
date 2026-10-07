import { Module } from '@nestjs/common';
import { InventariosController } from './inventarios.controller';
import { InventariosRepository } from './inventarios.repository';
import { InventariosService } from './inventarios.service';

@Module({
  controllers: [InventariosController],
  providers: [InventariosService, InventariosRepository],
  exports: [InventariosService, InventariosRepository],
})
export class InventariosModule {}
