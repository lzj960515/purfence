import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormBiConfig from '@src/common/configs/typeorm-ai.config';
import ms from 'ms';
import { KnowledgeBaseAttachment } from '../src/types';
import { MyAgentModule } from '../src/my-agent.module';
import { VectorStoreService } from '../src/vector-store.service';

const logger = new Logger();

jest.setTimeout(ms('5min'));

describe('VectorStoreService', () => {
  let module: TestingModule;
  let service: VectorStoreService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(typeormBiConfig),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
      ],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    service = module.get<VectorStoreService>(VectorStoreService);
  });

  describe('indexKnowledgeBase', () => {
    const attachments: KnowledgeBaseAttachment[] = [
      {
        name: 'iflow-cli',
        resource: 'https://github.com/iflow-ai/iflow-cli',
        resourceType: 'web',
        description: 'A test document for indexing',
      },
      {
        name: 'create-pdfs-from-text-image',
        resource:
          'https://learndownload.adobe.com/pub/learn/acrobat/create-pdfs-from-text-image.zip',
        resourceType: 'pdf',
        description: 'A test document for indexing',
      },
      {
        name: 'sample-multilingual-text',
        resource:
          'https://disk.sample.cat/samples/pdf/sample-multilingual-text.pdf',
        resourceType: 'pdf',
        description: 'A test document for indexing',
      },
    ];

    it('add', async () => {
      await service.indexKnowledgeBase('test', 'test-ns', attachments);
    });

    it('delete', async () => {
      await service.indexKnowledgeBase('test', 'test-ns', [], attachments);
    });

    afterEach(async () => {
      const result = await service.similaritySearch(
        { indexName: 'test', namespace: 'test-ns' },
        'test',
      );
      logger.log(
        `Search results after operation: ${result.length} items found.`,
      );
      logger.log(JSON.stringify(result, null, 2));
    });
  });
});
