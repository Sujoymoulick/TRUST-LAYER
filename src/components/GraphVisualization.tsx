import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { ShieldAlert, Info } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  color?: string;
  shape?: string;
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ nodes, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const data = {
      nodes: nodes.map(n => ({
        ...n,
        font: { face: 'Inter', size: 12, strokeWidth: 2, strokeColor: '#fff' },
        borderWidth: 3,
        shadow: true
      })),
      edges: edges.map(e => ({
        ...e,
        color: { color: '#000' },
        width: 2,
        arrows: 'to',
        font: { align: 'middle', size: 10 }
      }))
    };

    const options = {
      nodes: {
        shape: 'dot',
        size: 25,
        color: {
          background: '#fff',
          border: '#000',
          highlight: { background: '#FFFF00', border: '#000' }
        }
      },
      edges: {
        smooth: { 
          enabled: true, 
          type: 'continuous',
          roundness: 0.5
        }
      },
      physics: {
        stabilization: true,
        barnesHut: { gravitationalConstant: -2000 }
      }
    };

    const network = new Network(containerRef.current, data, options);

    return () => {
      network.destroy();
    };
  }, [nodes, edges]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            <ShieldAlert className="text-brutal-pink" />
            <h3 className="font-display text-xl uppercase tracking-tighter">Relationship Intelligence</h3>
         </div>
         <div className="brutal-badge bg-brutal-blue text-white text-[10px] uppercase">Neo4j AuraDB Active</div>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-[400px] border border-slate-200 dark:border-zinc-800 bg-white shadow-lg cursor-grab active:cursor-grabbing"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
         <div className="brutal-card bg-gray-50 flex items-start gap-3">
            <Info className="text-brutal-blue mt-1 shrink-0" size={16} />
            <div>
               <p className="text-[10px] font-bold uppercase mb-1 text-gray-500">Graph Insight</p>
               <p className="text-xs font-bold leading-relaxed"> Nodes represent identities and transactions. Thick connections indicate high trust propagation.</p>
            </div>
         </div>
         <div className="brutal-card bg-brutal-yellow/10 border-dashed flex items-start gap-3">
            <ShieldAlert className="text-brutal-pink mt-1 shrink-0" size={16} />
            <div>
               <p className="text-[10px] font-bold uppercase mb-1 text-brutal-pink">Risk Warning</p>
               <p className="text-xs font-bold leading-relaxed text-brutal-pink/80"> Circular paths or clusters of high-risk nodes are automatically flagged by our AI.</p>
            </div>
         </div>
      </div>
    </div>
  );
};
