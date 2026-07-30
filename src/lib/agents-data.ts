/**
 * AGENT ECOSYSTEM MATRIX — Source of Truth for top-tech-tools
 *
 * This file powers the /agents page and any embedded AgentMatrix views.
 * Goal: Make this site the canonical, *living* reference for the AI agent / coding
 * tool landscape, with special emphasis on full ecosystems (MCP, hooks, skills,
 * plugins, REST, native integrations) and the models + versions each agent supports.
 *
 * Update frequently. When a new major version drops (Claude Code, Cursor, Aider,
 * new MCP features, new foundation models with agentic strengths), edit here.
 *
 * Inspiration / cross-reference:
 *   https://github.com/rohitg00/agentmemory  (the compatibility matrix that lists
 *   which agents support hooks / MCP / REST / plugins / skills)
 *
 * Our philosophy:
 * - One place the team trusts for "what's the latest, what does it actually integrate with,
 *   and which models does it shine with right now?"
 * - MCP is a first-class citizen (we run many MCP servers: cortanha, agentmemory,
 *   linear, n8n, qmd, neon, context-mode, tolaria, etc.).
 * - Hooks count, skills/plugins, and native vs server distinctions matter.
 *
 * Maintenance tips:
 * - Prefer official release notes, GitHub releases, and the agent's own docs.
 * - For model support, note the primary/recommended ones + any special agentic features.
 * - Add "teamNotes" when we have real usage (e.g. "Primary driver for our Claude Code + 8+ MCP setup").
 */

export interface AgentIntegration {
  mcp?: 'native' | 'server' | 'via-plugin' | 'connect' | false;
  hooks?: number | string; // e.g. 12 or "22 hooks"
  skills?: boolean | string;
  plugins?: boolean | string;
  rest?: boolean | string;
  native?: boolean | string;
  other?: string;
}

export interface SupportedModel {
  name: string;
  version?: string;
  notes?: string;
}

export interface AgentEntry {
  id: string;
  name: string;
  emoji: string;
  org: string;
  latestVersion: string;
  website: string;
  integrations: AgentIntegration;
  models: SupportedModel[];
  description: string;
  teamNotes?: string;
  links?: {
    github?: string;
    docs?: string;
  };
  /** If this agent has a corresponding entry in the main tools catalog, link to it */
  toolSlug?: string;
}

export const AGENTS: AgentEntry[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    emoji: '🟣',
    org: 'Anthropic',
    latestVersion: 'v1.x (latest)',
    website: 'https://claude.ai/code',
    integrations: {
      mcp: 'native',
      hooks: 12,
      plugins: true,
      native: true,
    },
    models: [
      { name: 'Claude 4 Opus / Sonnet', version: 'latest', notes: 'Primary frontier models for agentic coding' },
      { name: 'Claude 3.5/3.7 Sonnet', notes: 'Excellent balance of speed + reasoning' },
    ],
    description: 'Anthropic\'s agentic CLI and IDE companion. Reads repos, edits, runs tests, proposes PRs.',
    teamNotes: 'Heavy internal usage. Primary interface for many engineers + full MCP server ecosystem.',
    links: { docs: 'https://docs.anthropic.com/en/docs/claude-code' },
    toolSlug: 'claude-code',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    emoji: '🖱️',
    org: 'Cursor AI',
    latestVersion: '0.50+ / latest',
    website: 'https://cursor.com',
    integrations: {
      mcp: 'server',
      skills: true,
      plugins: 'VS Code extensions + custom',
      native: true,
    },
    models: [
      { name: 'Claude 4 / 3.5 Sonnet', notes: 'Default strong choice for edits' },
      { name: 'GPT-4.1 / o-series', notes: 'Available as alternate composer models' },
      { name: 'Gemini 2.5 Pro', notes: 'Long context option' },
    ],
    description: 'AI-first code editor (VS Code fork) with composer, multi-file edits, and deep codebase understanding.',
    teamNotes: 'Many team members use as daily driver alongside Claude Code.',
    toolSlug: 'cursor',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    emoji: '🏄',
    org: 'Codeium',
    latestVersion: 'latest',
    website: 'https://windsurf.com',
    integrations: {
      mcp: 'server',
      native: true,
    },
    models: [
      { name: 'Codeium models + Claude / GPT fallbacks', notes: 'Strong autocomplete + agent Cascade' },
    ],
    description: 'Codeium\'s agentic IDE with Cascade — autonomous multi-step planning and execution.',
    toolSlug: 'windsurf',
  },
  {
    id: 'github-copilot-cli',
    name: 'GitHub Copilot CLI',
    emoji: '🐙',
    org: 'GitHub',
    latestVersion: 'latest',
    website: 'https://github.com/github/copilot-cli',
    integrations: {
      mcp: 'via-plugin',
      skills: true,
      plugins: 'hooks/skills',
    },
    models: [
      { name: 'GPT-4.1 + Claude via Copilot', notes: 'Backed by GitHub\'s model routing' },
    ],
    description: 'Terminal-based Copilot with natural language to shell/commands + in-editor agentic features.',
    toolSlug: 'github-copilot',
  },
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    emoji: '🔷',
    org: 'OpenAI',
    latestVersion: 'latest',
    website: 'https://github.com/openai/codex',
    integrations: {
      mcp: 'native',
      hooks: 6,
      plugins: true,
    },
    models: [
      { name: 'o3 / GPT-4.1 / o4-mini', notes: 'Strong reasoning and codegen' },
    ],
    description: 'OpenAI\'s official CLI agent for local codebase interaction and task execution.',
  },
  {
    id: 'aider',
    name: 'Aider',
    emoji: '🛠️',
    org: 'Aider',
    latestVersion: 'latest',
    website: 'https://aider.chat',
    integrations: {
      rest: 'API-driven',
    },
    models: [
      { name: 'Claude 4 / Sonnet', notes: 'Best-in-class for Aider' },
      { name: 'GPT-4.1 / o-series', notes: 'Excellent results' },
      { name: 'DeepSeek R1 / V3', notes: 'Strong open-source option' },
    ],
    description: 'Terminal pair programmer. Edits local git repos via chat. Extremely popular for fast iteration.',
    toolSlug: 'aider',
  },
  {
    id: 'cline',
    name: 'Cline',
    emoji: '🔌',
    org: 'Cline',
    latestVersion: 'latest',
    website: 'https://cline.ai',
    integrations: {
      mcp: 'server',
    },
    models: [
      { name: 'Claude 4 / 3.5 Sonnet', notes: 'Primary recommendation' },
    ],
    description: 'VS Code extension focused on agentic workflows with strong MCP support.',
  },
  {
    id: 'roo-code',
    name: 'Roo Code',
    emoji: '🦘',
    org: 'Roo Code',
    latestVersion: 'latest',
    website: 'https://roo.dev',
    integrations: {
      mcp: 'server',
    },
    models: [
      { name: 'Claude + others via OpenRouter / direct', notes: 'Flexible model routing' },
    ],
    description: 'Agentic coding companion with deep tool use and MCP integration.',
  },
  {
    id: 'goose',
    name: 'Goose',
    emoji: '🪿',
    org: 'Block',
    latestVersion: 'latest',
    website: 'https://github.com/block/goose',
    integrations: {
      mcp: 'server',
    },
    models: [
      { name: 'Multiple (Claude, OpenAI, local)', notes: 'Extensible backend' },
    ],
    description: 'Open-source AI agent by Block with strong tool-calling and MCP story.',
  },
  {
    id: 'open-code',
    name: 'OpenCode',
    emoji: '🔓',
    org: 'OpenCode',
    latestVersion: 'latest',
    website: 'https://opencode.ai',
    integrations: {
      mcp: 'native',
      hooks: '22 hooks',
      plugins: true,
    },
    models: [
      { name: 'Claude / GPT / local models', notes: 'Broad support' },
    ],
    description: 'Highly extensible open agent framework with rich hook and plugin surface.',
  },
  {
    id: 'warp',
    name: 'Warp',
    emoji: '🚀',
    org: 'Warp',
    latestVersion: 'latest',
    website: 'https://www.warp.dev',
    integrations: {
      mcp: 'connect',
      skills: true,
    },
    models: [
      { name: 'Multiple via Warp AI + external', notes: 'Terminal + AI superpowers' },
    ],
    description: 'AI-native terminal with collaborative features, workflows, and MCP/skills connections.',
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    emoji: '🔵',
    org: 'Google',
    latestVersion: 'latest',
    website: 'https://ai.google.dev/gemini-api/docs/cli',
    integrations: {
      mcp: 'server',
    },
    models: [
      { name: 'Gemini 2.5 Pro / Flash', notes: 'Best long-context + coding in the Gemini line' },
    ],
    description: 'Official Google Gemini command-line agent experience with strong context windows.',
  },
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    emoji: '🖥️',
    org: 'Anthropic',
    latestVersion: 'latest',
    website: 'https://claude.ai',
    integrations: {
      mcp: 'server',
    },
    models: [
      { name: 'Claude 4 family', notes: 'Full desktop app with tool use' },
    ],
    description: 'Desktop application for Claude with MCP server support for local tools and data.',
  },
  // Additional notable ones from the broader landscape (easy to extend)
  {
    id: 'kilo-code',
    name: 'Kilo Code',
    emoji: '🧮',
    org: 'Kilo Code',
    latestVersion: 'latest',
    website: 'https://kilocode.ai',
    integrations: {
      mcp: 'server',
    },
    models: [
      { name: 'Claude + multiple via providers', notes: 'MCP-first design' },
    ],
    description: 'MCP-centric coding agent focused on reliable tool use and workflows.',
  },
];

export const AGENT_MATRIX_UPDATED = '2026-06 (living document — edit liberally)';

// Convenience helper for consumers
export function getAgentsWithMCP() {
  return AGENTS.filter(a => a.integrations.mcp);
}

export function getAllIntegrationTypes() {
  // For building filter chips dynamically if desired
  return ['mcp', 'hooks', 'skills', 'plugins', 'rest'] as const;
}
