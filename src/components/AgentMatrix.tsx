'use client';

import React, { useState } from 'react';
import { AGENTS, type AgentEntry } from '@/lib/agents-data';
import Link from 'next/link';

/**
 * AgentMatrix
 * Rich, maintainable view of the AI coding agent landscape + ecosystem integrations.
 * Designed to live alongside (and complement) the existing Tool cards / explore experience.
 *
 * Matches top-tech-tools aesthetic: clean cards, subtle borders, monospace touches for versions,
 * colored integration badges, easy scanning.
 */

interface FilterState {
  query: string;
  onlyMCP: boolean;
  onlyWithHooks: boolean;
}

function IntegrationBadges({ integrations }: { integrations: AgentEntry['integrations'] }) {
  const badges: React.ReactNode[] = [];

  if (integrations.mcp) {
    badges.push(
      <span key="mcp" className="agent-badge agent-badge-green" title="MCP support">
        {`MCP (${integrations.mcp})`}
      </span>
    );
  }
  if (integrations.hooks) {
    badges.push(
      <span key="hooks" className="agent-badge agent-badge-purple" title="Hooks / extensibility points">
        {typeof integrations.hooks === 'number' ? `${integrations.hooks} hooks` : integrations.hooks}
      </span>
    );
  }
  if (integrations.skills) {
    const label = typeof integrations.skills === 'string' ? integrations.skills : 'Skills';
    badges.push(<span key="skills" className="agent-badge agent-badge-blue">{label}</span>);
  }
  if (integrations.plugins) {
    const label = typeof integrations.plugins === 'string' ? integrations.plugins : 'Plugins';
    badges.push(<span key="plugins" className="agent-badge agent-badge-amber">{label}</span>);
  }
  if (integrations.rest) {
    badges.push(<span key="rest" className="agent-badge agent-badge-slate">REST API</span>);
  }
  if (integrations.native) {
    const label = typeof integrations.native === 'string' ? integrations.native : 'Native';
    badges.push(<span key="native" className="agent-badge agent-badge-emerald">{label}</span>);
  }
  if (integrations.other) {
    badges.push(<span key="other" className="agent-badge agent-badge-slate">{integrations.other}</span>);
  }

  if (badges.length === 0) {
    return <span className="text-[10px] text-[var(--text-muted)]">—</span>;
  }

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}

function ModelPills({ models }: { models: AgentEntry['models'] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {models.map((m, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
          title={m.notes}
        >
          {m.name}
          {m.version && <span className="ml-1 opacity-60">({m.version})</span>}
        </span>
      ))}
    </div>
  );
}

export default function AgentMatrix() {
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    onlyMCP: false,
    onlyWithHooks: false,
  });

  const filtered = AGENTS.filter((agent) => {
    const q = filters.query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      agent.name.toLowerCase().includes(q) ||
      agent.org.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q) ||
      agent.models.some((m) => m.name.toLowerCase().includes(q));

    const matchesMCP = !filters.onlyMCP || !!agent.integrations.mcp;
    const matchesHooks = !filters.onlyWithHooks || !!agent.integrations.hooks;

    return matchesQuery && matchesMCP && matchesHooks;
  });

  return (
    <div className="space-y-6">
      {/* Intro + call to action for maintenance */}
      <div className="prose prose-sm max-w-none text-[var(--text-secondary)]">
        <p>
          A living matrix of the major AI coding agents and CLIs, with emphasis on <strong>extensibility surfaces</strong> (MCP, hooks, skills, plugins, REST) and the models they currently excel with.
        </p>
        <p className="text-xs">
          Inspired by the excellent compatibility overview at{' '}
          <a href="https://github.com/rohitg00/agentmemory" target="_blank" rel="noopener noreferrer" className="underline">
            github.com/rohitg00/agentmemory
          </a>
          . All agents that support hooks, MCP, or REST can share the same memory servers, tool ecosystems, and workflows.
          <br />
          <strong>Keep this page current</strong> — edit <code>src/lib/agents-data.ts</code> when versions, model support, or integration capabilities change.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter agents or models (e.g. claude, mcp, cursor, gemini...)"
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          className="flex-1 min-w-[240px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.onlyMCP}
            onChange={(e) => setFilters((f) => ({ ...f, onlyMCP: e.target.checked }))}
          />
          <span>MCP only</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.onlyWithHooks}
            onChange={(e) => setFilters((f) => ({ ...f, onlyWithHooks: e.target.checked }))}
          />
          <span>Has hooks</span>
        </label>

        <div className="ml-auto text-xs text-[var(--text-muted)]">
          {filtered.length} / {AGENTS.length} agents
        </div>
      </div>

      {/* Matrix */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-[var(--text-muted)] py-8 text-center">
            No agents match the current filters.
          </div>
        )}

        {filtered.map((agent) => (
          <div
            key={agent.id}
            className="group agent-matrix-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl leading-none mt-0.5">{agent.emoji}</div>
                <div>
                  <div className="font-semibold text-[15px] tracking-[-0.01em] text-[var(--text-primary)]">
                    {agent.name}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{agent.org}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-[11px] text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)] inline-block">
                  {agent.latestVersion}
                </div>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-snug mb-3 line-clamp-2">
              {agent.description}
            </p>

            {/* Integrations — the heart of the request */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)] mb-1.5">
                Extensibility
              </div>
              <IntegrationBadges integrations={agent.integrations} />
            </div>

            {/* Models */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)] mb-1.5">
                Strong model support
              </div>
              <ModelPills models={agent.models} />
            </div>

            {/* Team notes + links */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs">
              {agent.teamNotes ? (
                <span className="text-[var(--accent)]/90">★ {agent.teamNotes}</span>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-3">
                {agent.toolSlug && (
                  <Link
                    href={`/tool/${agent.toolSlug}`}
                    className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    View in catalog →
                  </Link>
                )}
                <a
                  href={agent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1"
                >
                  Site <span aria-hidden>↗</span>
                </a>
                {agent.links?.docs && (
                  <a
                    href={agent.links.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Docs
                  </a>
                )}
                {agent.links?.github && (
                  <a
                    href={agent.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-[var(--text-muted)] pt-2">
        Data lives in <code className="font-mono">src/lib/agents-data.ts</code>. PRs and quick edits welcome — this is meant to stay accurate.
        See also the broader tool catalog under <Link href="/explore" className="underline">Explore</Link>.
      </div>
    </div>
  );
}

// Badge styles live in globals.css (agent-badge-*) so they are SSR-friendly and consistent
// with the rest of the Top Tech Tools design system.
