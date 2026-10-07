import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

class HealthResponse {
  @ApiProperty({ example: 'ok' }) status!: string;
}
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}
  @Get()
  @ApiOkResponse({ type: HealthResponse, description: 'Proceso activo; no verifica SQL Server.' })
  live(): HealthResponse { return { status: 'ok' }; }

  @Get('ready')
  @ApiOkResponse({ type: HealthResponse, description: 'Conexión SQL Server disponible.' })
  @ApiServiceUnavailableResponse({ description: 'SQL Server no está disponible.' })
  async ready(): Promise<HealthResponse> {
    if (!await this.database.isReady()) throw new ServiceUnavailableException('Base de datos no disponible');
    return { status: 'ok' };
  }
}

