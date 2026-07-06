import { Submission, FormField } from '../types';
import { Printer, Download, X, Calendar, User, Eye, ArrowLeft, File, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SubmissionDetailModalProps {
  submission: Submission | null;
  fields: FormField[];
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function SubmissionDetailModal({ submission, fields, onClose, onDelete }: SubmissionDetailModalProps) {
  if (!submission) return null;

  // Find corresponding labels for field values
  const getFieldLabel = (fieldId: string): string => {
    const field = fields.find((f) => f.id === fieldId);
    return field ? field.label : fieldId;
  };

  const getFieldType = (fieldId: string): string => {
    const field = fields.find((f) => f.id === fieldId);
    return field ? field.type : 'text';
  };

  const handlePrint = () => {
    // Elegant printing layout
    const printContent = document.getElementById('printable-area');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      window.print();
    }
  };

  const downloadSubmissionJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submission, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `submission-${submission.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadSubmissionNotes = (format: 'txt' | 'md') => {
    let content = '';
    const dateStr = new Date(submission.submittedAt).toLocaleString();

    if (format === 'txt') {
      content = `================================================
UFTB CYBER SECURITY DEPARTMENT RECORD AUDIT
================================================
RECORD ID: ${submission.id}
OPERATOR:  ${submission.visitorNickname.toUpperCase()}
DATE:      ${dateStr}
================================================\n\n`;

      fields.forEach((field) => {
        const val = submission.answers[field.id];
        let valStr = 'Not provided';
        if (val !== undefined && val !== null && val !== '') {
          if (field.type === 'file' && typeof val === 'object') {
            valStr = val.name || 'File Attachment';
          } else if (Array.isArray(val)) {
            valStr = val.join(', ');
          } else {
            valStr = String(val);
          }
        }
        content += `${field.label.toUpperCase()}:\n   ${valStr}\n\n`;
      });
      content += `================================================
Audit generated via UFTB Cyber Mainframe.`;
    } else {
      content = `# Decrypted Record Audit: ${submission.visitorNickname}

* **Record ID:** \`${submission.id}\`
* **Audit Date:** ${dateStr}

---

## Registered Assets & Fields

`;

      fields.forEach((field) => {
        const val = submission.answers[field.id];
        let valStr = '*Not provided*';
        if (val !== undefined && val !== null && val !== '') {
          if (field.type === 'file' && typeof val === 'object') {
            valStr = `📁 [${val.name}](${val.base64?.slice(0, 50)}...)`;
          } else if (Array.isArray(val)) {
            valStr = val.map(v => `\`${v}\``).join(', ');
          } else {
            valStr = String(val).replace(/\n/g, '\n   ');
          }
        }
        content += `### 📝 ${field.label}\n${valStr}\n\n`;
      });
      content += `\n---
*Generated Securely via [UFTB Cyber Security Department Mainframe](${window.location.origin})*`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_notes_${submission.visitorNickname.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderValue = (fieldId: string, val: any) => {
    const type = getFieldType(fieldId);

    if (val === undefined || val === null || val === '') {
      return <span className="text-slate-500 italic">Not provided</span>;
    }

    if (type === 'file' && typeof val === 'object' && val.base64) {
      const isImage = val.type?.startsWith('image/');
      return (
        <div className="space-y-2 mt-1 p-3 bg-slate-950/50 rounded-xl border border-cyan-500/10">
          <div className="flex items-center justify-between text-2xs font-mono text-cyan-400">
            <span className="flex items-center gap-1.5 truncate max-w-[70%]">
              <File className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
              <span className="truncate">{val.name}</span>
            </span>
            <span>{(val.size / 1024).toFixed(1)} KB</span>
          </div>
          {isImage ? (
            <div className="relative max-w-xs overflow-hidden rounded-lg border border-slate-800">
              <img
                src={val.base64}
                alt={val.name}
                referrerPolicy="no-referrer"
                className="max-h-40 w-auto object-contain rounded"
              />
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic">Non-image binary file</p>
          )}
          <a
            id={`download-file-${fieldId}`}
            href={val.base64}
            download={val.name}
            className="inline-flex items-center gap-1 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download Uploaded File</span>
          </a>
        </div>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {val.map((item, i) => (
            <span key={i} className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-2xs px-2.5 py-1 rounded-full font-mono">
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <span className={`inline-block text-2xs font-mono px-2 py-0.5 rounded-md ${val ? 'bg-green-950/50 border border-green-500/30 text-green-400' : 'bg-red-950/50 border border-red-500/30 text-red-400'}`}>
          {val ? 'TRUE / APPROVED' : 'FALSE / NOT APPROVED'}
        </span>
      );
    }

    return <span className="text-slate-200 text-xs tracking-wide whitespace-pre-wrap">{String(val)}</span>;
  };

  return (
    <div id="submission-modal-backdrop" className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        id="submission-modal-content"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col my-8"
      >
        {/* Cyan borders */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-5 bg-cyan-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-sans font-bold text-white tracking-tight">
              Record Audit Mainframe
            </h3>
          </div>
          <button
            id="close-submission-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-800 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable/Scrollable Area */}
        <div id="printable-area" className="flex-1 overflow-y-auto max-h-[60vh] pr-2 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500">
          
          {/* General Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/40 rounded-xl border border-cyan-500/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-950/40 rounded-lg text-cyan-400 border border-cyan-500/20">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-widest">Operator Nickname</p>
                <p className="text-sm font-sans font-semibold text-white">{submission.visitorNickname}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-950/40 rounded-lg text-cyan-400 border border-cyan-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-widest">Transmission Date</p>
                <p className="text-sm font-mono text-slate-200">
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Form Responses list */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-cyan-400 border-b border-slate-800 pb-1.5">
              Decrypted Field Assets
            </h4>

            <div className="space-y-4">
              {fields.map((field) => {
                const answer = submission.answers[field.id];
                return (
                  <div key={field.id} className="p-3 bg-slate-950/20 border border-slate-800/80 rounded-xl hover:border-cyan-500/10 transition-colors">
                    <p className="text-[11px] font-mono text-cyan-400/70 tracking-wide uppercase">
                      {field.label}
                    </p>
                    <div className="mt-1 text-xs text-white">
                      {renderValue(field.id, answer)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action controls footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              id="print-submission-btn"
              onClick={() => window.print()}
              className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 font-mono text-2xs uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit</span>
            </button>

            <button
              id="download-json-btn"
              onClick={downloadSubmissionJson}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-2xs uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              id="download-txt-notes"
              onClick={() => downloadSubmissionNotes('txt')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-2xs uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Download Plain Text Notes"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TXT Notes</span>
            </button>

            <button
              id="download-md-notes"
              onClick={() => downloadSubmissionNotes('md')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-2xs uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Download Markdown Notes"
            >
              <Download className="w-3.5 h-3.5" />
              <span>MD Notes</span>
            </button>
          </div>

          <div className="flex gap-2">
            {onDelete && (
              <button
                id="modal-delete-record"
                onClick={() => {
                  if (window.confirm('Are you absolutely sure you want to permanently delete this submission from the system? This action is irreversible.')) {
                    onDelete(submission.id);
                    onClose();
                  }
                }}
                className="bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-400 font-mono text-2xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                title="Delete Submission"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            )}

            <button
              id="modal-terminal-exit"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-750 text-white font-mono text-2xs uppercase tracking-wider px-5 py-2 rounded-xl cursor-pointer"
            >
              Exit Terminal
            </button>
          </div>
        </div>

        {/* Global Print-only Styles injected */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-height: none !important;
              overflow: visible !important;
              background: white !important;
              color: black !important;
            }
            #printable-area * {
              color: black !important;
              background: transparent !important;
              border-color: #ddd !important;
            }
          }
        `}} />
      </motion.div>
    </div>
  );
}
