import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/work", "/toolbox", "/toolbox/qr-code-generator", "/toolbox/wend"].map((path) => ({
    url: `https://mihaplemenitas.com${path}`,
    lastModified: new Date(),
  }));
}
