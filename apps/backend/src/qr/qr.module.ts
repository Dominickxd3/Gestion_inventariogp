import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { QrRepository } from './qr.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [QrController],
  providers: [QrService, QrRepository],
  exports: [QrService, QrRepository],
})
export class QrModule {}
