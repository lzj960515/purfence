import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { registerAs } from '@nestjs/config';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function schemaOutputPath() {
  const appId = 'com.purfence.desktop';

  // Prefer a writable, stable path in Desktop builds.
  if (process.platform === 'darwin') {
    const dir = path.join(os.homedir(), 'Library', 'Application Support', appId);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'schema.graphql');
  }

  if (process.platform === 'win32') {
    const base = process.env.APPDATA || os.homedir();
    const dir = path.join(base, appId);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'schema.graphql');
  }

  // linux and others
  const dir = path.join(os.homedir(), '.local', 'share', appId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'schema.graphql');
}

export default registerAs('graphql', () => {
  return {
    buildSchemaOptions: {
      numberScalarMode: 'integer',
      dateScalarMode: 'isoDate',
      fieldMiddleware: [],
    },
    autoSchemaFile: { path: schemaOutputPath(), federation: 2 },
    context: ({ req, res }) => ({ req, res }),
    playground: false,
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
  } satisfies ApolloDriverConfig;
});
