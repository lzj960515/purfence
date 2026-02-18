import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import matter from 'gray-matter';

export interface AgentFrontmatter {
  name: string;
  description: string;
  model?: string;
  mode?: string;
  tools?: string;
}

/** 获取 agents 根目录 */
function getAgentsDir(): string {
  return path.join(homedir(), '.claude', 'agents');
}

/** 递归收集目录下所有 .md 文件 */
function collectAgentFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      // 跳过隐藏目录
      if (!entry.name.startsWith('.')) {
        files.push(...collectAgentFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/** 解析 agent 文件，返回 frontmatter 和 content */
function parseAgentFile(content: string): {
  data: AgentFrontmatter;
  content: string;
} | null {
  const parsed = matter(content);
  const data = parsed.data as Partial<AgentFrontmatter>;

  if (!data.name) {
    return null;
  }

  return {
    data: {
      name: data.name,
      description: data.description || '',
      model: data.model,
      mode: data.mode,
      tools: data.tools,
    },
    content: parsed.content.trim(),
  };
}

/** 读取并解析所有 primary agents */
export function loadPrimaryAgents(): AgentFrontmatter[] {
  const agentsDir = getAgentsDir();
  const files = collectAgentFiles(agentsDir);
  const agents: AgentFrontmatter[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseAgentFile(content);

    if (parsed?.data.mode === 'primary' && parsed.data.description) {
      // 清理 description 中的换行，转为单行
      parsed.data.description = parsed.data.description
        .replace(/\n\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      agents.push(parsed.data);
    }
  }

  return agents;
}

/** 根据 name 获取 agent 的完整 prompt（body 部分） */
export function getAgentPrompt(name: string): string {
  const agentsDir = getAgentsDir();
  const files = collectAgentFiles(agentsDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseAgentFile(content);

    if (parsed?.data.name === name) {
      return parsed.content;
    }
  }

  throw new Error(`Agent not found: ${name}`);
}

/** 根据 name 获取 agent 的 frontmatter */
export function getAgentFrontmatter(name: string): AgentFrontmatter | null {
  const agentsDir = getAgentsDir();
  const files = collectAgentFiles(agentsDir);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseAgentFile(content);

    if (parsed?.data.name === name) {
      return parsed.data;
    }
  }

  return null;
}

/** 格式化 agents 为字符串列表 */
export function formatAgentsList(agents: AgentFrontmatter[]): string {
  if (agents.length === 0) {
    return '- (No primary agents found)';
  }
  return agents
    .map((agent) => `- ${agent.name}: ${agent.description}`)
    .join('\n');
}
