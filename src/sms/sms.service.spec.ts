import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SmsService } from './sms.service';
import { SNS_CLIENT } from './sns-client.provider';

describe('SmsService', () => {
  let service: SmsService;
  let snsSend: jest.Mock;

  beforeEach(async () => {
    snsSend = jest.fn();
    const snsMock = { send: snsSend } as unknown as SNSClient;

    const configMock: Partial<ConfigService> = {
      get: jest.fn((key: string, def?: unknown) => {
        if (key === 'SNS_SMS_TYPE') return def ?? 'Transactional';
        if (key === 'SNS_SENDER_ID') return undefined;
        return def;
      }) as ConfigService['get'],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: SNS_CLIENT, useValue: snsMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get(SmsService);
  });

  it('publishes an SMS through SNS and returns the MessageId', async () => {
    snsSend.mockResolvedValueOnce({ MessageId: 'abc-123' });

    const result = await service.send({
      phoneNumber: '+14155552671',
      message: 'hello',
    });

    expect(result).toEqual({ messageId: 'abc-123' });
    expect(snsSend).toHaveBeenCalledTimes(1);

    const command = snsSend.mock.calls[0][0] as PublishCommand;
    expect(command).toBeInstanceOf(PublishCommand);
    expect(command.input.PhoneNumber).toBe('+14155552671');
    expect(command.input.Message).toBe('hello');
    expect(command.input.MessageAttributes?.['AWS.SNS.SMS.SMSType']).toEqual({
      DataType: 'String',
      StringValue: 'Transactional',
    });
  });

  it('includes the SenderID attribute when provided', async () => {
    snsSend.mockResolvedValueOnce({ MessageId: 'mid' });

    await service.send({
      phoneNumber: '+14155552671',
      message: 'hi',
      senderId: 'MyApp',
      smsType: 'Promotional',
    });

    const command = snsSend.mock.calls[0][0] as PublishCommand;
    expect(command.input.MessageAttributes?.['AWS.SNS.SMS.SenderID']).toEqual({
      DataType: 'String',
      StringValue: 'MyApp',
    });
    expect(command.input.MessageAttributes?.['AWS.SNS.SMS.SMSType']).toEqual({
      DataType: 'String',
      StringValue: 'Promotional',
    });
  });

  it('wraps SNS errors in InternalServerErrorException', async () => {
    snsSend.mockRejectedValueOnce(new Error('boom'));

    await expect(
      service.send({ phoneNumber: '+14155552671', message: 'hi' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws when SNS returns no MessageId', async () => {
    snsSend.mockResolvedValueOnce({});

    await expect(
      service.send({ phoneNumber: '+14155552671', message: 'hi' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
