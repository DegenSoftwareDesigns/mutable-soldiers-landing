"use client";

import { useEffect, useMemo, useState } from "react";

const viewports = [
  { id: "mobile", label: "Mobile · 390×844", width: 390, height: 844, device: "mobile" },
  { id: "mobile-compact", label: "Mobile compact · 360×800", width: 360, height: 800, device: "mobile" },
  { id: "tablet", label: "Tablet · 768×1024", width: 768, height: 1024, device: "tablet" },
  { id: "tablet-large", label: "Tablet large · 1024×1366", width: 1024, height: 1366, device: "tablet" },
  { id: "mobile-landscape", label: "Mobile landscape · 844×390", width: 844, height: 390, device: "mobile" },
  { id: "tablet-landscape", label: "Tablet landscape · 1024×768", width: 1024, height: 768, device: "tablet" },
] as const;

const chapters = [
  ["hero", "Hero"],
  ["two-paths", "Two Paths"],
  ["first-drop", "First Drop"],
  ["classes", "Classes"],
  ["rarities", "Rarities"],
  ["artists", "Artists"],
  ["final", "Final CTA"],
  ["footer", "Footer"],
] as const;

export function ResponsivePreviewWorkbench() {
  const [viewportId, setViewportId] = useState<(typeof viewports)[number]["id"]>("mobile");
  const [chapter, setChapter] = useState<(typeof chapters)[number][0]>("hero");
  const [skeleton, setSkeleton] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [scale, setScale] = useState(1);
  const [replay, setReplay] = useState(0);
  const viewport = viewports.find((item) => item.id === viewportId) ?? viewports[0];

  useEffect(() => {
    setScale(viewport.width > 900 ? 0.55 : viewport.width > 600 ? 0.7 : 1);
  }, [viewport.width]);

  const src = useMemo(() => {
    const params = new URLSearchParams({
      experiencePreview: "1",
      device: viewport.device,
      chapter,
      skeleton: skeleton ? "1" : "0",
      overlay: overlay ? "1" : "0",
      replay: String(replay),
    });
    return `/?${params.toString()}`;
  }, [chapter, overlay, replay, skeleton, viewport.device]);

  return (
    <main className="responsive-preview-workbench">
      <header className="responsive-preview-toolbar">
        <div className="responsive-preview-toolbar__title">
          <span>Mutable Soldiers</span>
          <h1>Responsive skeleton preview</h1>
        </div>

        <label>
          Viewport
          <select
            value={viewportId}
            onChange={(event) =>
              setViewportId(event.target.value as (typeof viewports)[number]["id"])
            }
          >
            {viewports.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Chapter
          <select
            value={chapter}
            onChange={(event) =>
              setChapter(event.target.value as (typeof chapters)[number][0])
            }
          >
            {chapters.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Scale
          <select
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          >
            <option value={0.5}>50%</option>
            <option value={0.55}>55%</option>
            <option value={0.7}>70%</option>
            <option value={0.85}>85%</option>
            <option value={1}>100%</option>
          </select>
        </label>

        <label className="responsive-preview-toggle">
          <input
            type="checkbox"
            checked={skeleton}
            onChange={(event) => setSkeleton(event.target.checked)}
          />
          Skeleton assets
        </label>

        <label className="responsive-preview-toggle">
          <input
            type="checkbox"
            checked={overlay}
            onChange={(event) => setOverlay(event.target.checked)}
          />
          Diagnostics
        </label>

        <button type="button" onClick={() => setReplay((value) => value + 1)}>
          Replay loader
        </button>
      </header>

      <section className="responsive-preview-canvas" aria-label="Device preview">
        <div className="responsive-preview-meta">
          <strong>{viewport.label}</strong>
          <span>
            {viewport.width >= viewport.height ? "Landscape" : "Portrait"} · actual CSS viewport
          </span>
        </div>
        <div
          className="responsive-preview-frame-shell"
          style={{
            width: viewport.width * scale,
            height: viewport.height * scale,
          }}
        >
          <iframe
            key={src}
            className="responsive-preview-frame"
            src={src}
            title={`${viewport.label} ${chapter} preview`}
            style={{
              width: viewport.width,
              height: viewport.height,
              transform: `scale(${scale})`,
            }}
          />
        </div>
      </section>
    </main>
  );
}
