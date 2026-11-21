import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/toolbox/qr-code-generator", "/toolbox/wend", "/stamp"].map((path) => ({
    url: `https://mihaplemenitas.com${path}`,
    lastModified: new Date(),
  }));
}
