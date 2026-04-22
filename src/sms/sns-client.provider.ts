import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient } from '@aws-sdk/client-sns';

export const SNS_CLIENT = Symbol('SNS_CLIENT');

export const snsClientProvider: Provider = {
  provide: SNS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): SNSClient => {
    const region = config.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');

    // When credentials are not explicitly provided, the SDK will use the
    // default credential provider chain (env vars, shared ini, IAM role, etc.).
    if (accessKeyId && secretAccessKey) {
      return new SNSClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }

    return new SNSClient({ region });
  },
};
