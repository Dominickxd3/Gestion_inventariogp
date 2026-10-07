import { Module } from '@nestjs/common'; import { CatalogosController } from './catalogos.controller'; import { CatalogosRepository } from './catalogos.repository';
@Module({controllers:[CatalogosController],providers:[CatalogosRepository]}) export class CatalogosModule {}
