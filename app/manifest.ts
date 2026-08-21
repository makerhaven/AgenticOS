import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agentic OS",
    short_name: "Agentic OS",
    description: "One screen, every agent, one shared brain.",
    start_url: "/control",
    display: "standalone",
    background_color: "#15101a",
    theme_color: "#15101a",
    icons: [
      {
        src: "/control/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
