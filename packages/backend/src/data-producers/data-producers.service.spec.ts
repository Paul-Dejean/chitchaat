import { Test, TestingModule } from '@nestjs/testing';
import { DataProducersService } from './data-producers.service';

describe('DataProducersService', () => {
  let service: DataProducersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataProducersService],
    }).compile();

    service = module.get<DataProducersService>(DataProducersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
