import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { seoConfig } from "../src/config/seo";

describe("delivered social preview", () => {
  it("references the new artwork with its actual dimensions", () => {
    const png = readFileSync(`public${seoConfig.image}`);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(seoConfig.imageWidth);
    expect(png.readUInt32BE(20)).toBe(seoConfig.imageHeight);
    expect(seoConfig.description).not.toContain("Coming Soon");
  });
  it("uses one source for Open Graph and Twitter", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).not.toContain("og-v2.png");
    expect(layout.match(/seoConfig.image\b/g)).toHaveLength(2);
  });
});
