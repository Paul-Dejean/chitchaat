import { Test, TestingModule } from '@nestjs/testing';
import { WsExceptionFilter } from './ws-exception-filter';

describe('WsExceptionFilter', () => {
  let provider: WsExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsExceptionFilter],
    }).compile();

    provider = module.get<WsExceptionFilter>(WsExceptionFilter);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
