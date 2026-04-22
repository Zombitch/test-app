import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendSmsResult, SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: SendSmsDto): Promise<SendSmsResult> {
    return this.smsService.send(dto);
  }
}
