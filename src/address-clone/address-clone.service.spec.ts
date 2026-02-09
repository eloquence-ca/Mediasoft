import { Test, TestingModule } from '@nestjs/testing';
import { AddressCloneService } from './address-clone.service';

describe('AddressService', () => {
  let service: AddressCloneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressCloneService],
    }).compile();

    service = module.get<AddressCloneService>(AddressCloneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
