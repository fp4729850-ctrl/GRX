import { Test, TestingModule } from '@nestjs/testing';
import { WalletMappingsController } from './wallet-mappings.controller';

describe('WalletMappingsController', () => {
  let controller: WalletMappingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletMappingsController],
    }).compile();

    controller = module.get<WalletMappingsController>(WalletMappingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
