import { useState } from 'react';
import { Notice } from '../types';
import { Calendar, Pin, Search, AlertCircle, FileText, Bell, Download, Printer } from 'lucide-react';
import { motion } from 'motion/react';

interface NoticeBoardProps {
  notices: Notice[];
}

export default function NoticeBoard({ notices }: NoticeBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Filter out hidden notices for public users (admin will see everything in admin panel)
  const visibleNotices = notices.filter((n) => !n.hidden && !n.archived);

  // Filter based on search term
  const filteredNotices = visibleNotices.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort notices: Pinned ones first, then by date/createdAt descending
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt; // newest first
  });

  const downloadNoticeNotes = (notice: Notice, format: 'txt' | 'md') => {
    let content = '';
    const dateStr = notice.date;
    
    if (format === 'txt') {
      content = `================================================
UFTB CYBER SECURITY DEPARTMENT BULLETIN NOTES
================================================
TITLE:     ${notice.title.toUpperCase()}
DATE:      ${dateStr}
PINNED:    ${notice.pinned ? 'YES' : 'NO'}
================================================

${notice.description}

================================================
Generated Securely via UFTB Cyber Mainframe.
`;
    } else {
      content = `# ${notice.title}

* **Department Bulletin Notes**
* **Date:** ${dateStr}
* **Status:** ${notice.pinned ? '📌 Pinned Bulletin' : 'Standard Notice'}

---

## Bulletin Message

${notice.description}

---
*Generated Securely via [UFTB Cyber Security Department Mainframe](${window.location.origin})*
`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulletin_notes_${notice.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="notice-board-container" className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl">
      {/* Frosted Header / Top Bar */}
      <div className="p-4 border-b border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest flex items-center text-white">
          <Bell className="w-4 h-4 mr-2 text-cyan-400 animate-pulse" />
          Community Notices
        </h2>
        <span className="text-[10px] font-mono text-cyan-500/60 uppercase">System_Live</span>
      </div>

      {/* Search Input Inner Section */}
      <div className="p-4 border-b border-cyan-500/10 bg-slate-950/20">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500/40">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="notice-search"
            type="text"
            placeholder="Search bulletins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs transition-all focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      {/* Notices Body Section */}
      <div className="p-4 flex-1 space-y-4 max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20">
        {sortedNotices.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-mono text-slate-400">No active network bulletins found.</p>
          </div>
        ) : (
          sortedNotices.map((notice) => {
            if (notice.pinned) {
              return (
                <div key={notice.id} className="relative group">
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-cyan-500 rounded-l" />
                  <div
                    id={`notice-card-${notice.id}`}
                    onClick={() => setSelectedNotice(notice)}
                    className="bg-slate-800/40 hover:bg-slate-800/60 p-4 rounded-r-lg border-r border-y border-slate-700 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-bold text-cyan-300 italic flex items-center gap-1.5">
                        {notice.title}
                      </h3>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-medium">PINNED</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-2 line-clamp-3">
                      {notice.description}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono italic">
                      {notice.date} • system_admin
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                id={`notice-card-${notice.id}`}
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="bg-slate-800/40 hover:bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 cursor-pointer transition-all duration-200"
              >
                <h3 className="text-sm font-bold text-slate-300 mb-2">{notice.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-3">{notice.description}</p>
                <div className="text-[10px] text-slate-500 font-mono">{notice.date} • operative</div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotice && (
        <div id="notice-modal-backdrop" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            id="notice-modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/40" />

            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-4 pb-2 border-b border-cyan-500/10">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                {selectedNotice.date}
              </span>
              {selectedNotice.pinned && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <Pin className="w-3 h-3 fill-cyan-400" /> PINNED BULLETIN
                </span>
              )}
            </div>

            <h3 className="text-lg font-sans font-bold text-white mb-3">
              {selectedNotice.title}
            </h3>

            <div className="max-h-60 overflow-y-auto text-xs text-slate-300 leading-relaxed mb-6 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-cyan-500">
              {selectedNotice.description.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
              {/* Attachment if exists */}
              {selectedNotice.attachmentUrl && (
                <a
                  id="notice-modal-attachment"
                  href={selectedNotice.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Attachment</span>
                </a>
              )}

              {/* Downloader panel */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Export Bulletin:</span>
                <div className="flex items-center gap-2">
                  <button
                    id="download-notice-txt"
                    onClick={() => downloadNoticeNotes(selectedNotice, 'txt')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[9px] uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Download Plain Text Notes"
                  >
                    <Download className="w-3 h-3" />
                    <span>TXT Notes</span>
                  </button>
                  <button
                    id="download-notice-md"
                    onClick={() => downloadNoticeNotes(selectedNotice, 'md')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[9px] uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Download Markdown Notes"
                  >
                    <Download className="w-3 h-3" />
                    <span>MD Notes</span>
                  </button>
                  <button
                    id="print-notice-pdf"
                    onClick={handlePrint}
                    className="bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Print Bulletin to PDF"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* Close controls */}
              <div className="flex justify-end">
                <button
                  id="close-notice-modal"
                  onClick={() => setSelectedNotice(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-2xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
