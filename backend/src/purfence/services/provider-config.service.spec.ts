import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProviderConfigService } from './provider-config.service';
import { ModelProviderConfigService } from '../model-provider-config/model-provider-config.service';
import { ProviderType } from '../types/provider-type.enum';

describe('ProviderConfigService', () => {
  let service: ProviderConfigService;
  let configService: jest.Mocked<ConfigService>;
  let modelProviderConfigService: jest.Mocked<ModelProviderConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockModelProviderConfigService = {
      getActiveProviderConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ModelProviderConfigService,
          useValue: mockModelProviderConfigService,
        },
      ],
    }).compile();

    service = module.get<ProviderConfigService>(ProviderConfigService);
    configService = module.get(ConfigService);
    modelProviderConfigService = module.get(ModelProviderConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveConfig', () => {
    it('should return database config when available', async () => {
      const dbConfig = {
        apiKey: 'db-api-key',
        baseUrl: 'https://db.example.com',
        model: 'gpt-4',
      };

      modelProviderConfigService.getActiveProviderConfig.mockResolvedValue(
        dbConfig,
      );

      const result = await service.getActiveConfig(ProviderType.OPENAI);

      expect(result).toEqual(dbConfig);
      expect(
        modelProviderConfigService.getActiveProviderConfig,
      ).toHaveBeenCalledWith(ProviderType.OPENAI);
    });

    it('should fallback to environment variables when no database config exists', async () => {
      modelProviderConfigService.getActiveProviderConfig.mockResolvedValue(
        null,
      );

      configService.get.mockImplementation((key: string) => {
        const envVars: Record<string, string> = {
          OPENAI_API_KEY: 'env-api-key',
          OPENAI_BASE_URL: 'https://env.example.com',
        };
        return envVars[key] || '';
      });

      const result = await service.getActiveConfig(ProviderType.OPENAI);

      expect(result).toEqual({
        apiKey: 'env-api-key',
        baseUrl: 'https://env.example.com',
        model: 'gpt-4',
      });
    });

    it('should use default base URL when not in environment variables', async () => {
      modelProviderConfigService.getActiveProviderConfig.mockResolvedValue(
        null,
      );

      configService.get.mockImplementation((key: string) => {
        const envVars: Record<string, string> = {
          KIMI_API_KEY: 'kimi-api-key',
        };
        return envVars[key] || '';
      });

      const result = await service.getActiveConfig(ProviderType.KIMI);

      expect(result.baseUrl).toBe('https://api.moonshot.ai/v1');
      expect(result.model).toBe('moonshot-v1-8k');
    });

    it('should use Zhipu default values', async () => {
      modelProviderConfigService.getActiveProviderConfig.mockResolvedValue(
        null,
      );

      configService.get.mockImplementation((key: string) => {
        const envVars: Record<string, string> = {
          ZHIPU_API_KEY: 'zhipu-api-key',
        };
        return envVars[key] || '';
      });

      const result = await service.getActiveConfig(ProviderType.ZHIPU);

      expect(result.baseUrl).toBe('https://open.bigmodel.cn/api/anthropic/v1');
      expect(result.model).toBe('glm-4');
    });

    it('should throw error for unknown provider', async () => {
      modelProviderConfigService.getActiveProviderConfig.mockResolvedValue(
        null,
      );

      configService.get.mockReturnValue('');

      await expect(
        service.getActiveConfig('unknown' as ProviderType),
      ).rejects.toThrow('Unknown provider');
    });
  });
});
