import { Controller, Post, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EthersService } from './ether.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ethersService: EthersService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('withdraw')
 async withdraw(): Promise<any>  {
    return await this.ethersService.withdraw();
  }
}
