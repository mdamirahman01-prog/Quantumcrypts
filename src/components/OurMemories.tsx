import { useState } from 'react';
import { Memory } from '../types';
import { Image, Search, Calendar, AlertCircle, X, Download, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OurMemoriesProps {
  memories: Memory[];
}

export default function OurMemories({ memories }: OurMemoriesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const downloadMemoryNotes = (mem: Memory, format: 'txt' | 'md') => {
    let content = '';
    const dateStr = mem.date || new Date(mem.createdAt).toLocaleDateString();

    if (format === 'txt') {
      content = `================================================
UFTB CYBER SECURITY DEPARTMENT MEMORY ENVELOPE
================================================
TITLE:     ${mem.title.toUpperCase()}
DATE:      ${dateStr}
================================================

${mem.description}

================================================
Generated Securely via UFTB Cyber Mainframe.
`;
    } else {
      content = `# Memory Capsule: ${mem.title}

* **Department Memory Log**
* **Date:** ${dateStr}

---

## Story/Description

${mem.description}

---
*Generated Securely via [UFTB Cyber Security Department Mainframe](${window.location.origin})*
`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory_notes_${mem.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter based on search term
  const filteredMemories = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.date && m.date.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort memories: newest first
  const sortedMemories = [...filteredMemories].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div id="our-memories-container" className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header / Top Bar */}
      <div className="p-4 border-b border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest flex items-center text-white">
          <Image className="w-4 h-4 mr-2 text-cyan-400 animate-pulse" />
          Our Department Memories
        </h2>
        <span className="text-[10px] font-mono text-cyan-500/60 uppercase">Operational_Archive</span>
      </div>

      {/* Search Input Section */}
      <div className="p-4 border-b border-cyan-500/10 bg-slate-950/20">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500/40">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="memories-search"
            type="text"
            placeholder="Search departmental memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs transition-all focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      {/* Memories Body Section */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-cyan-500/20">
        {sortedMemories.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-bounce" />
            <p className="text-xs font-mono text-slate-400">No departmental memories archived yet.</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">Deploy memories from the Admin Command Center.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedMemories.map((memory) => (
              <motion.div
                key={memory.id}
                layoutId={`memory-card-${memory.id}`}
                onClick={() => setSelectedMemory(memory)}
                className="bg-slate-950/40 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 relative"
                whileHover={{ y: -3 }}
              >
                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                
                {/* Memory Image */}
                <div className="aspect-video w-full overflow-hidden relative bg-slate-900">
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {memory.date && (
                    <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[9px] font-mono text-cyan-400 px-2 py-0.5 rounded-md z-20">
                      {memory.date}
                    </span>
                  )}
                </div>

                {/* Info Text */}
                <div className="p-4 relative z-20">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">
                    {memory.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {memory.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <div id="memory-modal-backdrop" className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              id="memory-modal-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl relative overflow-hidden shadow-2xl"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

              {/* Close Button */}
              <button
                id="close-memory-modal"
                onClick={() => setSelectedMemory(null)}
                className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-white hover:border-cyan-500 transition-all z-30 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Image */}
              <div className="w-full max-h-[350px] overflow-hidden bg-black relative flex items-center justify-center">
                <img
                  src={selectedMemory.imageUrl}
                  alt={selectedMemory.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[350px] object-contain"
                />
              </div>

              {/* Content Panel */}
              <div className="p-6">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedMemory.date || 'Archived date'}
                  </span>
                  <span className="uppercase tracking-widest">Memory Capsule</span>
                </div>

                <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider mb-3">
                  {selectedMemory.title}
                </h3>

                <div className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500 mb-6">
                  {selectedMemory.description.split('\n').map((para, i) => (
                    <p key={i} className="mb-2 last:mb-0">{para}</p>
                  ))}
                </div>

                {/* Downloader / Print buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl mt-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Export Capsule:</span>
                  <div className="flex items-center gap-2">
                    <button
                      id="download-memory-txt"
                      onClick={() => downloadMemoryNotes(selectedMemory, 'txt')}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[9px] uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Download Plain Text Notes"
                    >
                      <Download className="w-3 h-3" />
                      <span>TXT Notes</span>
                    </button>
                    <button
                      id="download-memory-md"
                      onClick={() => downloadMemoryNotes(selectedMemory, 'md')}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[9px] uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Download Markdown Notes"
                    >
                      <Download className="w-3 h-3" />
                      <span>MD Notes</span>
                    </button>
                    <button
                      id="print-memory-pdf"
                      onClick={handlePrint}
                      className="bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Print Memory Capsule"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
