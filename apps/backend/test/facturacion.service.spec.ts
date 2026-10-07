import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FacturacionRepository } from '../src/telefonia/facturacion/facturacion.repository';
import { FacturacionService } from '../src/telefonia/facturacion/facturacion.service';
import { ConciliacionRepository } from '../src/telefonia/facturacion/conciliacion.repository';
import { ConciliacionService } from '../src/telefonia/facturacion/conciliacion.service';

describe('Facturacion y Conciliacion Services', () => {
  describe('FacturacionService', () => {
    const repo = {
      list: jest.fn(),
      detail: jest.fn(),
      create: jest.fn(),
      listDetalle: jest.fn(),
      updateDetalleEstado: jest.fn(),
      cerrar: jest.fn(),
      vincularCuota: jest.fn(),
    };
    const service = new FacturacionService(repo as unknown as FacturacionRepository);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('delega listado y paginación de facturas', async () => {
      repo.list.mockResolvedValue({ items: [], pagination: { total: 0 } });
      await service.list({ page: 1, pageSize: 20, sortBy: 'periodoInicio', sortDirection: 'desc' });
      expect(repo.list).toHaveBeenCalledWith({ page: 1, pageSize: 20, sortBy: 'periodoInicio', sortDirection: 'desc' });
    });

    it('lanza NotFoundException si la factura no existe', async () => {
      repo.detail.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('crea factura con cabecera y detalle en una sola transacción', async () => {
      const dto = {
        idOperador: 1,
        numeroFactura: 'F001-1234',
        fechaEmision: '2026-09-05',
        periodoInicio: '2026-08-01',
        periodoFin: '2026-08-31',
        montoTotal: 1500,
        detalles: [
          { numeroLinea: '987654321', cargoPlan: 69.9, montoTotal: 69.9, cargoEquipos: 0, cargosAdicionales: 0, descuentos: 0, prorrateo: 0, saldoAnterior: 0 },
        ],
      };
      repo.create.mockResolvedValue({ idFactura: 10, ...dto });
      const res = await service.create(dto, 1, '127.0.0.1');
      expect(res).toEqual(expect.objectContaining({ idFactura: 10 }));
    });

    it('traduce FACTURA_DUPLICADA a ConflictException', async () => {
      repo.create.mockRejectedValue({ code: 'FACTURA_DUPLICADA' });
      await expect(service.create({ idOperador: 1, fechaEmision: '2026-09-01', periodoInicio: '2026-08-01', periodoFin: '2026-08-31', montoTotal: 100, detalles: [] }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('traduce DETALLE_LINEAS_DUPLICADAS a BadRequestException', async () => {
      repo.create.mockRejectedValue({ code: 'DETALLE_LINEAS_DUPLICADAS', message: 'Línea repetida' });
      await expect(service.create({ idOperador: 1, fechaEmision: '2026-09-01', periodoInicio: '2026-08-01', periodoFin: '2026-08-31', montoTotal: 100, detalles: [] }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('actualiza estado del detalle respetando snapshot', async () => {
      repo.updateDetalleEstado.mockResolvedValue({ idDetalle: 5, estadoConciliacion: 'CORREGIDO', observaciones: 'Vinculado manual' });
      const res = await service.updateDetalleEstado(10, 5, { estadoConciliacion: 'CORREGIDO', observaciones: 'Vinculado manual', idLinea: 42 }, 1, '127.0.0.1');
      expect(res).toEqual(expect.objectContaining({ estadoConciliacion: 'CORREGIDO' }));
    });

    it('impide modificar detalles si la factura está cerrada', async () => {
      repo.updateDetalleEstado.mockRejectedValue({ code: 'FACTURA_CERRADA' });
      await expect(service.updateDetalleEstado(10, 5, { estadoConciliacion: 'CONFORME' }, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('cierra factura con motivo justificado si hay pendientes', async () => {
      repo.cerrar.mockResolvedValue({ idFactura: 10, estadoConciliacion: 'CERRADO' });
      const res = await service.cerrar(10, 'Aprobado con observaciones menores', 1, '127.0.0.1');
      expect(res).toEqual(expect.objectContaining({ estadoConciliacion: 'CERRADO' }));
    });

    it('rechaza cerrar factura sin justificación cuando se requiere', async () => {
      repo.cerrar.mockRejectedValue({ code: 'CIERRE_REQUERIDO_JUSTIFICACION', message: 'Existen líneas pendientes' });
      await expect(service.cerrar(10, undefined, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('vincula cuota de financiamiento a factura', async () => {
      repo.vincularCuota.mockResolvedValue({ idCuota: 2, idFactura: 10, estado: 'FACTURADA' });
      const res = await service.vincularCuota(10, 2, 1, '127.0.0.1');
      expect(res).toEqual(expect.objectContaining({ estado: 'FACTURADA' }));
    });
  });

  describe('ConciliacionService', () => {
    const repo = {
      conciliar: jest.fn(),
      getResumenConciliacion: jest.fn(),
    };
    const service = new ConciliacionService(repo as unknown as ConciliacionRepository);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('ejecuta conciliación histórica y devuelve resultados', async () => {
      const mockResult = {
        idFactura: 10,
        estadoConciliacion: 'CONCILIADO',
        totalDetalles: 1,
        items: [
          {
            idDetalle: 1,
            numeroLinea: '987654321',
            estadoConciliacion: 'CONFORME',
            diagnosticos: ['CONFORME'],
            responsablesPeriodo: [{ idTrabajador: 10, nombre: 'Ana Gómez', fechaInicio: '2026-08-01', fechaFin: null }],
            equiposPeriodo: [{ idActivo: 20, codigo: 'CEL-001', fechaInicio: '2026-08-01', fechaFin: null }],
          },
        ],
      };
      repo.conciliar.mockResolvedValue(mockResult);
      const res = await service.conciliar(10, 1, '127.0.0.1');
      expect(res).toEqual(mockResult);
      expect(repo.conciliar).toHaveBeenCalledWith(10, 1, '127.0.0.1');
    });

    it('detecta líneas no registradas en el sistema', async () => {
      const mockResult = {
        idFactura: 10,
        estadoConciliacion: 'EN_REVISION',
        totalDetalles: 1,
        items: [
          {
            idDetalle: 2,
            numeroLinea: '999999999',
            estadoConciliacion: 'OBSERVADO',
            diagnosticos: ['LINEA_NO_REGISTRADA'],
            responsablesPeriodo: [],
            equiposPeriodo: [],
          },
        ],
      };
      repo.conciliar.mockResolvedValue(mockResult);
      const res = await service.conciliar(10, 1, '127.0.0.1');
      expect(res.items[0].diagnosticos).toContain('LINEA_NO_REGISTRADA');
      expect(res.items[0].estadoConciliacion).toBe('OBSERVADO');
    });

    it('detecta múltiples responsables dentro del mismo periodo mensual', async () => {
      const mockResult = {
        idFactura: 10,
        estadoConciliacion: 'EN_REVISION',
        totalDetalles: 1,
        items: [
          {
            idDetalle: 3,
            numeroLinea: '987654321',
            estadoConciliacion: 'OBSERVADO',
            diagnosticos: ['MULTIPLES_RESPONSABLES_PERIODO'],
            responsablesPeriodo: [
              { idTrabajador: 1, nombre: 'Juan Pérez', fechaInicio: '2026-08-01', fechaFin: '2026-08-15' },
              { idTrabajador: 2, nombre: 'María López', fechaInicio: '2026-08-16', fechaFin: '2026-08-31' },
            ],
            equiposPeriodo: [{ idActivo: 5, codigo: 'CEL-005', fechaInicio: '2026-08-01', fechaFin: null }],
          },
        ],
      };
      repo.conciliar.mockResolvedValue(mockResult);
      const res = await service.conciliar(10, 1, '127.0.0.1');
      expect(res.items[0].diagnosticos).toContain('MULTIPLES_RESPONSABLES_PERIODO');
      expect(res.items[0].responsablesPeriodo).toHaveLength(2);
    });

    it('detecta líneas sin responsable y líneas sin equipo', async () => {
      const mockResult = {
        idFactura: 10,
        estadoConciliacion: 'EN_REVISION',
        totalDetalles: 1,
        items: [
          {
            idDetalle: 4,
            numeroLinea: '987654321',
            estadoConciliacion: 'OBSERVADO',
            diagnosticos: ['SIN_RESPONSABLE', 'SIN_EQUIPO'],
            responsablesPeriodo: [],
            equiposPeriodo: [],
          },
        ],
      };
      repo.conciliar.mockResolvedValue(mockResult);
      const res = await service.conciliar(10, 1, '127.0.0.1');
      expect(res.items[0].diagnosticos).toContain('SIN_RESPONSABLE');
      expect(res.items[0].diagnosticos).toContain('SIN_EQUIPO');
    });

    it('detecta desvíos de monto de plan y cargos adicionales', async () => {
      const mockResult = {
        idFactura: 10,
        estadoConciliacion: 'EN_REVISION',
        totalDetalles: 1,
        items: [
          {
            idDetalle: 5,
            numeroLinea: '987654321',
            cargoPlan: 89.9,
            cargosAdicionales: 25.5,
            diagnosticos: ['MONTO_PLAN_DIFERENTE', 'CARGOS_ADICIONALES'],
            planEsperado: { idPlan: 2, nombre: 'Plan 69.90', precioMensual: 69.9 },
          },
        ],
      };
      repo.conciliar.mockResolvedValue(mockResult);
      const res = await service.conciliar(10, 1, '127.0.0.1');
      expect(res.items[0].diagnosticos).toContain('MONTO_PLAN_DIFERENTE');
      expect(res.items[0].diagnosticos).toContain('CARGOS_ADICIONALES');
    });

    it('rechaza conciliar una factura cerrada', async () => {
      repo.conciliar.mockRejectedValue({ code: 'FACTURA_CERRADA' });
      await expect(service.conciliar(10, 1, '127.0.0.1'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('devuelve resumen de métricas de conciliación', async () => {
      const mockResumen = {
        factura: { idFactura: 10, estadoConciliacion: 'CONCILIADO' },
        metricas: { totalLineas: 10, conformes: 8, observados: 1, corregidos: 1, pendientes: 0 },
        financiero: { montoFacturado: 1000, totalCalculado: 1000, diferencia: 0 },
      };
      repo.getResumenConciliacion.mockResolvedValue(mockResumen);
      const res = await service.getResumenConciliacion(10);
      expect(res).toEqual(mockResumen);
    });
  });
});
