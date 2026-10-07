import { DatabaseService } from '../src/database/database.service';
import { DashboardRepository } from '../src/dashboard/dashboard.repository';

describe('DashboardRepository', () => {
  it('parametriza idSede sin concatenar su valor en SQL', async () => {
    const input = jest.fn().mockReturnThis();
    const query = jest.fn().mockResolvedValue({ recordset: [{ totalActivos: 0, asignados: 0, disponibles: 0, mantenimiento: 0, observados: 0, lineasActivas: 0 }] });
    const repository = new DashboardRepository({ request: jest.fn().mockResolvedValue({ input, query }) } as unknown as DatabaseService);
    await repository.getKpis(7);
    expect(input).toHaveBeenCalledWith('idSede', expect.anything(), 7); expect(query.mock.calls[0][0]).toContain('@idSede'); expect(query.mock.calls[0][0]).not.toContain('= 7');
  });
});
