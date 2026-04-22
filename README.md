# NestJS SNS SMS

A NestJS application that sends SMS messages through Amazon SNS using the AWS SDK v3.

## Requirements

- Node.js 20+
- An AWS account with permission to call `sns:Publish`
- AWS credentials with `sns:Publish` permission (via access keys, IAM role, or the default AWS credential chain)
- SMS sending must be enabled in your target AWS region. Some destination phone numbers may require you to move out of the SNS SMS sandbox.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and fill in your AWS credentials / region
```

## Run

```bash
# dev (watch mode)
npm run start:dev

# production build
npm run build
npm run start:prod
```

The server listens on `PORT` (default `3000`).

## Send an SMS

`POST /sms/send`

Body:

| Field         | Type     | Required | Notes                                                                 |
|---------------|----------|----------|-----------------------------------------------------------------------|
| `phoneNumber` | string   | yes      | E.164 format, e.g. `+14155552671`                                     |
| `message`     | string   | yes      | 1 - 1600 characters                                                   |
| `smsType`     | enum     | no       | `Promotional` (default) or `Transactional`. Overrides `SNS_SMS_TYPE`. |
| `senderId`    | string   | no       | Alphanumeric sender ID (supported countries only). Overrides env.     |

Example:

```bash
curl -X POST http://localhost:3000/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+14155552671",
    "message": "Hello from NestJS + SNS",
    "smsType": "Transactional"
  }'
```

Response:

```json
{ "messageId": "abc-123-..." }
```

## Project structure

```
src/
  main.ts               # bootstraps Nest, enables global validation
  app.module.ts         # root module wires config + SMS
  sms/
    sms.module.ts
    sms.controller.ts   # POST /sms/send
    sms.service.ts      # builds and issues the SNS PublishCommand
    sns-client.provider.ts  # SNSClient injection token + factory
    dto/send-sms.dto.ts
    sms.service.spec.ts
```

## Testing

```bash
npm test
```

The service spec stubs the `SNSClient`, so the tests do not call AWS.
