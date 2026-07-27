import { Test, TestingModule } from '@nestjs/testing';
import { ClaimMatrixService } from './claim-matrix.service';

describe('ClaimMatrixService', () => {
  let service: ClaimMatrixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaimMatrixService],
    }).compile();

    service = module.get<ClaimMatrixService>(ClaimMatrixService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
