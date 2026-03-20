import { getAllCategories } from "@/lib/queries/tools";
import { Link2, ArrowRight, ShieldCheck } from "lucide-react";

export default async function SubmitPage() {
  const categories = await getAllCategories();

  return (
    <div style={{ padding: "48px 40px 80px", maxWidth: "1100px" }}>
      {/* Hero */}
      <div style={{ marginBottom: "48px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            marginBottom: "12px",
            lineHeight: 1.1,
          }}
        >
          Forge the Ecosystem
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "520px" }}>
          We curate tools that embody technical excellence and operational speed.
          Submit your CLI tool, library, or shell environment to join the architect&apos;s arsenal.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "40px" }}>
        {/* Form */}
        <form style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Field label="Tool Name">
            <input
              type="text"
              placeholder="e.g. NeoVim, Starship, Exa"
              style={inputStyle}
            />
          </Field>

          <Field label="GitHub Repository URL">
            <div style={{ position: "relative" }}>
              <Link2
                size={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="url"
                placeholder="https://github.com/username/repository"
                style={{ ...inputStyle, paddingLeft: "36px" }}
              />
            </div>
          </Field>

          <Field label="Category">
            <select
              style={{
                ...inputStyle,
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              <option value="">Select a functional category</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Detailed Description">
            <textarea
              placeholder="Explain the core problem this tool solves and its unique advantages."
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field label="Tags (Comma Separated)">
            <input
              type="text"
              placeholder="rust, performance, cli, docker"
              style={inputStyle}
            />
          </Field>

          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "16px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "opacity 0.15s",
              width: "100%",
            }}
          >
            Submit Tool
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Guidelines card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <ShieldCheck size={16} color="var(--accent)" />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                Submission Guidelines
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                {
                  n: "01",
                  title: "Open Source Core",
                  desc: "Tools must be accessible via public repositories with clear licensing.",
                },
                {
                  n: "02",
                  title: "Performance First",
                  desc: "We prioritize tools written in memory-safe, high-performance languages like Rust, Go, or Zig.",
                },
                {
                  n: "03",
                  title: "UX Precision",
                  desc: "A good CLI tool has intuitive flags, readable output, and robust error handling.",
                },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ display: "flex", gap: "12px" }}>
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      background: "var(--accent-dim)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    {n}
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px" }}>
                      {title}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Elite community card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "10px",
              }}
            >
              Elite Community
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              Accepted submissions are featured on our homepage and shared with over 50,000 systems architects.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Avatar stack */}
              {["#6366f1", "#4f83ff", "#22c55e", "#f59e0b"].map((bg, i) => (
                <div
                  key={i}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: bg,
                    border: "2px solid var(--surface)",
                    marginLeft: i > 0 ? "-8px" : 0,
                    flexShrink: 0,
                  }}
                />
              ))}
              <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 500, marginLeft: "4px" }}>
                +12k
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};
