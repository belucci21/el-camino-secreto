import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { seoConfig } from "../src/config/seo";

describe("delivered social preview", () => {
  it("serves the exact lightweight JPEG approved for sharing", () => {
    const artwork = readFileSync(`public${seoConfig.image}`);
    expect(artwork.length).toBeLessThan(500_000);
    expect(createHash("sha256").update(artwork).digest("hex")).toBe("e5374bc56bad3f039b2f5c3e9c71aa54600c79430287b3dd57ea736796285200");
    expect(seoConfig.description).not.toContain("Coming Soon");
  });
  it("uses one source for Open Graph and Twitter", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).not.toContain("og-v2.png");
    expect(layout.match(/seoConfig.image\b/g)).toHaveLength(2);
  });
});
