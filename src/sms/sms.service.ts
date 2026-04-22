import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageAttributeValue,
  PublishCommand,
  PublishCommandOutput,
  SNSClient,
} from '@aws-sdk/client-sns';
import { SendSmsDto } from './dto/send-sms.dto';
import { SNS_CLIENT } from './sns-client.provider';

export interface SendSmsResult {
  messageId: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(SNS_CLIENT) private readonly sns: SNSClient,
    private readonly config: ConfigService,
  ) {}

  async send(dto: SendSmsDto): Promise<SendSmsResult> {
    const smsType =
      dto.smsType ??
      this.config.get<'Promotional' | 'Transactional'>(
        'SNS_SMS_TYPE',
        'Transactional',
      );
    const senderId = dto.senderId ?? this.config.get<string>('SNS_SENDER_ID');

    const MessageAttributes: Record<string, MessageAttributeValue> = {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: smsType,
      },
    };

    if (senderId) {
      MessageAttributes['AWS.SNS.SMS.SenderID'] = {
        DataType: 'String',
        StringValue: senderId,
      };
    }

    const command = new PublishCommand({
      PhoneNumber: dto.phoneNumber,
      Message: dto.message,
      MessageAttributes,
    });

    let output: PublishCommandOutput;
    try {
      output = await this.sns.send(command);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to publish SMS via SNS: ${message}`);
      throw new InternalServerErrorException('Failed to send SMS');
    }

    if (!output.MessageId) {
      throw new InternalServerErrorException(
        'SNS did not return a MessageId for the published SMS',
      );
    }

    this.logger.log(
      `SMS published to ${dto.phoneNumber} (MessageId=${output.MessageId})`,
    );

    return { messageId: output.MessageId };
  }
}
