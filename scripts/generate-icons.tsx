import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

const STAR_PATH =
  "M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.7z";

const ICON = (
  <div
    style={{
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F7F3EC",
    }}
  >
    <div
      style={{
        height: "82%",
        width: "82%",
        borderRadius: "22%",
        background: "#4F9DDE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="58%" height="58%" viewBox="0 0 24 24">
        <path d={STAR_PATH} fill="#E8A93B" />
      </svg>
    </div>
  </div>
);

async function main() {
  for (const size of [192, 512]) {
    const response = new ImageResponse(ICON, { width: size, height: size });
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(`public/icons/icon-${size}.png`, buffer);
    console.log(`wrote public/icons/icon-${size}.png`);
  }
}

main();
