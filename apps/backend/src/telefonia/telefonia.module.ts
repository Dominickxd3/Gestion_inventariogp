import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LineasController } from './lineas/lineas.controller';
import { LineasRepository } from './lineas/lineas.repository';
import { LineasService } from './lineas/lineas.service';
import { RelacionesRepository } from './relaciones/relaciones.repository';
import { RelacionesService } from './relaciones/relaciones.service';
import { FinanciamientosController } from './financiamientos/financiamientos.controller';
import { FinanciamientosRepository } from './financiamientos/financiamientos.repository';
import { FinanciamientosService } from './financiamientos/financiamientos.service';
import { FacturacionController } from './facturacion/facturacion.controller';
import { FacturacionRepository } from './facturacion/facturacion.repository';
import { FacturacionService } from './facturacion/facturacion.service';
import { ConciliacionRepository } from './facturacion/conciliacion.repository';
import { ConciliacionService } from './facturacion/conciliacion.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LineasController, FinanciamientosController, FacturacionController],
  providers: [
    LineasService,
    LineasRepository,
    RelacionesService,
    RelacionesRepository,
    FinanciamientosService,
    FinanciamientosRepository,
    FacturacionService,
    FacturacionRepository,
    ConciliacionService,
    ConciliacionRepository,
  ],
  exports: [LineasService, RelacionesService, FinanciamientosService, FacturacionService, ConciliacionService],
})
export class TelefoniaModule {}
