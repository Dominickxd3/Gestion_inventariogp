import 'reflect-metadata';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DatabaseService } from '../src/database/database.service';
import { createApplication } from '../src/bootstrap';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../src/auth/auth.repository';
import { DashboardRepository } from '../src/dashboard/dashboard.repository';
import { ActivosRepository } from '../src/activos/activos.repository';
import { AsignacionesRepository } from '../src/asignaciones/asignaciones.repository';

describe('Infraestructura HTTP', () => {
  let app: NestFastifyApplication;
  const previous = { ...process.env };
  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production', DB_SERVER: 'localhost', DB_USER: 'test', DB_PASSWORD: 'test',
      CORS_ORIGINS: 'http://localhost:5173', LOG_LEVEL: 'silent', SWAGGER_ENABLED: 'false',
      JWT_SECRET: 'test-only-secret-with-at-least-32-characters', JWT_EXPIRES_IN: '1h',
      JWT_ISSUER: 'gp-test', JWT_AUDIENCE: 'gp-test-web',
    });
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => { await app.close(); process.env = previous; });
  it('expone liveness con cabeceras de seguridad', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
  it('no expone Swagger en producción por defecto', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/docs' })).statusCode).toBe(404);
  });
  it('autoriza solamente el origen CORS configurado', async () => {
    const allowed = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'http://localhost:5173' } });
    const denied = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://other.example' } });
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('devuelve 503 sin revelar detalles de SQL cuando falla readiness', async () => {
    jest.spyOn(app.get(DatabaseService), 'isReady').mockResolvedValue(false);
    const response = await app.inject({ method: 'GET', url: '/api/v1/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ statusCode: 503, message: 'Error interno del servidor' });
    expect(response.body).not.toContain('stack');
  });
  it('devuelve readiness cuando SQL responde', async () => {
    jest.spyOn(app.get(DatabaseService), 'isReady').mockResolvedValue(true);
    expect((await app.inject({ method: 'GET', url: '/api/v1/health/ready' })).statusCode).toBe(200);
  });
  it('limita requests repetidos', async () => {
    let status = 200;
    for (let index = 0; index < 121; index++) {
      status = (await app.inject({ method: 'GET', url: '/api/v1/health', remoteAddress: '192.0.2.55' })).statusCode;
    }
    expect(status).toBe(429);
  });
  it('protege auth/me y rechaza un JWT invÃ¡lido', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/auth/me' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: 'Bearer invalid.jwt.value' } })).statusCode).toBe(401);
  });
  it('aplica un lÃ­mite especÃ­fico al login', async () => {
    jest.spyOn(app.get(AuthRepository), 'authenticateCorporate').mockResolvedValue({ Success: 0 });
    let status = 0;
    for (let index = 0; index < 6; index++) {
      status = (await app.inject({ method: 'POST', url: '/api/v1/auth/login', remoteAddress: '192.0.2.77', payload: { username: 'test.user', password: 'not-a-real-password' } })).statusCode;
    }
    expect(status).toBe(429);
  });
  it('rechaza un JWT expirado', async () => {
    const token = await app.get(JwtService).signAsync({ sub: 96, username: 'test.user', nombre: 'Prueba', rol: 'ADMIN' }, { expiresIn: -1 });
    expect((await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(401);
  });
  it('devuelve el usuario efectivo en el endpoint protegido con JWT vÃ¡lido', async () => {
    const user = { id: 96, username: 'test.user', name: 'Usuario Prueba', email: null, role: 'ADMIN', permissions: [] };
    jest.spyOn(app.get(AuthRepository), 'findEffectiveUser').mockResolvedValue(user);
    const token = await app.get(JwtService).signAsync({ sub: 96, username: 'test.user', nombre: 'Usuario Prueba', rol: 'ADMIN' });
    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(user);
  });
  it('protege dashboard sin JWT y deniega sin DASHBOARD_VER', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard/resumen' })).statusCode).toBe(401);
    const user = { id: 96, username: 'test.user', name: 'Usuario Prueba', email: null, role: 'CONSULTA', permissions: [] };
    jest.spyOn(app.get(AuthRepository), 'findEffectiveUser').mockResolvedValue(user);
    const token = await app.get(JwtService).signAsync({ sub: 96, username: user.username, nombre: user.name, rol: user.role });
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard/resumen', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(403);
  });
  it('devuelve dashboard autorizado y valida idSede', async () => {
    const user = { id: 96, username: 'test.user', name: 'Usuario Prueba', email: null, role: 'CONSULTA', permissions: [{ code: 'DASHBOARD_VER', name: 'Ver dashboard', module: 'DASHBOARD' }] };
    jest.spyOn(app.get(AuthRepository), 'findEffectiveUser').mockResolvedValue(user);
    const dashboard = app.get(DashboardRepository);
    jest.spyOn(dashboard, 'getKpis').mockResolvedValue({ totalActivos: 0, asignados: 0, disponibles: 0, mantenimiento: 0, observados: 0, lineasActivas: 0 });
    jest.spyOn(dashboard, 'getAssetsByType').mockResolvedValue([]); jest.spyOn(dashboard, 'getAssetsByStatus').mockResolvedValue([]);
    jest.spyOn(dashboard, 'getAlerts').mockResolvedValue({ lineasSinResponsable: 0, lineasSinEquipo: 0, mantenimientosPendientes: 0, inventariosAbiertos: 0 });
    jest.spyOn(dashboard, 'getRecentActivity').mockResolvedValue([]);
    const token = await app.get(JwtService).signAsync({ sub: 96, username: user.username, nombre: user.name, rol: user.role });
    const headers = { authorization: `Bearer ${token}` };
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard/resumen', headers })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard/resumen?idSede=abc', headers })).statusCode).toBe(400);
  });
  it('gestiona errores SQL sin exponer detalles', async () => {
    const user = { id: 96, username: 'test.user', name: 'Usuario Prueba', email: null, role: 'ADMIN', permissions: [{ code: 'DASHBOARD_VER', name: 'Ver dashboard', module: 'DASHBOARD' }] };
    jest.spyOn(app.get(AuthRepository), 'findEffectiveUser').mockResolvedValue(user);
    jest.spyOn(app.get(DashboardRepository), 'getKpis').mockRejectedValue(new Error('SELECT secret FROM internal'));
    const token = await app.get(JwtService).signAsync({ sub: 96, username: user.username, nombre: user.name, rol: user.role });
    const response = await app.inject({ method: 'GET', url: '/api/v1/dashboard/resumen', headers: { authorization: `Bearer ${token}` } });
    expect(response.statusCode).toBe(500); expect(response.body).not.toContain('SELECT secret');
  });
  it('protege listado y creación de activos por permisos', async () => {
    expect((await app.inject({method:'GET',url:'/api/v1/activos'})).statusCode).toBe(401);
    const user={id:96,username:'test.user',name:'Prueba',email:null,role:'CONSULTA',permissions:[{code:'ACTIVOS_VER',name:'Ver',module:'ACTIVOS'}]};jest.spyOn(app.get(AuthRepository),'findEffectiveUser').mockResolvedValue(user);jest.spyOn(app.get(ActivosRepository),'list').mockResolvedValue({items:[],pagination:{page:1,pageSize:20,total:0,totalPages:0}});const token=await app.get(JwtService).signAsync({sub:96,username:user.username,nombre:user.name,rol:user.role});const headers={authorization:`Bearer ${token}`};
    expect((await app.inject({method:'GET',url:'/api/v1/activos?search=ACT&page=1&pageSize=20&sortBy=codigo&sortDirection=asc',headers})).statusCode).toBe(200);
    expect((await app.inject({method:'POST',url:'/api/v1/activos',headers,payload:{codigo:'ACT-X',idTipo:1,idEstado:1}})).statusCode).toBe(403);
    expect((await app.inject({method:'GET',url:'/api/v1/activos?idTipo=0',headers})).statusCode).toBe(400);
  });
  it('protege asignaciones y autoriza listado con filtros válidos',async()=>{
    expect((await app.inject({method:'GET',url:'/api/v1/asignaciones'})).statusCode).toBe(401);
    const denied={id:96,username:'test.user',name:'Prueba',email:null,role:'CONSULTA',permissions:[]};jest.spyOn(app.get(AuthRepository),'findEffectiveUser').mockResolvedValue(denied);let token=await app.get(JwtService).signAsync({sub:96,username:denied.username,nombre:denied.name,rol:denied.role});expect((await app.inject({method:'GET',url:'/api/v1/asignaciones',headers:{authorization:`Bearer ${token}`}})).statusCode).toBe(403);
    const allowed={...denied,permissions:[{code:'ASIGNACIONES_VER',name:'Ver',module:'ASIGNACIONES'}]};jest.spyOn(app.get(AuthRepository),'findEffectiveUser').mockResolvedValue(allowed);token=await app.get(JwtService).signAsync({sub:96,username:allowed.username,nombre:allowed.name,rol:allowed.role});jest.spyOn(app.get(AsignacionesRepository),'list').mockResolvedValue({items:[],pagination:{page:1,pageSize:20,total:0,totalPages:0}});const headers={authorization:`Bearer ${token}`};expect((await app.inject({method:'GET',url:'/api/v1/asignaciones?search=ACT&estado=VIGENTE&page=1&pageSize=20',headers})).statusCode).toBe(200);expect((await app.inject({method:'GET',url:'/api/v1/asignaciones?pageSize=101',headers})).statusCode).toBe(400);expect((await app.inject({method:'POST',url:'/api/v1/asignaciones',headers,payload:{idActivo:1,idTrabajador:1}})).statusCode).toBe(403);
  });
});

