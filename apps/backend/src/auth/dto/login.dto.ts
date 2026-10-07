import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dortiz' })
  @IsString()
  @Length(1, 50)
  @Matches(/^[^\u0000-\u001f\u007f]+$/)
  username!: string;

  @ApiProperty({ format: 'password', writeOnly: true })
  @IsString()
  @Length(1, 255)
  password!: string;
}
