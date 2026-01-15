import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { type Sentence } from '../types';

const emotionStyles: { [key: string]: { color: string; hex: string; } } = {
    wut: { color: 'text-[#C3443D]', hex: '#C3443D' },
    angst: { color: 'text-[#4C94F6]', hex: '#4C94F6' },
    freude: { color: 'text-[#FFF44F]', hex: '#FFF44F' },
    ekel: { color: 'text-[#FF9F43]', hex: '#FF9F43' },
    trauer: { color: 'text-[#222222]', hex: '#222222' },
    überraschung: { color: 'text-[#3BD39B]', hex: '#3BD39B' },
    schuld: { color: 'text-[#020404]', hex: '#020404' },
    scham: { color: 'text-[#535050]', hex: '#535050' },
    neutral: { color: 'text-[#71717A]', hex: '#71717A' },
    default: { color: 'text-[#8A8787]', hex: '#8A8787' }
};

interface CircumplexPlotProps {
  sentences: Sentence[];
  onSentenceSelect: (item: Sentence | null) => void;
  selectedSentence: Sentence | null;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}

type TopicData = {
    name: string;
    count: number;
    startAngle: number;
    endAngle: number;
};

type EmotionSphereData = {
    emotion: string;
    topics: TopicData[];
    nodes: SentenceNode[];
    color: string;
    innerRadius: number;
    orbitRadius: number;
};

type SentenceNode = d3.SimulationNodeDatum & {
    id: string;
    data: Sentence;
    targetX: number;
    targetY: number;
    color: string;
};

export const CircumplexPlot: React.FC<CircumplexPlotProps> = ({ sentences, onSentenceSelect, selectedSentence, tooltipRef }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const emotionSpheres = useMemo(() => {
        const groupedByEmotion = new Map<string, Map<string, Sentence[]>>();
        
        sentences.forEach(s => {
            const em = s.emotion.label.toLowerCase().trim();
            const top = (s.frames[0]?.name || "Allgemein").trim();
            
            if (!groupedByEmotion.has(em)) groupedByEmotion.set(em, new Map());
            const topicMap = groupedByEmotion.get(em)!;
            if (!topicMap.has(top)) topicMap.set(top, []);
            topicMap.get(top)!.push(s);
        });

        const rawSpheres: { emotion: string; topicMap: Map<string, Sentence[]>; count: number }[] = [];
        groupedByEmotion.forEach((topicMap, emotion) => {
            const count = Array.from(topicMap.values()).reduce((acc, val) => acc + val.length, 0);
            rawSpheres.push({ emotion, topicMap, count });
        });

        const maxCount = Math.max(...rawSpheres.map(s => s.count), 1);
        const minInner = 140;
        const maxInner = 200; 
        const orbitPadding = 90;

        return rawSpheres.map(({ emotion, topicMap, count }) => {
            const scaleFactor = Math.sqrt(count / maxCount);
            const innerRadius = minInner + scaleFactor * (maxInner - minInner);
            const orbitRadius = innerRadius + orbitPadding;

            const topics: TopicData[] = [];
            const nodes: SentenceNode[] = [];
            
            let currentAngle = 0;
            topicMap.forEach((val, topicName) => {
                const angleWidth = (val.length / count) * 2 * Math.PI;
                const sector: TopicData = {
                    name: topicName,
                    count: val.length,
                    startAngle: currentAngle,
                    endAngle: currentAngle + angleWidth
                };
                topics.push(sector);

                val.forEach((item, i) => {
                    const itemAngle = sector.startAngle + (i / val.length) * angleWidth + (angleWidth / (val.length * 2));
                    const distance = orbitRadius * (0.8 + 0.4 * item.emotion.intensity);
                    const tx = Math.cos(itemAngle - Math.PI / 2) * distance;
                    const ty = Math.sin(itemAngle - Math.PI / 2) * distance;

                    nodes.push({
                        id: item.id,
                        data: item,
                        x: tx,
                        y: ty,
                        targetX: tx,
                        targetY: ty,
                        color: emotionStyles[emotion]?.hex || emotionStyles.default.hex
                    });
                });
                currentAngle += angleWidth;
            });

            return {
                emotion,
                topics,
                nodes,
                color: emotionStyles[emotion]?.hex || emotionStyles.default.hex,
                innerRadius,
                orbitRadius
            } as EmotionSphereData;
        }).sort((a, b) => b.nodes.length - a.nodes.length);
    }, [sentences]);

    useEffect(() => {
      if (!svgRef.current || !containerRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const container = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => container.attr("transform", event.transform));

      svg.call(zoom);
      svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.4));

      let currentX = 0;
      const sphereGap = 700;
      const totalWidth = emotionSpheres.length * sphereGap;
      const startX = -(totalWidth - sphereGap) / 2;

      emotionSpheres.forEach((sphere, sIdx) => {
        const sphereX = startX + sIdx * sphereGap;
        const g = container.append("g").attr("transform", `translate(${sphereX}, 0)`);
        
        g.append("circle")
            .attr("r", sphere.orbitRadius)
            .attr("fill", "none")
            .attr("stroke", "rgba(0,0,0,0.03)")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,10");

        g.append("circle")
            .attr("r", sphere.innerRadius)
            .attr("fill", "rgba(255,255,255,0.01)")
            .attr("stroke", "rgba(0,0,0,0.05)")
            .attr("stroke-width", 1.5);

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -sphere.orbitRadius - 60)
            .attr("fill", sphere.color)
            .style("font-size", "42px")
            .style("font-weight", "900")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.15em")
            .style("opacity", 0.9)
            .text(sphere.emotion);

        const simulation = d3.forceSimulation<SentenceNode>(sphere.nodes)
            .force("x", d3.forceX<SentenceNode>(d => d.targetX).strength(0.8))
            .force("y", d3.forceY<SentenceNode>(d => d.targetY).strength(0.8))
            .force("collide", d3.forceCollide<SentenceNode>(20).strength(1))
            .stop();

        for (let i = 0; i < 120; ++i) simulation.tick();

        const nodes = g.selectAll(".node")
            .data(sphere.nodes)
            .join("circle")
            .attr("class", "node")
            .attr("cx", d => d.x!)
            .attr("cy", d => d.y!)
            .attr("r", d => selectedSentence?.id === d.data.id ? 14 : 10)
            .attr("fill", d => d.color)
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", d => selectedSentence?.id === d.data.id ? 4 : 2)
            .style("cursor", "pointer")
            .style("transition", "r 0.2s, stroke-width 0.2s")
            .on("click", (event, d) => onSentenceSelect(selectedSentence?.id === d.data.id ? null : d.data))
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 16).attr("stroke-width", 5);
                if (tooltipRef.current) {
                  const tooltip = d3.select(tooltipRef.current);
                  tooltip.html(`
                    <div class="bg-white/95 p-4 w-72 lg:w-[320px] shadow-2xl rounded-xl border-l-[6px] backdrop-blur-md" style="border-left-color: ${d.color}">
                      <p class="text-[14px] text-[#222222] italic font-serif leading-tight">"${d.data.text}"</p>
                      <div class="mt-2 text-[9px] font-black uppercase text-charcoal/40 tracking-widest">${d.data.emotion.label}</div>
                    </div>
                  `);
                  tooltip.style("left", `${event.clientX}px`).style("top", `${event.clientY}px`).style("opacity", 1);
                }
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("r", selectedSentence?.id === d.data.id ? 14 : 10).attr("stroke-width", selectedSentence?.id === d.data.id ? 4 : 2);
                if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
            });
      });

    }, [emotionSpheres, selectedSentence, onSentenceSelect, tooltipRef]);

    return (
        <div ref={containerRef} className="w-full h-full bg-white relative">
            <svg ref={svgRef} width="100%" height="100%" className="overflow-visible outline-none cursor-move"></svg>
            <div className="absolute bottom-6 right-6 pointer-events-none opacity-20">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal">Cluster-Navigation: Pan & Zoom</p>
            </div>
        </div>
    );
};
