import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import matter from 'gray-matter';
import _ from 'lodash';

export type Skill = {
  name: string;
  description: string;
  location?: string;
  content?: string;
};

function getSkillsDir(): string {
  return path.join(homedir(), '.agents', 'skills');
}

// 只有name和description
export function loadSkills(skillNames?: string[]) {
  const skillList: Skill[] = [];
  const skillsDir = getSkillsDir();
  const files = loadSkillFiles(skillsDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseSkill(content);
    // 为空就是全部
    if (_.isEmpty(skillNames) || skillNames.includes(parsed?.name ?? '')) {
      skillList.push(parsed);
    }
  }
  return skillList;
}

export function loadSkill(name: string) {
  const skillsDir = getSkillsDir();
  const files = loadSkillFiles(skillsDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseSkill(content);
    if (parsed?.name === name) {
      const skill = parseSkillWithContent(content);
      if (skill) {
        return {
          content: skill.content,
          location: filePath,
        };
      }
    }
  }
  throw new Error(`Skill not found: ${name}`);
}

function loadSkillFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      if (!entry.name.startsWith('.')) {
        files.push(...loadSkillFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      files.push(fullPath);
    }
  }

  return files;
}

function parseSkill(content: string) {
  const parsed = matter(content);
  const data = parsed.data;

  if (!data.name) {
    return null;
  }

  return {
    name: data.name,
    description: data.description || '',
  };
}

function parseSkillWithContent(content: string) {
  const parsed = matter(content);
  const data = parsed.data;

  if (!data.name) {
    return null;
  }

  return {
    name: data.name,
    description: data.description || '',
    content: parsed.content.trim(),
  };
}
