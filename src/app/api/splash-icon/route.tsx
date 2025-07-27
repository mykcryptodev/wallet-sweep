import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#1a1a1a",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: 100,
            }}
          >
            🧹
          </div>
        </div>
      ),
      {
        width: 200,
        height: 200,
      }
    );
  } catch (e) {
    console.error("Failed to generate splash icon:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}