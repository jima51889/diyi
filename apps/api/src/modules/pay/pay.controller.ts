import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pay')
@Controller('pay')
export class PayController {
  @Post('callback')
  callback() {
    return { success: true };
  }
}
