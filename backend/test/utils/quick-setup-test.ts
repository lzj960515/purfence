import { createTestGraphqlClient } from './create-test-graphql-client';
import { createTestModule } from './create-test-module';

export async function quickSetupTest() {
  const module = await createTestModule();
  const app = module.createNestApplication();
  await app.init();

  const client = createTestGraphqlClient(app);

  return [app, client] as const;
}
