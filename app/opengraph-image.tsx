import { ImageResponse } from "next/og";

export const alt = "Apipana Tennis Society";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #110c1d 0%, #1a1230 100%)",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: "#d4e157",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 22,
                left: 16,
                width: 48,
                height: 24,
                borderTop: "5px solid #ebb039",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 22,
                left: 16,
                width: 48,
                height: 24,
                borderBottom: "5px solid #ebb039",
                borderRadius: "50%",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#ebb039",
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Apipana Tennis Society
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              color: "#f8fafc",
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            Vuestra pista.
          </div>
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              color: "#ebb039",
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            Vuestro pique.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            fontWeight: 600,
            color: "#cbd5e1",
          }}
        >
          <div>Liga · Copa · Crónicas</div>
          <div
            style={{
              padding: "12px 28px",
              borderRadius: 999,
              background: "#ebb039",
              color: "#110c1d",
              fontWeight: 900,
              fontSize: 24,
            }}
          >
            apipana.tennis
          </div>
        </div>
      </div>
    ),
    size,
  );
}
