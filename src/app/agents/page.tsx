import AgentMatrix from '@/components/AgentMatrix';
import Link from 'next/link';

export const metadata = {
  title: 'AI Agents & Ecosystems — Top Tech Tools',
  description: 'Living matrix of AI coding agents, their latest versions, supported models, and full extensibility surfaces (MCP, hooks, skills, plugins, REST). The team\'s reference for the agent landscape.',
};

export default function AgentsPage() {
  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 8,
          }}
        >
          AI Agent Landscape
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Agents, Models &amp; Ecosystems
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 720, fontSize: 14, lineHeight: 1.5 }}>
          The definitive, frequently updated view of the major AI coding agents and CLIs — with deep focus on how they plug into larger systems via MCP, hooks, skills, plugins, and REST APIs.
          This is where we track versions, model support, and real ecosystem fit.
        </p>
        <div style={{ marginTop: 12, fontSize: 12 }}>
          <Link href="https://github.com/rohitg00/agentmemory" target="_blank" className="underline" style={{ color: 'var(--accent)' }}>
            See the canonical agentmemory compatibility matrix →
          </Link>
        </div>
      </div>

      <AgentMatrix />

      {/* MCP Ecosystem – full stack visibility */}
      <div style={{ marginTop: 56 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
            Full Ecosystem
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Our MCP Servers &amp; Connected Tools
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 620, marginTop: 4 }}>
            Agents that support MCP (or hooks/plugins) can share the same powerful backend services. Here’s the current stack these agents can plug into.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { name: 'cortanha', desc: 'Memory, topics, channels, graph search, vault publishing. Core team brain + coordination layer.', badge: 'Memory + Coordination' },
            { name: 'agentmemory', desc: 'Shared long-term memory server. Works with any hook/MCP/REST capable agent.', badge: 'Cross-agent Memory' },
            { name: 'n8n', desc: 'Workflow automation. Trigger agents from events, chain tools, notifications.', badge: 'Workflows' },
            { name: 'linear', desc: 'Issue tracking + project management. Create, update, comment on issues from agents.', badge: 'Issues & Projects' },
            { name: 'qmd', desc: 'Hybrid lexical + vector search over 6k+ team markdown docs (cortanha, vault-work, etc.).', badge: 'Knowledge Search' },
            { name: 'neon', desc: 'Serverless Postgres. Schema compare, migrations, query tuning, branching.', badge: 'Database' },
            { name: 'context-mode', desc: 'Persistent FTS5 knowledge base, context compression, indexing for large sessions.', badge: 'Context Management' },
            { name: 'tolaria', desc: 'Note-taking and vault operations. Create, search, highlight across personal + team notes.', badge: 'Notes & Vault' },
          ].map((mcp, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{mcp.name}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 3 }}>{mcp.badge}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{mcp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Also see the broader curated tool directory in <Link href="/explore">Explore</Link> (many of these agents are also present as individual tool entries with stars, activity, and discovery signals).
          For foundation model details, the team also maintains references in related projects.
        </p>
      </div>
    </div>
  );
}
