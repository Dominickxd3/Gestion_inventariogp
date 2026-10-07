import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditoriaRepository, AuditoriaListItem, AuditoriaDetail } from './auditoria.repository';
import { QueryAuditoriaDto } from './dto/query-auditoria.dto';

@Injectable()
export class AuditoriaService {
  constructor(private readonly repository: AuditoriaRepository) {}

  async list(q: QueryAuditoriaDto): Promise<{
    items: AuditoriaListItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { items, total } = await this.repository.findAuditoria(q);
    const totalPages = total > 0 ? Math.ceil(total / q.pageSize) : 0;
    return {
      items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages,
      },
    };
  }

  async getById(id: string): Promise<AuditoriaDetail> {
    const item = await this.repository.findAuditoriaById(id);
    if (!item) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }
    return item;
  }
}
