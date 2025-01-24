import { Test, TestingModule } from '@nestjs/testing';
import { DisplayNameGeneratorService } from './display-name-generator.service';

describe('DisplayNameGeneratorService', () => {
  let service: DisplayNameGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisplayNameGeneratorService],
    }).compile();

    service = module.get<DisplayNameGeneratorService>(
      DisplayNameGeneratorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
