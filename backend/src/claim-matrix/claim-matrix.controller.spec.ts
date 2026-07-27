import { Test, TestingModule } from '@nestjs/testing';
import { ClaimMatrixController } from './claim-matrix.controller';

describe('ClaimMatrixController', () => {
  let controller: ClaimMatrixController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimMatrixController],
    }).compile();

    controller = module.get<ClaimMatrixController>(ClaimMatrixController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
