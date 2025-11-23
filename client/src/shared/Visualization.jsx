import React, { useEffect, useRef } from "react";
import API from "../api";
import * as d3 from "d3";

function clearNode(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

export default function Visualization() {
  const ageRef = useRef(null);
  const stationsRef = useRef(null);
  const reportsRef = useRef(null);
  const [activeTab, setActiveTab] = React.useState("age");
  const [data, setData] = React.useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await API.get("/admin/visualization");
        if (!mounted) return;
        setData(res.data || {});
      } catch (err) {
        console.error("Visualization load failed:", err);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Re-render the current tab when data or activeTab changes
  useEffect(() => {
    if (!data) return;
    if (activeTab === "age") {
      renderAgeHistogram(ageRef.current, data.usersAgeBuckets || []);
    }
    if (activeTab === "stations") {
      renderStationsBar(stationsRef.current, data.stationsBikeCounts || []);
    }
    if (activeTab === "reports") {
      renderReportsDonut(reportsRef.current, data.reports || { counts: [], total: 0 });
    }
  }, [data, activeTab]);

  return (
    <div className="card">
      <h3>Admin Visualization</h3>
      <div className="chart-tabs">
        <div className="tab-list">
          <button
            className={`btn ${activeTab === "age" ? "secondary" : "ghost"}`}
            onClick={() => setActiveTab("age")}
          >
            Age buckets
          </button>
          <button
            className={`btn ${activeTab === "stations" ? "secondary" : "ghost"}`}
            onClick={() => setActiveTab("stations")}
          >
            Stations
          </button>
          <button
            className={`btn ${activeTab === "reports" ? "secondary" : "ghost"}`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </button>
        </div>

        <div className="chart-grid">
          <div className="chart-item" style={{ display: activeTab === "age" ? "block" : "none" }}>
            <h4>Users: Age buckets</h4>
            <div ref={ageRef} className="viz-chart" />
          </div>

          <div className="chart-item" style={{ display: activeTab === "stations" ? "block" : "none" }}>
            <h4>Stations: Available / Capacity</h4>
            <div ref={stationsRef} className="viz-chart" />
          </div>

          <div className="chart-item" style={{ display: activeTab === "reports" ? "block" : "none" }}>
            <h4>Reports: Resolved vs Processing</h4>
            <div ref={reportsRef} className="viz-chart" />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderAgeHistogram(container, data) {
  clearNode(container);
  const margin = { top: 20, right: 12, bottom: 30, left: 36 };
  const width = Math.max(360, (container?.clientWidth || 800) - margin.left - margin.right);
  const height = 220 - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Ensure consistent ordering with 'unknown' last
  const parsed = data.map((d) => ({ bucket: d.bucket, count: d.count }));
  const sorted = parsed.sort((a, b) => {
    if (a.bucket === "unknown") return 1;
    if (b.bucket === "unknown") return -1;
    const aStart = Number(a.bucket.split("-")[0]);
    const bStart = Number(b.bucket.split("-")[0]);
    return aStart - bStart;
  });

  const x = d3.scaleBand().domain(sorted.map((d) => d.bucket)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(sorted, (d) => d.count) || 1]).nice().range([height, 0]);

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-size", "12px");

  svg.append("g").call(d3.axisLeft(y).ticks(4));

  svg
    .selectAll("rect")
    .data(sorted)
    .join("rect")
    .attr("x", (d) => x(d.bucket))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", "#4f46e5");
}

function renderStationsBar(container, data) {
  clearNode(container);
  const margin = { top: 10, right: 10, bottom: 80, left: 50 };
  const width = Math.max(360, (container?.clientWidth || 800) - margin.left - margin.right);
  const height = 260 - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const names = data.map((d) => d.name);
  const x = d3.scaleBand().domain(names).range([0, width]).padding(0.2);
  const maxY = d3.max(data, (d) => Math.max(d.available, d.capacity)) || 1;
  const y = d3.scaleLinear().domain([0, maxY]).range([height, 0]);

  // capacity bars (light)
  svg
    .selectAll(".capacity")
    .data(data)
    .join("rect")
    .attr("class", "capacity")
    .attr("x", (d) => x(d.name))
    .attr("y", (d) => y(d.capacity))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.capacity))
    .attr("fill", "#e6e7ff");

  // available bars (on top)
  svg
    .selectAll(".available")
    .data(data)
    .join("rect")
    .attr("class", "available")
    .attr("x", (d) => x(d.name))
    .attr("y", (d) => y(d.available))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.available))
    .attr("fill", "#10b981");

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end")
    .style("font-size", "12px");

  svg.append("g").call(d3.axisLeft(y).ticks(5));
}

function renderReportsDonut(container, reports) {
  clearNode(container);
  const counts = (reports.counts || []).map((r) => ({ status: r.status, count: r.count }));
  const width = Math.max(280, (container?.clientWidth || 400));
  const height = 220;
  const radius = Math.min(width, height) / 2 - 10;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const color = d3.scaleOrdinal(["#f97316", "#06b6d4", "#60a5fa", "#a78bfa"]);

  const pie = d3.pie().value((d) => d.count);
  const data_ready = pie(counts);

  const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);

  svg
    .selectAll("path")
    .data(data_ready)
    .join("path")
    .attr("d", arc)
    .attr("fill", (d, i) => color(i))
    .attr("stroke", "#fff")
    .style("stroke-width", "1px");

  // legend
  const legend = svg.append("g").attr("transform", `translate(${-(width/2)+10},${-(height/2)+10})`);
  legend
    .selectAll("g")
    .data(counts)
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * 18})`)
    .call((g) => {
      g.append("rect").attr("width", 12).attr("height", 12).attr("fill", (d, i) => color(i));
      g.append("text").attr("x", 16).attr("y", 11).text((d) => `${d.status} (${d.count})`).style("font-size", "12px");
    });
}
