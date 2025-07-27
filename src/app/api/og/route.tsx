import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 40,
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {/* Icon/Logo */}
          <div
            style={{
              fontSize: 80,
              marginBottom: 20,
            }}
          >
            🧹
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Wallet Sweep
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: 24,
              opacity: 0.8,
              textAlign: "center",
              maxWidth: "80%",
            }}
          >
            Batch sell multiple tokens in one transaction
          </div>
          
          {/* Network Badge */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 40,
              background: "rgba(255, 255, 255, 0.1)",
              padding: "8px 20px",
              borderRadius: 20,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#0052FF",
              }}
            />
            Base
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 800, // 3:2 aspect ratio
      }
    );
  } catch (e) {
    console.error("Failed to generate OG image:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}