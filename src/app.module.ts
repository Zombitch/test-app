import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    SmsModule,
  ],
})
export class AppModule {}
