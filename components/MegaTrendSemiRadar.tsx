"use client";

import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import type { SectorDataset } from "@/lib/data";
import { clsx } from "clsx";

export type MegaTrendSemiRadarProps = {
  data: SectorDataset;
  width?: number;
  height?: number;
};

const STAGE_COLOR: Record<string, string> = {
  Early: "#60a5fa", // blue-400
  Seed: "#34d399", // emerald-400
  SeriesA: "#f59e0b", // amber-500
  SeriesB: "#ef4444", // red-500
  SeriesC: "#a855f7", // violet-500
};

export function MegaTrendSemiRadar({ data, width = 900, height = 520 }: MegaTrendSemiRadarProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const arcs = useMemo(() => {
    const total = d3.sum(data.megaTrends, (m) => m.aggregateScore);
    const pie = d3
      .pie<{ name: string; aggregateScore: number }>()
      .sort(null)
      .value((d) => d.aggregateScore)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);
    return pie(data.megaTrends.map((m) => ({ name: m.name, aggregateScore: m.aggregateScore })));
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${padding.left + innerWidth / 2}, ${padding.top + innerHeight})`);

    const outerRadius = Math.min(innerWidth, innerHeight * 2) / 2 - 12;
    const innerRadius = outerRadius * 0.55;
    const arcGen = d3.arc<d3.PieArcDatum<{ name: string; aggregateScore: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(6)
      .padAngle(0.008);

    // Draw background semi-ring
    g.append("path")
      .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(-Math.PI/2).endAngle(Math.PI/2) as any)
      .attr("fill", "#ffffff0a");

    // Color scale for arcs
    const color = d3.scaleOrdinal<string, string>()
      .domain(data.megaTrends.map((m) => m.name))
      .range(["#6ee7b7", "#93c5fd", "#fca5a5", "#fcd34d", "#c4b5fd", "#f9a8d4"]);

    // Arcs
    const arcG = g.append("g");
    arcG
      .selectAll("path.arc")
      .data(arcs)
      .enter()
      .append("path")
      .attr("class", "arc")
      .attr("d", arcGen as any)
      .attr("fill", (d) => color(d.data.name))
      .attr("opacity", 0.9)
      .append("title")
      .text((d) => `${d.data.name}: ${(d.value ?? 0).toFixed(2)}`);

    // Labels on outer arc
    const labelG = g.append("g");
    labelG
      .selectAll("text")
      .data(arcs)
      .enter()
      .append("text")
      .attr("fill", "#e6ecff")
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .attr("text-anchor", "middle")
      .attr("transform", (d) => {
        const [x, y] = d3.arc().innerRadius(outerRadius + 12).outerRadius(outerRadius + 12).centroid(d);
        return `translate(${x},${y})`;
      })
      .text((d) => d.data.name);

    // Subtrends: plot as bubbles within each arc
    const maxBubble = 22;
    const minBubble = 6;

    const subG = g.append("g");
    data.megaTrends.forEach((m, idx) => {
      const pieArc = arcs[idx];
      const a0 = pieArc.startAngle;
      const a1 = pieArc.endAngle;
      if (!isFinite(a0) || !isFinite(a1)) return;

      // Spread subtrends across the arc angle
      const angleScale = d3.scaleLinear().domain([0, Math.max(1, m.subTrends.length - 1)]).range([a0 + 0.02, a1 - 0.02]);

      // Radius based on maturity within ring
      const radiusScale = d3.scaleLinear().domain([0, 1]).range([innerRadius + 6, outerRadius - 6]);

      // Bubble size based on importance (normalized per sector data)
      const maxImportance = d3.max(data.megaTrends.flatMap((mt) => mt.subTrends.map((s) => s.importance))) ?? 1;
      const sizeScale = d3
        .scaleSqrt()
        .domain([0, maxImportance])
        .range([minBubble, maxBubble]);

      // Jitter to reduce collisions
      const jitter = d3.randomNormal.source(d3.randomLcg(42 + idx))(0, 0.02);

      m.subTrends.forEach((s, i) => {
        const angle = angleScale(Math.min(i, m.subTrends.length - 1)) + jitter();
        const r = radiusScale(s.maturity);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const bubble = sizeScale(s.importance);

        const fill = STAGE_COLOR[s.fundingStage];

        const node = subG
          .append("g")
          .attr("transform", `translate(${x},${y})`)
          .attr("cursor", "pointer");

        node
          .append("circle")
          .attr("r", bubble)
          .attr("fill", fill)
          .attr("fill-opacity", 0.9)
          .attr("stroke", "#0b1020")
          .attr("stroke-width", 1.2)
          .on("mouseenter", (ev) => {
            const tt = tooltipRef.current;
            if (!tt) return;
            tt.style.opacity = "1";
            tt.innerHTML = `<div class=\"text-sm\"><div class=\"font-semibold\">${s.name}</div>
              <div class=\"opacity-80\">M?ga-tendance: ${m.name}</div>
              <div>Maturit?: ${(s.maturity * 100).toFixed(0)}%</div>
              <div>Startups: ${s.numStartups}</div>
              <div>Stade: ${stageLabel(s.fundingStage)}</div>
            </div>`;
          })
          .on("mousemove", (ev: any) => {
            const tt = tooltipRef.current;
            if (!tt) return;
            const rect = (svgRef.current as SVGSVGElement).getBoundingClientRect();
            tt.style.left = `${ev.clientX - rect.left + 12}px`;
            tt.style.top = `${ev.clientY - rect.top - 12}px`;
          })
          .on("mouseleave", () => {
            const tt = tooltipRef.current;
            if (tt) tt.style.opacity = "0";
          });

        node
          .append("text")
          .attr("y", bubble + 12)
          .attr("text-anchor", "middle")
          .attr("fill", "#c7d2fe")
          .attr("font-size", 10)
          .text(s.shortLabel ?? s.name);
      });
    });

    // Radial gridlines for reference
    const gridG = g.append("g");
    const rings = [0.25, 0.5, 0.75, 1];
    rings.forEach((t) => {
      gridG
        .append("path")
        .attr("d", d3.arc().innerRadius(innerRadius + (outerRadius - innerRadius) * t).outerRadius(innerRadius + (outerRadius - innerRadius) * t).startAngle(-Math.PI/2).endAngle(Math.PI/2) as any)
        .attr("stroke", "#ffffff15")
        .attr("fill", "none");

      gridG
        .append("text")
        .attr("x", 0)
        .attr("y", - (innerRadius + (outerRadius - innerRadius) * t) - 4)
        .attr("text-anchor", "middle")
        .attr("fill", "#9fb0d6")
        .attr("font-size", 10)
        .text(`${Math.round(t * 100)}% maturit?`);
    });
  }, [arcs, data, height, width]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} />
      <div
        ref={tooltipRef}
        className={clsx(
          "pointer-events-none absolute -translate-x-1/2 -translate-y-full",
          "bg-white/90 text-black rounded px-2 py-1 shadow-lg border border-black/10",
        )}
        style={{ opacity: 0 }}
      />
    </div>
  );
}

function stageLabel(s: string) {
  switch (s) {
    case "Early":
      return "Early stage";
    case "Seed":
      return "Seed";
    case "SeriesA":
      return "S?rie A";
    case "SeriesB":
      return "S?rie B";
    case "SeriesC":
      return "S?rie C";
    default:
      return s;
  }
}
