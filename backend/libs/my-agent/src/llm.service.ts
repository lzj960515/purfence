import { createVertex } from '@ai-sdk/google-vertex';
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { openai } from '@ai-sdk/openai';
import { Injectable } from '@nestjs/common';
import { HttpsProxyAgent } from 'hpagent';
import { CodexModel, KimiModel, MyModel, OpenAIModel } from './model';
import { ZhipuModel } from './model/zhipu.model';
import { ModelOptions, Providers } from './types';

function getProxyGoogleAuthOptions() {
  const proxy = process.env.GOOGLE_AUTH_HTTPS_PROXY;
  if (proxy) {
    const agent = new HttpsProxyAgent({ proxy });
    return {
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      clientOptions: {
        transporterOptions: { agent },
      },
    };
  }
}

function buildVertexAnthropicBaseUrl(project: string, location: string) {
  // `https://${location === 'global' ? '' : location + '-'}aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/anthropic/models`
  const baseUrl = process.env.ANTHROPIC_VERTEX_BASE_URL;
  if (baseUrl) {
    return `${baseUrl}/projects/${project}/locations/${location}/publishers/anthropic/models`;
  }
}

const vertexAnthropic = createVertexAnthropic({
  project: 'pietra-ai',
  location: 'global',
  googleAuthOptions: getProxyGoogleAuthOptions(),
  baseURL: buildVertexAnthropicBaseUrl('pietra-ai', 'global'),
});

function buildVertexBaseUrl(project: string, location: string) {
  // https://aiplatform.googleapis.com/v1beta1/projects/pietra-ai/locations/global/publishers/google/models/gemini-3-pro-preview1:streamGenerateContent?alt=sse
  const baseUrl = process.env.VERTEX_BASE_URL;
  if (baseUrl) {
    return `${baseUrl}/projects/${project}/locations/${location}/publishers/google`;
  }
}

const vertex = createVertex({
  project: 'pietra-ai',
  location: 'global',
  googleAuthOptions: getProxyGoogleAuthOptions(),
  baseURL: buildVertexBaseUrl('pietra-ai', 'us-central1'),
});

@Injectable()
export class LlmService {
  private normalizeModelOptions(
    modelOptions?: ModelOptions | ModelOptions['model'],
  ): ModelOptions {
    if (modelOptions == null) return {};
    if (typeof modelOptions === 'string') return { model: modelOptions };
    return modelOptions;
  }

  get(modelOptions?: ModelOptions | ModelOptions['model']): MyModel {
    const normalized = this.normalizeModelOptions(modelOptions);

    let instance: MyModel;
    switch (normalized.model) {
      case 'codex':
        instance = new CodexModel(normalized);
        break;
      case 'openai':
      case 'gpt-5':
      case 'gpt-5-mini':
        instance = new OpenAIModel(normalized);
        break;
      case 'kimi':
        instance = new KimiModel(normalized);
        break;
      case 'claude-sonnet-4-5':
      default:
        instance = new ZhipuModel(normalized);
        break;
    }
    return instance;
  }

  getModel(modelOptions?: ModelOptions | ModelOptions['model']) {
    return this.get(modelOptions).model();
  }

  getProviderByModel(model?: string): Providers {
    switch (model) {
      case 'codex':
      case 'openai':
      case 'gpt-5-mini':
      case 'gpt-5':
        return 'openai';
      case 'gemini':
      case 'gemini-3-pro-preview':
        return 'gemini';
      case 'claude-sonnet-4-5':
      default:
        return 'anthropic';
    }
  }

  getTokenLimit(modelOptions?: ModelOptions | ModelOptions['model']): number {
    return this.get(modelOptions).tokenLimit();
  }

  getHeaders(
    modelOptions?: ModelOptions | ModelOptions['model'],
  ): Record<string, string> {
    return this.get(modelOptions).headers();
  }

  // async countTokens(model?: ModelOptions['model'], text: string) {
  //   const model = this.getModel(model);
  //   const tokens = await model.countTokens(text);
  //   return tokens;
  // }

  createAnthropicTool<T>(fn: (tools: typeof vertexAnthropic.tools) => T) {
    return fn(vertexAnthropic.tools);
  }

  createOpenaiTool<T>(fn: (tools: typeof openai.tools) => T) {
    return fn(openai.tools);
  }

  createGeminiTool<T>(fn: (tools: typeof vertex.tools) => T) {
    return fn(vertex.tools);
  }
}
