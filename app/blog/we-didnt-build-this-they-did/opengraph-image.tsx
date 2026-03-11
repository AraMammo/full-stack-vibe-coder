import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "We Didn't Build This. They Did. — A tribute to the OG coders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0A0A0A",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(255,92,53,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Decorative colored bars on left — representing 11 people */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 140,
            width: 4,
            height: 350,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {["#FF5C35", "#00C4A0", "#9b5de5", "#22C55E", "#F59E0B", "#FF5C35", "#00C4A0", "#9b5de5", "#22C55E", "#F59E0B", "#FF5C35"].map(
            (color, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 24,
                  backgroundColor: color,
                  borderRadius: 2,
                }}
              />
            )
          )}
        </div>

        {/* Category */}
        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: "#9A9A96",
            marginBottom: 24,
            fontWeight: 500,
          }}
        >
          Culture & Craft
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#F0F0EE",
            lineHeight: 1.05,
            textAlign: "center" as const,
            maxWidth: 900,
            marginBottom: 8,
          }}
        >
          We Didn&apos;t Build This.
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#FF5C35",
            lineHeight: 1.05,
            textAlign: "center" as const,
            marginBottom: 32,
          }}
        >
          They Did.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "#9A9A96",
            textAlign: "center" as const,
            maxWidth: 700,
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          A debt letter to the punks, obsessives, and builders who stayed up all
          night so the rest of us could sleep through the stack.
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            fontSize: 16,
          }}
        >
          <span style={{ color: "#9A9A96", fontWeight: 300, letterSpacing: "0.04em" }}>
            Full Stack
          </span>
          <span style={{ color: "#FF5C35", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Vibe Coder
          </span>
          <span style={{ color: "#555552", marginLeft: 8 }}>
            by Ara Mamourian
          </span>
        </div>

        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 60,
            height: 60,
            borderTop: "2px solid #FF5C35",
            borderLeft: "2px solid #FF5C35",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 30,
            width: 60,
            height: 60,
            borderBottom: "2px solid #00C4A0",
            borderRight: "2px solid #00C4A0",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
