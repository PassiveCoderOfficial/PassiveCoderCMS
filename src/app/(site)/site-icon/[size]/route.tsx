import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { installableSite } from "@/modules/registry/food-delivery/store";

/**
 * App icon for an installable restaurant site, made from its logo on a white
 * tile with the brand colour around it. A logo that isn't PNG/JPEG (or can't
 * be fetched) falls back to the first letter of the name.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = (await params).size === "192" ? 192 : 512;
  const site = await installableSite((await headers()).get("x-tenant-id"));
  if (!site) return new Response("Not found", { status: 404 });

  let logo: string | null = null;
  if (site.logo) {
    try {
      const res = await fetch(site.logo, { signal: AbortSignal.timeout(4000) });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && /image\/(png|jpe?g)/.test(type)) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 2_000_000) logo = `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
      }
    } catch {
      logo = null;
    }
  }

  const pad = Math.round(size * 0.12);
  const inner = size - pad * 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: site.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: inner, height: inner, background: "#ffffff", borderRadius: Math.round(size * 0.18), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {logo
            // eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og
            ? <img src={logo} alt="" style={{ width: inner * 0.8, height: inner * 0.8, objectFit: "contain" }} />
            : <span style={{ fontSize: Math.round(inner * 0.55), fontWeight: 700, color: site.color }}>{site.name.trim().charAt(0).toUpperCase() || "R"}</span>}
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
