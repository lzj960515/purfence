import { Test, TestingModule } from '@nestjs/testing';
import { ProviderFactoryService } from './provider-factory.service';
import { ProviderConfigService } from './provider-config.service';
import { ProviderType } from '../types/provider-type.enum';

describe('ProviderFactoryService', () => {
  let service: ProviderFactoryService;
  let providerConfigService: jest.Mocked<ProviderConfigService>;

  beforeEach(async () => {
    const mockProviderConfigService = {
      getActiveConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderFactoryService,
        {
          provide: ProviderConfigService,
          useValue: mockProviderConfigService,
        },
      ],
    }).compile();

    service = module.get<ProviderFactoryService>(ProviderFactoryService);
    providerConfigService = module.get(ProviderConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOpenAICompatible', () => {
    it('should create OpenAI-compatible client with config', async () => {
      const mockConfig = {
        apiKey: 'test-api-key',
        baseUrl: 'https://api.example.com',
        model: 'gpt-4',
      };

      providerConfigService.getActiveConfig.mockResolvedValue(mockConfig);

      const result = await service.createOpenAICompatible(ProviderType.KIMI);

      expect(result).toBeDefined();
      expect(providerConfigService.getActiveConfig).toHaveBeenCalledWith(ProviderType.KIMI);
    });

    it('should create model instance when modelId is provided', async () => {
      const mockConfig = {
        apiKey: 'test-api-key',
        baseUrl: 'https://api.example.com',
        model: 'gpt-4',
      };

      providerConfigService.getActiveConfig.mockResolvedValue(mockConfig);

      const result = await service.createOpenAICompatible(ProviderType.KIMI, 'kimi-k2-0905-preview');

      expect(result).toBeDefined();
    });
  });

  describe('createKimi', () => {
    it('should create Kimi client with default model', async () => {
      const mockConfig = {
        apiKey: 'kimi-api-key',
        baseUrl: 'https://api.moonshot.ai/v1',
        model: 'moonshot-v1-8k',
      };

      providerConfigService.getActiveConfig.mockResolvedValue(mockConfig);

      const result = await service.createKimi();

      expect(result).toBeDefined();
      expect(providerConfigService.getActiveConfig).toHaveBeenCalledWith(ProviderType.KIMI);
    });

    it('should create Kimi client with custom model', async () => {
      const mockConfig = {
        apiKey: 'kimi-api-key',
        baseUrl: 'https://api.moonshot.ai/v1',
        model: 'moonshot-v1-8k',
      };

      providerConfigService.getActiveConfig.mockResolvedValue(mockConfig);

      const result = await service.createKimi('custom-model');

      expect(result).toBeDefined();
    });
  });

  describe('createZhipu', () => {
    it('should create Zhipu client with default model', async () => {
      const mockConfig = {
        apiKey: 'zhipu-api-key',
        baseUrl: 'https://open.bigmodel.cn/api/anthropic/v1',
        model: 'glm-4',
      };

      providerConfigService.getActiveConfig.mockResolvedValue(mockConfig);

      const result = await service.createZhipu();

      expect(result).toBeDefined();
      expect(providerConfigService.getActiveConfig).toHaveBeenCalledWith(ProviderType.ZHIPU);
    });

    it('should create Zhipu client with custom model', async () => {
      const mockConfig = {
        apiKey: 'zhipu-api-key',
        baseUrl: 'https://open.bigmodel.cn/api/anthropic/v1',
        model: 'glm-4',
      };

      providerConfigService.getActiveConfig.mockResolvedValue(mockConfig);

      const result = await service.createZhipu('custom-model');

      expect(result).toBeDefined();
    });
  });
});
