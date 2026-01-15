
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
/* Fix: Use existing types from types.ts instead of missing ones */
import { type Influence, type Sentence, type GraphNode, type GraphEdge } from '../types';

interface InfluenceMapProps {
    data: Influence;
    languageResults: Sentence[];
    tooltipRef: React.RefObject<HTMLDivElement | null>;
}

const entityStyles = {
    source: { color: '#C3443D', icon: 'Q' },
    person: { color: '#8A8787', icon: 'P' },
    financial: { color: '#020404', icon: '$' },
    ngo: { color: '#535050', icon: 'N' },
    lobby: { color: '#222222', icon: 'L' },
    government: { color: '#535050', icon: 'G' }
} as const;

const getEntityStyle = (type: string) => {
    const normalizedKey = type.toLowerCase() as keyof typeof entityStyles;
    return entityStyles[normalizedKey] || entityStyles.person;
};

export const InfluenceMap: React.FC<InfluenceMapProps> = ({ data, languageResults, tooltipRef }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

    const graphData = useMemo(() => {
        const nodes: GraphNode[] = [];
        const links: GraphEdge[] = [];
        
        const sourceId = `source_root`;
        nodes.push({
            id: sourceId,
            /* Fix: type must match defined enum in GraphNode.type, 'Source' is correct */
            type: 'Source',
            label: data.outlet.name || "Hauptquelle",
            group: 0,
            fx: 0,
            fy: 0,
            properties: {}
        });

        data.ownership_chain.forEach((conn, i) => {
            const nodeId = `entity_${i}`;
            nodes.push({
                id: nodeId,
                /* Fix: type must match defined enum in GraphNode.type, 'Owner' is correct */
                type: 'Owner',
                label: conn.entity_name,
                group: 1,
                properties: { role: conn.role }
            });
            links.push({
                id: `link_${i}`,
                from: nodeId,
                to: sourceId,
                type: 'OWNED_BY',
                properties: {}
            });
        });
        
        return { nodes, links };
    }, [data]);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const { clientWidth: width, clientHeight: height } = containerRef.current;
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        svg.selectAll("*").remove();
        const g = svg.append("g");
        
        const linkLayer = g.append("g").attr("class", "links");
        const nodeLayer = g.append("g").attr("class", "nodes");

        const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
            /* Fix: Use 'any' for link datum as D3 internally converts target/source to objects */
            .force("link", d3.forceLink<GraphNode, any>(graphData.links).id(d => d.id).distance(180))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("collision", d3.forceCollide(60))
            .force("x", d3.forceX(0).strength(0.05))
            .force("y", d3.forceY(0).strength(0.05));

        const linkSelection = linkLayer.selectAll("line")
            .data(graphData.links)
            .join("line")
            .attr("stroke", "rgba(0,0,0,0.05)")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");

        const nodeSelection = nodeLayer.selectAll("g")
            .data(graphData.nodes)
            .join("g")
            .style("cursor", "pointer")
            .on("click", (event, d) => setSelectedEntityId(d.id === selectedEntityId ? null : d.id))
            .on("mouseenter", (event, d) => setHoveredEntityId(d.id))
            .on("mouseleave", () => setHoveredEntityId(null));

        nodeSelection.append("circle")
            .attr("r", d => d.type === 'Source' ? 38 : 30)
            .attr("fill", "white")
            .attr("stroke", d => getEntityStyle(d.type).color)
            .attr("stroke-width", 2)
            .attr("class", "shadow-sm");

        nodeSelection.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("fill", d => getEntityStyle(d.type).color)
            .style("font-size", "14px")
            .style("font-weight", "900")
            .style("pointer-events", "none")
            .text(d => getEntityStyle(d.type).icon);

        nodeSelection.append("text")
            .attr("dy", d => d.type === 'Source' ? 58 : 50)
            .attr("text-anchor", "middle")
            .attr("fill", "#020404")
            .style("font-size", "10px")
            .style("font-weight", "600")
            .style("text-transform", "uppercase")
            .style("opacity", 0.6)
            .text(d => d.label);

        // Fix: Cast d as any to access source/target and position properties which are added by D3 at runtime.
        simulation.on("tick", () => {
            linkSelection
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
            nodeSelection.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        return () => { simulation.stop(); };
    }, [graphData]);

    const activeEntity = useMemo(() => {
        if (!selectedEntityId) return null;
        /* Fix: Access influence data properties with correct names */
        if (selectedEntityId === 'source_root') return { name: data.outlet.name, type: 'Quelle', relationship: 'Hauptanalysierte Medienquelle' };
        const idx = parseInt(selectedEntityId.split('_')[1]);
        const chain = data.ownership_chain[idx];
        return { name: chain.entity_name, type: chain.entity_type, relationship: chain.role };
    }, [selectedEntityId, data]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-start animate-fade-in text-left">
            {/* Visual Canvas */}
            <div className="flex flex-col space-y-6 order-last lg:order-first">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-[12px] text-charcoal/30 uppercase tracking-[0.3em] font-black">Besitz & Einfluss</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 opacity-40">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-coral"></div>
                            <span className="text-[8px] text-charcoal font-black uppercase tracking-widest">Medium</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-40">
                            <div className="w-1.5 h-1.5 rounded-full bg-charcoal"></div>
                            <span className="text-[8px] text-charcoal font-black uppercase tracking-widest">Finanzen</span>
                        </div>
                    </div>
                </div>

                {/* Applied brutalist-window for the dark corner frame */}
                <div ref={containerRef} className="w-full h-[500px] lg:h-[650px] bg-bgDark brutalist-window relative overflow-hidden">
                    <svg ref={svgRef} className="w-full h-full"></svg>
                    
                    <div className="absolute bottom-6 left-6 p-4 bg-white/80 border border-black/5 backdrop-blur-xl rounded-xl pointer-events-none z-20 shadow-lg max-w-[280px]">
                         <p className="text-[9px] text-accent-coral leading-relaxed font-bold uppercase tracking-[0.15em] mb-1">
                           {hoveredEntityId ? "Element fokussiert" : "Netzwerk-Navigation"}
                         </p>
                         <p className="text-[11px] text-charcoal/40 font-sans italic leading-snug">
                           Knoten anklicken für Verknüpfungsdetails
                         </p>
                    </div>
                </div>
            </div>

            {/* Sidebar Sidebar */}
            <div className="flex flex-col gap-12 lg:sticky lg:top-48 self-start order-first lg:order-last">
                <div className="flex flex-col">
                    <h4 className="text-accent-coral text-[11px] uppercase font-bold tracking-[0.25em] mb-3 opacity-90 lg:pl-8">
                        MACHT-DYNAMIK
                    </h4>
                    <h1 className="text-h1 text-charcoal lg:pl-8 mb-4 uppercase tracking-[0.05em]">Hintergrund</h1>
                </div>

                <div className="bg-white/40 border border-black/5 rounded-[28px] p-8 lg:p-10 shadow-card flex flex-col backdrop-blur-md min-h-[500px]">
                    {activeEntity ? (
                        <div className="space-y-10 flex flex-col h-full animate-fade-in">
                            <header className="space-y-4">
                                <div className="px-4 py-1.5 rounded-pill border border-black/5 text-[10px] font-black uppercase tracking-[0.2em] bg-black/5 inline-block text-charcoal/40">
                                    Entity: {activeEntity.type}
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-serif italic text-charcoal/90 leading-tight">
                                    {activeEntity.name}
                                </h2>
                            </header>

                            <section className="space-y-8 flex-grow">
                                <div>
                                    <h4 className="text-[10px] text-charcoal/25 uppercase tracking-[0.2em] font-black mb-3 border-b border-black/5 pb-2">Beziehung</h4>
                                    <p className="text-[16px] text-charcoal/80 leading-relaxed font-sans">
                                        {activeEntity.relationship}
                                    </p>
                                </div>
                            </section>

                            <footer className="pt-6 border-t border-black/5 opacity-40">
                                <p className="text-[10px] text-charcoal leading-relaxed font-sans italic">
                                    Eigentumsverhältnisse basieren auf öffentlich zugänglichen Datenbanken.
                                </p>
                            </footer>
                        </div>
                    ) : (
                        <div className="space-y-10 flex flex-col h-full">
                            <h2 className="text-2xl lg:text-3xl font-serif italic text-charcoal/90 leading-tight">Zusammenfassung</h2>
                            <p className="text-[17px] text-charcoal/60 leading-relaxed font-light italic">
                                {/* Fix: Use the EIGENTUM filter summary as a proxy for ownership summary */}
                                {data.filters.find(f => f.name === 'EIGENTUM')?.summary || "Keine spezifische Zusammenfassung der Eigentumsverhältnisse verfügbar."}
                            </p>
                            
                            <div className="flex flex-col items-center justify-center text-center space-y-4 py-10 opacity-40">
                                <div className="w-12 h-12 rounded-full border border-dashed border-black/20 flex items-center justify-center bg-black/5">
                                    <span className="text-xl font-serif italic">?</span>
                                </div>
                                <p className="text-[11px] text-charcoal font-black uppercase tracking-[0.2em]">Interagiere mit dem Graphen</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
