"use client";

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  borderRadius: "4px",
};

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div style={{ ...shimmerStyle, ...style }} />;
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <Skeleton style={{ height: "20px", width: "128px" }} />
        <Skeleton style={{ height: "20px", width: "60px" }} />
      </div>
      <Skeleton style={{ height: "14px", width: "100%", marginBottom: "6px" }} />
      <Skeleton style={{ height: "14px", width: "80%", marginBottom: "16px" }} />
      <Skeleton style={{ height: "20px", width: "160px" }} />
    </div>
  );
}
