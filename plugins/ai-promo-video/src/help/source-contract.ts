import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HelpEntry } from './catalog.js';

const templateDirectory = fileURLToPath(new URL('../../assets/revideo-template/', import.meta.url));
const templateFiles = [
  'motion-library.tsx',
  'scene-tree.ts',
  'kinetic.ts',
  'captions.tsx',
  'format.tsx',
  'ambient.ts',
  'transitions.ts',
  'camera.ts',
  'procedural.tsx',
  'vector-motion.ts',
  'three-effects.ts',
  'optical-glass.tsx',
  'liquid-glass-text.tsx',
] as const;

export interface SourceApiContract {
  exportName: string;
  sourceFile?: string;
  typeDeclaration?: string;
  callSignature?: string;
  note?: string;
}

let sourceCache: Promise<Array<{file: string; source: string}>> | undefined;

async function templateSources() {
  sourceCache ??= Promise.all(templateFiles.map(async (file) => ({
    file,
    source: await readFile(join(templateDirectory, file), 'utf8'),
  })));
  return sourceCache;
}

function balancedBlock(source: string, start: number): string | undefined {
  const open = source.indexOf('{', start);
  if (open < 0) return undefined;
  let depth = 0;
  let quote: string | undefined;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1).trim();
    }
  }
  return undefined;
}

function functionSignature(source: string, start: number): string | undefined {
  const openingParenthesis = source.indexOf('(', start);
  if (openingParenthesis < 0) return undefined;
  let parentheses = 0;
  let braces = 0;
  let brackets = 0;
  let quote: string | undefined;
  let escaped = false;
  for (let index = openingParenthesis; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '(') parentheses += 1;
    else if (character === ')') parentheses -= 1;
    else if (character === '{') braces += 1;
    else if (character === '}') braces -= 1;
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets -= 1;
    if (parentheses === 0 && braces === 0 && brackets === 0 && character === ')') {
      const bodyStart = source.indexOf('{', index + 1);
      if (bodyStart < 0) return source.slice(start, index + 1).trim();
      return `${source.slice(start, bodyStart).trim()} { … }`;
    }
  }
  return undefined;
}

function nearestTypeDeclaration(source: string, before: number): string | undefined {
  const declarations = [...source.slice(0, before).matchAll(/export interface\s+[A-Za-z0-9_]+[^\n{]*\{|export type\s+[A-Za-z0-9_]+\s*=[^;]+;/g)];
  const match = declarations.at(-1);
  if (!match || match.index === undefined) return undefined;
  if (match[0].startsWith('export type')) return match[0].trim();
  return balancedBlock(source, match.index);
}

function extractFromSource(source: string, file: string, exportName: string): SourceApiContract | undefined {
  const escapedName = exportName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const functionMatch = new RegExp(`export function\\*?\\s+${escapedName}(?:\\s*<[^>{}]*>)?\\s*\\(`).exec(source);
  if (functionMatch?.index !== undefined) {
    return {
      exportName,
      sourceFile: file,
      typeDeclaration: nearestTypeDeclaration(source, functionMatch.index),
      callSignature: functionSignature(source, functionMatch.index),
      note: 'The type declaration and call signature are extracted from the exact scaffold source shipped with this version. Defaults shown in a destructured signature are runtime defaults.',
    };
  }

  const constMatch = new RegExp(`export const\\s+${escapedName}\\b[^;]*;`).exec(source);
  if (constMatch) return {exportName, sourceFile: file, callSignature: constMatch[0].trim()};
  return undefined;
}

export async function sourceApiContracts(exportNames: string[]): Promise<SourceApiContract[]> {
  const sources = await templateSources();
  return Promise.all(exportNames.map(async (exportName) => {
    for (const {file, source} of sources) {
      const contract = extractFromSource(source, file, exportName);
      if (contract) return contract;
    }
    return {
      exportName,
      note: 'This catalog entry describes a composition recipe or custom escape hatch rather than one directly exported scaffold helper. Use the conceptual parameters and author the implementation in scene.tsx.',
    };
  }));
}

export async function attachSourceContracts<T extends {mode?: string; help?: HelpEntry}>(result: T): Promise<T> {
  if (result.mode !== 'detail' || !result.help?.sourceExports?.length) return result;
  return {
    ...result,
    help: {
      ...result.help,
      sourceContracts: await sourceApiContracts(result.help.sourceExports),
    },
  };
}
