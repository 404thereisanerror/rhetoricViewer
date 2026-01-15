
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { type AnalysisResponse, type GraphNode as ApiGraphNode, type GraphEdge as ApiGraphEdge, type Sentence } from '../types';
import { type EmotionTopicActorAggregates, type EmotionLabel } from '../utils/emotionTopicActor';

export type GraphViewMode = "overview" | "emotion" | "topic" | "sentence" | "actor";

interface PropagandaGraphProps {
  data: AnalysisResponse;
  eta: EmotionTopicActorAggregates;
  viewMode: GraphViewMode;
  selectedEmotion: EmotionLabel | null;
  selectedTopicId: string | null;
  selectedSentenceId: string | null;
  focusedNodeId: string | null;
  onSelectSentenceId: (id: string | null) => void;
  onFocusActorNode: (id: string | null) => void;
  onSelectEmotion: (emotion: EmotionLabel | null) => void;
  onSelectTopic: (topicId: string | null) => void;
  onResetOverview: () => void;
}

type Node = d3.SimulationNodeDatum & ApiGraphNode & {
  virtual?: boolean;
  emotionLabel?: EmotionLabel;
  topicId?: string;
  parentTopicId?: string;
  isPrimary?: boolean;
  sentenceId?: string;
};

type Edge = d3.SimulationLinkDatum<Node> & ApiGraphEdge & {
  source: string | Node;
  target: string | Node;
};

const WHEEL_EMOTIONS: EmotionLabel[] = ["ANGST", "WUT", "TRAUER", "FREUDE", "EKEL", "HOFFNUNG", "NEUTRAL"];
const WHEEL_RADIUS = 72; // Slightly larger for better text clearance
const SENTENCE_ORBIT_RADIUS = 28;

const colorMap: Record<string, string> = {
  ANGST: 'rgba(76, 148, 246, 1)',
  WUT: 'rgba(195, 68, 61, 1)',
  FREUDE: 'rgba(255, 244, 79, 1)',
  EKEL: 'rgba(255, 159, 67, 1)',
  TRAUER: 'rgba(34, 34, 34, 1)',
  NEUTRAL: 'rgba(113, 113, 122, 1)',
  HOFFNUNG: 'rgba(59, 211, 155, 1)',
  Sentence: '#020404',
  Device: '#C3443D',
  Fallacy: '#FF9F43',
  Outlet: '#C3443D',
  Filter: '#FF9F43',
  Topic: 'transparent',
  WheelNode: '#FFFFFF'
};

export const PropagandaGraph: React.FC<PropagandaGraphProps> = ({ 
  data, 
  eta,
  viewMode,
  selectedEmotion,
  selectedTopicId,
  selectedSentenceId, 
  focusedNodeId,
  onSelectSentenceId,
  onFocusActorNode,
  onSelectEmotion,
  onSelectTopic
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const RING_RADIUS_OUTER = 420;

  const graphData = useMemo(() => {
    if (!data?.graph?.nodes) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Collect topics from eta
    const topicsMap = new Map<string, { id: string, label: string, emotion: EmotionLabel, sentenceIds: string[] }>();
    eta.emotions.forEach(e => {
      e.topics.forEach(t => {
        topicsMap.set(t.id, t);
      });
    });

    // Create Nodes
    topicsMap.forEach(topic => {
      // 1. Central Topic Node (Text Only Anchor)
      nodes.push({
        id: topic.id,
        label: topic.label,
        type: 'Topic',
        emotionLabel: topic.emotion,
        topicId: topic.id,
        virtual: true,
        properties: { sentence_count: topic.sentenceIds.length }
      });

      // 2. 7 Emotion Wheel Nodes around each topic cluster
      WHEEL_EMOTIONS.forEach(emLabel => {
        const wnId = `wn_${topic.id}_${emLabel}`;
        nodes.push({
          id: wnId,
          label: emLabel.substring(0, 1),
          type: 'WheelNode',
          emotionLabel: emLabel,
          parentTopicId: topic.id,
          virtual: true,
          properties: { emotion: emLabel, parentTopic: topic.label }
        });

        // Rigid link to maintain wheel structure
        edges.push({
          id: `link_${wnId}`,
          from: topic.id,
          to: wnId,
          source: topic.id,
          target: wnId,
          type: 'WHEEL_CORE',
          properties: {}
        });
      });

      // 3. Sentence Nodes orbiting specific emotion sectors
      topic.sentenceIds.forEach(sid => {
        const s = data.sentences.find(sent => sent.id === sid);
        if (s) {
          const emLabel = (s.emotion.label?.toUpperCase() || "NEUTRAL") as EmotionLabel;
          const wnId = `wn_${topic.id}_${emLabel}`;
          nodes.push({
            id: `sn_${topic.id}_${s.id}`,
            label: '',
            type: 'Sentence',
            sentenceId: s.id,
            emotionLabel: emLabel,
            parentTopicId: topic.id,
            virtual: false,
            properties: { text: s.text }
          });

          // Link sentence to its wheel node sector
          edges.push({
            id: `link_s_${s.id}_${wnId}`,
            from: wnId,
            to: `sn_${topic.id}_${s.id}`,
            source: wnId,
            target: `sn_${topic.id}_${s.id}`,
            type: 'SENTENCE_ATTACH',
            properties: {}
          });
        }
      });
    });

    // Add Influence/Context Nodes
    data.graph.nodes.forEach(n => {
      if (!['Sentence', 'Topic'].includes(n.type)) {
        nodes.push({ ...n });
      }
    });

    return { nodes, edges };
  }, [data, eta]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);

    if (viewMode === 'overview') {
      const topicNodes = graphData.nodes.filter(n => n.type === 'Topic');
      topicNodes.forEach((n, i) => {
        const angle = (i / topicNodes.length) * 2 * Math.PI - Math.PI/2;
        n.fx = Math.cos(angle) * RING_RADIUS_OUTER;
        n.fy = Math.sin(angle) * RING_RADIUS_OUTER;

        const wheelNodes = graphData.nodes.filter(wn => wn.type === 'WheelNode' && wn.parentTopicId === n.id);
        wheelNodes.forEach(wn => {
          const idx = WHEEL_EMOTIONS.indexOf(wn.emotionLabel!);
          const wAngle = (idx / WHEEL_EMOTIONS.length) * 2 * Math.PI - Math.PI/2;
          wn.fx = n.fx! + Math.cos(wAngle) * WHEEL_RADIUS;
          wn.fy = n.fy! + Math.sin(wAngle) * WHEEL_RADIUS;
        });
      });

      graphData.nodes.forEach(n => {
        if (!['Topic', 'WheelNode'].includes(n.type)) {
          n.fx = undefined; n.fy = undefined;
        }
      });

      svg.transition().duration(800).call(zoomRef.current.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.6));
    } 
    else if (viewMode === 'topic' && selectedTopicId) {
      graphData.nodes.forEach(n => { n.fx = undefined; n.fy = undefined; });
      const tNode = graphData.nodes.find(n => n.id === selectedTopicId);
      if (tNode) {
        tNode.fx = 0; tNode.fy = 0;
        const wheelNodes = graphData.nodes.filter(wn => wn.type === 'WheelNode' && wn.parentTopicId === selectedTopicId);
        wheelNodes.forEach(wn => {
          const idx = WHEEL_EMOTIONS.indexOf(wn.emotionLabel!);
          const wAngle = (idx / WHEEL_EMOTIONS.length) * 2 * Math.PI - Math.PI/2;
          wn.fx = Math.cos(wAngle) * WHEEL_RADIUS * 1.8;
          wn.fy = Math.sin(wAngle) * WHEEL_RADIUS * 1.8;
        });
      }
      svg.transition().duration(800).call(zoomRef.current.transform, d3.zoomIdentity.translate(width/2, height/2).scale(1.1));
    } else {
       graphData.nodes.forEach(n => { n.fx = undefined; n.fy = undefined; });
    }

    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart();
    }
  }, [viewMode, selectedTopicId, graphData.nodes]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const container = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => container.attr('transform', event.transform));
    
    zoomRef.current = zoom;
    svg.call(zoom);

    const linkLayer = container.append('g').attr('class', 'links');
    const nodeLayer = container.append('g').attr('class', 'nodes');

    const simulation = d3.forceSimulation<Node>(graphData.nodes)
      .force('link', d3.forceLink<Node, Edge>(graphData.edges).id(d => d.id).distance(d => {
        if (d.type === 'WHEEL_CORE') return WHEEL_RADIUS;
        if (d.type === 'SENTENCE_ATTACH') return SENTENCE_ORBIT_RADIUS;
        return 140;
      }).strength(d => d.type === 'WHEEL_CORE' ? 1.0 : 0.4))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'Sentence' ? -40 : -1000))
      .force('x', d3.forceX(0).strength(0.01))
      .force('y', d3.forceY(0).strength(0.01))
      .force('collision', d3.forceCollide(d => d.type === 'Topic' ? 110 : d.type === 'WheelNode' ? 30 : 10));

    simulationRef.current = simulation;

    const linkSelection = linkLayer.selectAll('line')
      .data(graphData.edges.filter(e => e.type !== 'WHEEL_CORE'))
      .join('line')
      .attr('stroke', 'rgba(0,0,0,0.03)')
      .attr('stroke-width', 1);

    const nodeSelection = nodeLayer.selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null))
      .on('click', (event, d) => {
        if (d.type === 'WheelNode') onSelectEmotion(d.emotionLabel || null);
        else if (d.type === 'Topic') onSelectTopic(d.topicId || null);
        else if (d.type === 'Sentence') onSelectSentenceId(d.sentenceId || null);
        else if (['Group', 'Outlet', 'Filter'].includes(d.type)) onFocusActorNode(d.id);
      });

    // Render Hero-style clusters for Topic nodes
    // Fix: Explicitly type d as any to resolve SimulationNodeDatum conflict.
    const topicNodesGroup = nodeSelection.filter((d: any) => d.type === 'Topic');
    
    // Outer dashed orbit
    topicNodesGroup.append('circle')
      .attr('r', WHEEL_RADIUS)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0,0,0,0.08)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,6');

    // Inner subtle center ring
    topicNodesGroup.append('circle')
      .attr('r', WHEEL_RADIUS * 0.6)
      .attr('fill', 'rgba(0,0,0,0.01)')
      .attr('stroke', 'rgba(0,0,0,0.03)')
      .attr('stroke-width', 1);

    // Wheel Emotion Nodes (Orbiters)
    // Fix: Explicitly type d as any to resolve SimulationNodeDatum conflict.
    nodeSelection.filter((d: any) => d.type === 'WheelNode')
      .append('circle')
      .attr('r', 11)
      .attr('fill', (d: any) => colorMap[d.emotionLabel!] || '#CCC')
      .attr('stroke', 'white')
      .attr('stroke-width', 2.5)
      .attr('class', 'shadow-sm');

    // Sentence Dots
    // Fix: Explicitly type d as any to resolve SimulationNodeDatum conflict.
    nodeSelection.filter((d: any) => d.type === 'Sentence')
      .append('circle')
      .attr('r', 4.5)
      .attr('fill', (d: any) => colorMap[d.emotionLabel!] || '#020404')
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Influence / Actor nodes styling
    // Fix: Explicitly type d as any to resolve SimulationNodeDatum conflict.
    nodeSelection.filter((d: any) => !['Topic', 'WheelNode', 'Sentence'].includes(d.type))
      .append('circle')
      .attr('r', 28)
      .attr('fill', '#FFFFFF')
      .attr('stroke', (d: any) => colorMap[d.type] || '#CCC')
      .attr('stroke-width', 2.5)
      .attr('class', 'shadow-sm');

    // Labels and Text
    nodeSelection.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => {
        if (d.type === 'Topic') return WHEEL_RADIUS + 30; // Move text below the wheel
        if (d.type === 'WheelNode') return '0.35em';
        return 45;
      })
      .attr('fill', (d: any) => d.type === 'WheelNode' ? 'white' : '#020404')
      .style('font-size', (d: any) => d.type === 'Topic' ? '12px' : '9px')
      .style('font-weight', '900')
      .style('text-transform', 'uppercase')
      .style('pointer-events', 'none')
      .text((d: any) => {
        if (d.type === 'Sentence') return '';
        if (d.type === 'WheelNode') return d.label;
        if (d.type === 'Topic') return d.label.length > 22 ? d.label.substring(0, 19) + '...' : d.label;
        return d.label;
      });

    // Special: Centered label for Topic
    topicNodesGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#020404')
      .style('font-size', '10px')
      .style('font-weight', '800')
      .style('text-transform', 'uppercase')
      .style('max-width', '100px')
      .style('opacity', 0.8)
      .text((d: any) => d.label.substring(0, 15) + (d.label.length > 15 ? "..." : ""));

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', d => ((d.source as any).x || 0))
        .attr('y1', d => ((d.source as any).y || 0))
        .attr('x2', d => ((d.target as any).x || 0))
        .attr('y2', d => ((d.target as any).y || 0));
      nodeSelection.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Fix: useEffect destructor must return void or a cleanup function.
    return () => { simulation.stop(); };
  }, [graphData]);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    const visibleIds = new Set<string>();

    if (viewMode === 'overview') {
      // Fix: cast to any to ensure property access on Node extended type.
      graphData.nodes.filter((n: any) => ['Topic', 'WheelNode', 'Sentence'].includes(n.type)).forEach(n => visibleIds.add(n.id));
    } else if (viewMode === 'topic' && selectedTopicId) {
      visibleIds.add(selectedTopicId);
      // Fix: cast to any to ensure property access on Node extended type.
      graphData.nodes.filter((n: any) => n.parentTopicId === selectedTopicId).forEach(n => visibleIds.add(n.id));
      graphData.edges.forEach(e => {
        const sId = typeof e.source === 'string' ? e.source : (e.source as any).id;
        const tId = typeof e.target === 'string' ? e.target : (e.target as any).id;
        if (sId === selectedTopicId || tId === selectedTopicId) {
          visibleIds.add(sId); visibleIds.add(tId);
        }
      });
    }

    svg.selectAll('.nodes g')
      .transition().duration(400)
      .style('opacity', (d: any) => visibleIds.size === 0 || visibleIds.has(d.id) ? 1 : 0.05)
      .style('pointer-events', (d: any) => visibleIds.size === 0 || visibleIds.has(d.id) ? 'all' : 'none');

    svg.selectAll('.links line')
      .transition().duration(400)
      .style('opacity', (d: any) => {
        const sId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const tId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        return visibleIds.has(sId) && visibleIds.has(tId) ? 1 : 0.02;
      });

  }, [viewMode, selectedTopicId, selectedSentenceId, graphData]);

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full">
        <svg ref={svgRef} className="w-full h-full outline-none"></svg>
      </div>

      {hoveredNode && (
        <div className="absolute bottom-6 left-6 p-4 bg-white/95 border border-black/5 shadow-2xl animate-fade-in z-30 backdrop-blur-md rounded-2xl w-72 pointer-events-none">
           <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase text-charcoal/30 tracking-widest">
                {hoveredNode.type === 'WheelNode' ? `Fokus: ${hoveredNode.properties?.emotion}` : hoveredNode.type}
              </span>
              <h5 className="text-[14px] font-black text-charcoal uppercase leading-tight">
                {hoveredNode.type === 'WheelNode' ? hoveredNode.properties?.parentTopic : hoveredNode.label || hoveredNode.properties?.text?.substring(0, 50) + '...'}
              </h5>
              
              {hoveredNode.type === 'Topic' && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                  <span className="text-[10px] text-charcoal/50">Belege in diesem Cluster:</span>
                  <span className="text-[11px] font-black">{hoveredNode.properties?.sentence_count}</span>
                </div>
              )}

              {hoveredNode.type === 'Sentence' && (
                <div className="mt-1 pt-1 border-t border-black/5">
                   <p className="text-[11px] text-charcoal/70 italic leading-snug">
                     "{hoveredNode.properties?.text}"
                   </p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
