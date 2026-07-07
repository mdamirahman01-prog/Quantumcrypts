import React, { useState } from 'react';
import { SeniorContact } from '../types';
import { Users, Search, Phone, Mail, AlertCircle, Download, Printer } from 'lucide-react';
import { motion } from 'motion/react';

interface SeniorContactsProps {
  contacts: SeniorContact[];
}

export default function SeniorContacts({ contacts }: SeniorContactsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const downloadDirectory = (format: 'txt' | 'md') => {
    if (contacts.length === 0) {
      alert('No senior contacts are registered on the mainframe.');
      return;
    }

    let content = '';
    if (format === 'txt') {
      content = `================================================
UFTB CYBER SECURITY DEPARTMENT SENIOR DIRECTORY
================================================
TOTAL ADVISORS: ${contacts.length}
================================================\n\n`;

      contacts.forEach((c, idx) => {
        content += `${idx + 1}. NAME:     ${c.name.toUpperCase()}
   ROLE:     SENIOR OPERATIVE / ADVISOR
   PHONE:    ${c.phone}
   EMAIL:    ${c.email}
------------------------------------------------\n`;
      });
      content += `\nGenerated Securely via UFTB Cyber Mainframe.`;
    } else {
      content = `# Senior Contacts Directory

* **Department Advisory Panel**
* **Total Registered:** ${contacts.length}

---\n\n`;

      contacts.forEach((c) => {
        content += `### 👤 ${c.name}
* **Role:** Senior Operative
* **Phone:** [${c.phone}](tel:${c.phone})
* **Email:** [${c.email}](mailto:${c.email})

---\n`;
      });
      content += `\n*Generated Securely via [UFTB Cyber Security Department Mainframe](${window.location.origin})*`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `senior_directory_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadContactCard = (contact: SeniorContact, format: 'txt' | 'md') => {
    let content = '';
    if (format === 'txt') {
      content = `================================================
UFTB CYBER SECURITY - SENIOR CONTACT CARD
================================================
NAME:     ${contact.name.toUpperCase()}
ROLE:     SENIOR ADVISOR / CONTACT
PHONE:    ${contact.phone}
EMAIL:    ${contact.email}
================================================
Generated Securely via UFTB Cyber Mainframe.
`;
    } else {
      content = `# Senior Advisor Card

* **Name:** ${contact.name}
* **Role:** Senior Advisor
* **Phone:** [${contact.phone}](tel:${contact.phone})
* **Email:** [${contact.email}](mailto:${contact.email})

---
*Generated Securely via [UFTB Cyber Security Department Mainframe](${window.location.origin})*
`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `senior_${contact.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort contacts by date added (newest first)
  const sortedContacts = [...filteredContacts].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div id="senior-contacts-container" className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header / Top Bar */}
      <div className="p-4 border-b border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Contact with Senior
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="download-directory-txt"
            onClick={() => downloadDirectory('txt')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[9px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            title="Download Plain Text Directory"
          >
            <Download className="w-3 h-3" />
            <span>TXT List</span>
          </button>
          <button
            id="download-directory-md"
            onClick={() => downloadDirectory('md')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[9px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            title="Download Markdown Directory"
          >
            <Download className="w-3 h-3" />
            <span>MD List</span>
          </button>
          <button
            id="print-directory"
            onClick={() => window.print()}
            className="bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            title="Print Contact Directory"
          >
            <Printer className="w-3 h-3" />
            <span>Print List</span>
          </button>
        </div>
      </div>

      {/* Search Input Section */}
      <div className="p-4 border-b border-cyan-500/10 bg-slate-950/20">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500/40">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="senior-contacts-search"
            type="text"
            placeholder="Search senior contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs transition-all focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      {/* Senior Contacts Grid */}
      <div className="p-6 flex-1 overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-cyan-500/20">
        {sortedContacts.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-bounce" />
            <p className="text-xs font-mono text-slate-400">No senior contact channels found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-slate-950/50 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 shadow-xl flex flex-col items-center text-center"
              >
                {/* Tactical Corner Decos */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors" />

                {/* Profile Image Container */}
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 group-hover:border-cyan-500/60 p-1 bg-slate-900 overflow-hidden shrink-0 mb-4 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  {contact.photoUrl ? (
                    <img
                      src={contact.photoUrl}
                      alt={contact.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-850 flex items-center justify-center text-slate-500 font-bold text-2xl uppercase">
                      {contact.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider mb-1 group-hover:text-cyan-400 transition-colors">
                  {contact.name}
                </h3>
                <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-4">Senior Operative</p>

                {/* Contact Actions */}
                <div className="w-full space-y-2 mt-auto pt-3 border-t border-slate-900">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center justify-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-cyan-300 transition-all font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{contact.phone}</span>
                  </a>

                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center justify-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-cyan-300 transition-all font-mono break-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{contact.email}</span>
                  </a>

                  {/* Micro Exporter */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 px-1 pt-1.5 border-t border-slate-900/40">
                    <span>Export Card:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadContactCard(contact, 'txt')}
                        className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Download Contact TXT Notes"
                      >
                        TXT
                      </button>
                      <span className="text-slate-700">|</span>
                      <button
                        onClick={() => downloadContactCard(contact, 'md')}
                        className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Download Contact Markdown Notes"
                      >
                        MD
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
