import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EthersService } from './ether.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, EthersService],
})
export class AppModule {}
