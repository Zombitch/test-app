import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SNS_CLIENT, snsClientProvider } from './sns-client.provider';

@Module({
  imports: [ConfigModule],
  controllers: [SmsController],
  providers: [SmsService, snsClientProvider],
  exports: [SmsService, SNS_CLIENT],
})
export class SmsModule {}
