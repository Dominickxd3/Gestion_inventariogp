import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    let message: string | string[] = 'Error interno del servidor';
    if (status < 500 && exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') message = response;
      else if ('message' in response) {
        const candidate: unknown = response.message;
        if (typeof candidate === 'string' || (Array.isArray(candidate) && candidate.every(item => typeof item === 'string'))) message = candidate;
      }
    }
    if (status >= 500) this.logger.error({ requestId: request.id, status }, 'Solicitud fallida');
    void reply.status(status).send({ statusCode: status, message, requestId: request.id });
  }
}

