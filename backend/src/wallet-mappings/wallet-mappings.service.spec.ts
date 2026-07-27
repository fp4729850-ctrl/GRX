import { Test, TestingModule } from '@nestjs/testing';
import { WalletMappingsService } from './wallet-mappings.service';

describe('WalletMappingsService', () => {
  let service: WalletMappingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletMappingsService],
    }).compile();

    service = module.get<WalletMappingsService>(WalletMappingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
