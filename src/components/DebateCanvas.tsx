import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphLink } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, HelpCircle } from 'lucide-react';

interface DebateCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  topic: string;
}

export default function DebateCanvas({ nodes, links, topic }: DebateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Node styling resolvers (declared before the rendering effect that uses them).
  function getNodeRadius(node: GraphNode): number {
    if (node.group === 'thesis') return 16;
    if (node.group === 'speaker_A' || node.group === 'speaker_B') return 12;
    // Scale radius by usage frequency
    return Math.min(4 + node.count * 1.5, 20);
  }

  function getNodeColor(node: GraphNode): string {
    if (node.group === 'thesis') return 'rgba(255, 255, 255, 0.9)';
    if (node.group === 'speaker_A') return 'rgba(0, 240, 255, 0.1)';
    if (node.group === 'speaker_B') return 'rgba(255, 140, 0, 0.1)';
    if (node.group === 'A') return '#00f0ff';
    if (node.group === 'B') return '#ff8c00';
    if (node.group === 'neutral') return '#bd00ff';
    return '#a1a1aa';
  }

  function getNodeStrokeColor(node: GraphNode): string {
    if (node.group === 'thesis') return '#ffffff';
    if (node.group === 'speaker_A' || node.group === 'A') return '#00f0ff';
    if (node.group === 'speaker_B' || node.group === 'B') return '#ff8c00';
    if (node.group === 'neutral') return '#bd00ff';
    return '#71717a';
  }

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 800,
          height: height || 450
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize SVG groups and zoom behaviors once
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll('*').remove(); // clear contents

    // Define glowing filters in defs
    const defs = svg.append('defs');
    
    // Cyan glow
    const filterCyan = defs.append('filter').attr('id', 'glow-cyan-svg').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filterCyan.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filterCyan.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);

    // Amber glow
    const filterAmber = defs.append('filter').attr('id', 'glow-amber-svg').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filterAmber.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filterAmber.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);

    // Purple glow
    const filterPurple = defs.append('filter').attr('id', 'glow-purple-svg').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filterPurple.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filterPurple.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);

    // White glow
    const filterWhite = defs.append('filter').attr('id', 'glow-white-svg').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    filterWhite.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filterWhite.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);

    // Add main Zoom Container
    const gContainer = svg.append('g').attr('class', 'zoom-container');

    // Groups for drawing layers
    gContainer.append('g').attr('class', 'links-group');
    gContainer.append('g').attr('class', 'nodes-group');
    gContainer.append('g').attr('class', 'labels-group');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create D3 Force Simulation
    const simulation = d3.forceSimulation<GraphNode, GraphLink>()
      .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('collide', d3.forceCollide<GraphNode>().radius(d => {
        if (d.group === 'thesis') return 25;
        if (d.group === 'speaker_A' || d.group === 'speaker_B') return 20;
        return Math.min(10 + d.count * 1.5, 30);
      }))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
    // Initialize the simulation once; live dimensions are read on each tick/redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update simulation center force when dimensions change
  useEffect(() => {
    const simulation = simulationRef.current;
    if (simulation) {
      simulation.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));
      // Re-fix anchor positions based on dimensions
      simulation.nodes().forEach(node => {
        if (node.group === 'thesis') {
          node.fx = dimensions.width / 2;
          node.fy = dimensions.height / 2;
        } else if (node.group === 'speaker_A') {
          node.fx = dimensions.width / 2 - 200;
          node.fy = dimensions.height / 2;
        } else if (node.group === 'speaker_B') {
          node.fx = dimensions.width / 2 + 200;
          node.fy = dimensions.height / 2;
        }
      });
      simulation.alpha(0.3).restart();
    }
  }, [dimensions]);

  // Sync data and redraw
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!svgRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    if (!simulation || nodes.length === 0) return;

    // Merge Nodes to preserve positions/velocities mutated by D3
    const currentNodes = simulation.nodes();
    const mergedNodes = nodes.map(n => {
      // Pin positions of anchors
      if (n.group === 'thesis') {
        n.fx = dimensions.width / 2;
        n.fy = dimensions.height / 2;
      } else if (n.group === 'speaker_A') {
        n.fx = dimensions.width / 2 - 220;
        n.fy = dimensions.height / 2;
      } else if (n.group === 'speaker_B') {
        n.fx = dimensions.width / 2 + 220;
        n.fy = dimensions.height / 2;
      }

      const match = currentNodes.find(cn => cn.id === n.id);
      if (match) {
        // Transfer mutating properties and update parameters
        match.count = n.count;
        match.group = n.group;
        match.fx = n.fx;
        match.fy = n.fy;
        return match;
      }
      return { ...n };
    });

    // Merge Links to resolve to the mutated Node objects
    const mergedLinks = links.map(l => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
      
      const sourceNode = mergedNodes.find(mn => mn.id === sourceId) || sourceId;
      const targetNode = mergedNodes.find(mn => mn.id === targetId) || targetId;

      return {
        source: sourceNode,
        target: targetNode,
        value: l.value
      };
    });

    simulation.nodes(mergedNodes);
    const linkForce = simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>;
    if (linkForce) {
      linkForce.links(mergedLinks);
    }

    // --- Redraw Elements ---
    const gContainer = svg.select('.zoom-container');
    const linksGroup = gContainer.select('.links-group');
    const nodesGroup = gContainer.select('.nodes-group');
    const labelsGroup = gContainer.select('.labels-group');

    // 1. Draw Links
    const linkSelection = linksGroup.selectAll<SVGLineElement, GraphLink>('line')
      .data(mergedLinks, (d: GraphLink) => {
        const s = typeof d.source === 'string' ? d.source : d.source.id;
        const t = typeof d.target === 'string' ? d.target : d.target.id;
        return `${s}-${t}`;
      });

    linkSelection.exit().remove();

    const linkEnter = linkSelection.enter().append('line')
      .attr('stroke-width', d => Math.max(1, d.value))
      .attr('opacity', 0.2)
      .attr('stroke', d => {
        const srcGroup = (d.source as GraphNode).group;
        const tgtGroup = (d.target as GraphNode).group;
        if (srcGroup === 'speaker_A' || tgtGroup === 'speaker_A' || srcGroup === 'A' || tgtGroup === 'A') {
          return '#00f0ff';
        }
        if (srcGroup === 'speaker_B' || tgtGroup === 'speaker_B' || srcGroup === 'B' || tgtGroup === 'B') {
          return '#ff8c00';
        }
        return 'rgba(255, 255, 255, 0.15)';
      });

    // d3's enter/update selection generics do not unify cleanly on merge.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkMerge = linkEnter.merge(linkSelection as any);

    // 2. Draw Nodes
    const nodeSelection = nodesGroup.selectAll<SVGGElement, GraphNode>('g')
      .data(mergedNodes, d => d.id);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection.enter().append('g')
      .attr('class', 'node-element cursor-grab active:cursor-grabbing')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
      )
      .on('mouseover', (_, d) => setHoveredNode(d))
      .on('mouseout', () => setHoveredNode(null));

    // Append visual shapes based on group
    nodeEnter.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => getNodeStrokeColor(d))
      .attr('stroke-width', d => (d.group === 'thesis' || d.group === 'speaker_A' || d.group === 'speaker_B' ? 1.5 : 1))
      .attr('filter', d => {
        if (d.group === 'thesis') return 'url(#glow-white-svg)';
        if (d.group === 'speaker_A' || d.group === 'A') return 'url(#glow-cyan-svg)';
        if (d.group === 'speaker_B' || d.group === 'B') return 'url(#glow-amber-svg)';
        if (d.group === 'neutral') return 'url(#glow-purple-svg)';
        return null;
      });

    // Special blueprint ticks inside anchors
    nodeEnter.filter(d => d.group === 'speaker_A' || d.group === 'speaker_B' || d.group === 'thesis')
      .append('path')
      .attr('d', d => {
        const r = getNodeRadius(d);
        return `M 0 ${-r - 4} L 0 ${r + 4} M ${-r - 4} 0 L ${r + 4} 0`;
      })
      .attr('stroke', d => getNodeStrokeColor(d))
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2, 2')
      .attr('opacity', 0.6);

    // d3's enter/update selection generics do not unify cleanly on merge.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeMerge = nodeEnter.merge(nodeSelection as any);

    // Update existing nodes sizes/colors
    nodeMerge.select('circle')
      .transition().duration(200)
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => getNodeStrokeColor(d));

    // 3. Draw Labels
    const labelSelection = labelsGroup.selectAll<SVGTextElement, GraphNode>('text')
      .data(mergedNodes, d => d.id);

    labelSelection.exit().remove();

    const labelEnter = labelSelection.enter().append('text')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '8px')
      .attr('fill', '#a1a1aa')
      .attr('opacity', 0)
      .attr('dx', d => getNodeRadius(d) + 5)
      .attr('dy', '3px')
      .text(d => d.label);

    // d3's enter/update selection generics do not unify cleanly on merge.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelMerge = labelEnter.merge(labelSelection as any);
    
    labelMerge.transition().duration(300)
      .attr('dx', d => getNodeRadius(d) + 5)
      .attr('opacity', d => {
        // Always show anchors, or show if hovered or count is significant
        if (d.group === 'thesis' || d.group === 'speaker_A' || d.group === 'speaker_B' || d.count > 1 || hoveredNode?.id === d.id) {
          return 0.85;
        }
        return 0.45;
      })
      .attr('fill', d => {
        if (d.group === 'thesis') return '#ffffff';
        if (d.group === 'speaker_A' || d.group === 'A') return '#00f0ff';
        if (d.group === 'speaker_B' || d.group === 'B') return '#ff8c00';
        if (d.group === 'neutral') return '#d946ef';
        return '#a1a1aa';
      });

    // Update simulation ticking
    simulation.on('tick', () => {
      linkMerge
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0);

      nodeMerge
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

      labelMerge
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    // Gentle restart of layout
    simulation.alpha(0.3).restart();

    // Drag helper functions
    function dragStarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      const simulation = simulationRef.current;
      if (!simulation) return;
      if (!event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      const simulation = simulationRef.current;
      if (!simulation) return;
      if (!event.active) simulation.alphaTarget(0);
      // Keep anchors fixed; let normal nodes float free
      if (d.group !== 'thesis' && d.group !== 'speaker_A' && d.group !== 'speaker_B') {
        d.fx = null;
        d.fy = null;
      }
    }
    // Re-run only on structural graph changes / hover; the effect reads the
    // latest nodes/links/dimensions from closure and rebuilds the D3 layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, links.length, hoveredNode]);

  // Zoom Helpers
  const handleZoom = (factor: number) => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;
    
    svg.transition().duration(250).call(
      // d3's selection.call overload cannot infer the zoom behavior's argument type.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      factor
    );
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    svg.transition().duration(400).call(
      // d3's selection.call overload cannot infer the zoom behavior's argument type.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-zinc-950/20 border border-zinc-800/80 blueprint-panel">
      {/* Title HUD Bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800/60 bg-zinc-950/60 text-xs font-mono select-none">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
          <span>SEMANTIC_MAPPER_D3.EXE</span>
        </div>
        <div className="text-[10px] text-zinc-500 truncate max-w-sm">
          TOPIC: {topic}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1 hover:text-[#00f0ff] hover:bg-zinc-900 border border-zinc-900 focus:outline-none transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1 hover:text-[#00f0ff] hover:bg-zinc-900 border border-zinc-900 focus:outline-none transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:text-[#00f0ff] hover:bg-zinc-900 border border-zinc-900 focus:outline-none transition-colors"
            title="Reset Grid"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full relative overflow-hidden blueprint-bg">
        <svg ref={svgRef} className="w-full h-full" style={{ userSelect: 'none' }} />

        {/* Floating Concept Metadata Box (Bottom-Left) */}
        {hoveredNode && hoveredNode.group !== 'thesis' && hoveredNode.group !== 'speaker_A' && hoveredNode.group !== 'speaker_B' && (
          <div className="absolute bottom-3 left-3 bg-zinc-950/90 border border-zinc-800 px-3 py-2 font-mono text-[10px] leading-relaxed shadow-xl max-w-xs blueprint-panel select-none pointer-events-none animate-fade-in">
            <div className="text-[11px] font-bold text-zinc-200 border-b border-zinc-900 pb-1 mb-1.5 uppercase">
              {hoveredNode.label}
            </div>
            <div>
              OCCURRENCES:{' '}
              <span className="text-zinc-200 font-bold">{hoveredNode.count}</span>
            </div>
            <div>
              FIRST_SEEN:{' '}
              <span className="text-zinc-200">ROUND_{String(hoveredNode.roundFirstSeen).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 pt-1 border-t border-zinc-900/60 text-[9px]">
              <span>BIAS:</span>
              <span
                className={
                  hoveredNode.group === 'A'
                    ? 'text-[#00f0ff] font-bold'
                    : hoveredNode.group === 'B'
                    ? 'text-[#ff8c00] font-bold'
                    : 'text-[#d946ef] font-bold'
                }
              >
                {hoveredNode.group === 'A'
                  ? 'MATERIALIST_ONLY'
                  : hoveredNode.group === 'B'
                  ? 'EXISTENTIALIST_ONLY'
                  : 'SHARED_CROSSOVER'}
              </span>
            </div>
          </div>
        )}

        {/* Legend Hud */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-zinc-950/50 border border-zinc-900/60 p-2 font-mono text-[8px] tracking-wider select-none">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <div className="w-2 h-2 bg-white rounded-full border border-white glow-white" />
            <span>CENTRAL THESIS</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <div className="w-2 h-2 bg-[#00f0ff] rounded-full glow-cyan" />
            <span>MATERIALIST CONCEPT</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <div className="w-2 h-2 bg-[#ff8c00] rounded-full glow-amber" />
            <span>EXISTENTIALIST CONCEPT</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <div className="w-2 h-2 bg-[#bd00ff] rounded-full glow-purple" />
            <span>SHARED CRITICAL CLASH</span>
          </div>
        </div>

        {/* Small Ticks Count on Bottom-Right */}
        <div className="absolute bottom-3 right-3 font-mono text-[9px] text-zinc-600 bg-zinc-950/30 px-2 py-0.5 border border-zinc-900 border-dashed select-none">
          NODES: {nodes.length} | LINKS: {links.length}
        </div>
      </div>
    </div>
  );
}
