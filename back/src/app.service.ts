import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    console.log('content');
  }
}
