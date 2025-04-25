import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const WorkLogVisualization = ({ logs }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Clear any existing visualizations
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = 600;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    // eslint-disable-next-line no-unused-vars
    const innerWidth = width - margin.left - margin.right;
    // eslint-disable-next-line no-unused-vars
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Group logs by day and sum durations
    const groupedData = d3.rollup(
      logs,
      v => d3.sum(v, d => +d.duration),
      d => new Date(d.time).toDateString()
    );

    // Convert Map to array
    const data = Array.from(groupedData, ([date, duration]) => ({ 
      date: new Date(date), 
      duration 
    })).sort((a, b) => a.date - b.date);

    // Create scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.date.toDateString()))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.duration) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create color scale
    const color = d3.scaleSequential()
      .domain([0, d3.max(data, d => d.duration)])
      .interpolator(d3.interpolateBlues);

    // Create and append the bar elements with animation
    const g = svg.append("g");
    
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.date.toDateString()))
      .attr("y", height - margin.bottom)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", d => color(d.duration))
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("y", d => y(d.duration))
      .attr("height", d => y(0) - y(d.duration));

    // Add labels
    g.selectAll("text")
      .data(data)
      .join("text")
      .attr("x", d => x(d.date.toDateString()) + x.bandwidth() / 2)
      .attr("y", d => y(d.duration) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.duration.toFixed(1))
      .style("opacity", 0)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .style("opacity", 1);

    // Add X axis
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }))
      .call(g => g.select(".domain").remove());

    // Add Y axis
    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "h"))
      .call(g => g.select(".domain").remove());

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Daily Work Hours")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

  }, [logs]);

  return (
    <div className="visualization-container">
      <svg ref={svgRef} className="d3-chart"></svg>
    </div>
  );
};

export default WorkLogVisualization;
