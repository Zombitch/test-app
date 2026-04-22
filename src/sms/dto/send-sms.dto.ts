import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SendSmsDto {
  // E.164 format: + followed by 8 to 15 digits
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phoneNumber must be in E.164 format (e.g. +14155552671)',
  })
  phoneNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1600)
  message!: string;

  @IsOptional()
  @IsIn(['Promotional', 'Transactional'])
  smsType?: 'Promotional' | 'Transactional';

  @IsOptional()
  @IsString()
  @MaxLength(11)
  senderId?: string;
}
