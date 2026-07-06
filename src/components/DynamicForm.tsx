import React, { useState } from 'react';
import { FormField } from '../types';
import { Send, CheckCircle, Upload, HelpCircle, FileCheck, Download, Printer } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, compressImage } from '../lib/firebase';
import { motion } from 'motion/react';

interface DynamicFormProps {
  fields: FormField[];
  visitorNickname: string;
  presetAnswers?: Record<string, any>;
}

export default function DynamicForm({ fields, visitorNickname, presetAnswers }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    return { 
      student_id: visitorNickname || '',
      ...(presetAnswers || {})
    };
  });
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync visitorNickname (GST) and presetAnswers to formData
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...(presetAnswers || {}),
      student_id: visitorNickname || prev.student_id || ''
    }));
  }, [visitorNickname, presetAnswers]);

  // Sort fields by order ascending
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const downloadResponseNotes = (format: 'txt' | 'md') => {
    let content = '';
    const dateStr = new Date().toLocaleString();
    
    if (format === 'txt') {
      content = `================================================
UFTB CYBER SECURITY DEPARTMENT TRANSMISSION RECEIPT
================================================
OPERATOR:  ${visitorNickname.toUpperCase()}
DATE:      ${dateStr}
================================================\n\n`;

      sortedFields.forEach((field) => {
        const val = formData[field.id];
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
Receipt secure signature recorded in Firestore Mainframe.`;
    } else {
      content = `# Transmission Receipt: ${visitorNickname}

* **Department Node Registry Verification**
* **Date:** ${dateStr}

---

## Form Submissions

`;

      sortedFields.forEach((field) => {
        const val = formData[field.id];
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
    link.download = `cyber_transmission_${visitorNickname.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleFileChange = async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (500KB) for non-image attachments to ensure they fit in Firestore safely
    if (!file.type.startsWith('image/') && file.size > 500 * 1024) {
      alert('Attachment too large. Please upload files smaller than 500KB to stay within secure network constraints.');
      return;
    }

    setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));

    try {
      let base64 = '';
      if (file.type.startsWith('image/')) {
        // Compress uploaded image files to max 600x600 px with 0.6 quality (creates a ultra-small ~20-40KB file)
        base64 = await compressImage(file, 600, 600, 0.6);
      } else {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }

      handleInputChange(fieldId, {
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64,
      });
    } catch (err) {
      console.error('Error handling file:', err);
      alert('File processing failed.');
    }
  };

  const handleCheckboxGroupChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = Array.isArray(formData[fieldId]) ? [...formData[fieldId]] : [];
    if (checked) {
      currentValues.push(option);
    } else {
      const idx = currentValues.indexOf(option);
      if (idx > -1) currentValues.splice(idx, 1);
    }
    handleInputChange(fieldId, currentValues);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    sortedFields.forEach((field) => {
      const val = formData[field.id];
      const isFieldEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0) ||
        (field.type === 'file' && typeof val !== 'object');

      if (field.required && isFieldEmpty) {
        errors[field.id] = `${field.label} is required.`;
        isValid = false;
      } else if (!isFieldEmpty) {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            errors[field.id] = 'Please enter a valid email address.';
            isValid = false;
          }
        } else if (field.type === 'phone') {
          const phoneRegex = /^[+]?[0-9\s\-()]{7,18}$/;
          if (!phoneRegex.test(val)) {
            errors[field.id] = 'Please enter a valid phone number.';
            isValid = false;
          }
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(formErrors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(`field-group-${firstErrorKey}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Save submission permanently in Firestore
      await addDoc(collection(db, 'submissions'), {
        visitorNickname,
        answers: formData,
        submittedAt: Date.now(),
      });

      setSubmitSuccess(true);
      // Keep formData so they can edit and update repeatedly without losing typed data
    } catch (err) {
      console.error('Error saving submission:', err);
      alert('Transmission failed. Check network firewalls and retry.');
      handleFirestoreError(err, OperationType.CREATE, 'submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div id="form-success-card" className="bg-slate-900/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-400/40" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400/40" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-400/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-400/40" />

        <div className="p-3 bg-emerald-950/40 rounded-full border border-emerald-500/20 w-fit mx-auto mb-4 animate-pulse">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>

        <h3 className="text-xl font-sans font-bold text-white mb-2">
          Transmission Successful
        </h3>
        <p className="text-xs font-mono text-emerald-400/70 mb-6">
          PACKET RECEIVED AND SEED DECRYPTED SUCCESSFULLY.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          Thank you, {visitorNickname}. Your security record and community metrics have been recorded in the permanent decentralized mainframe database.
        </p>

        {/* Exporter panel */}
        <div className="flex flex-col gap-2.5 bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl mb-6">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Download Submission Receipt:</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              id="download-form-txt"
              onClick={() => downloadResponseNotes('txt')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-2xs uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              title="Download TXT Note Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TXT Receipt</span>
            </button>
            <button
              id="download-form-md"
              onClick={() => downloadResponseNotes('md')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-2xs uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              title="Download MD Note Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>MD Receipt</span>
            </button>
            <button
              id="print-form-receipt"
              onClick={() => window.print()}
              className="bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 font-mono text-2xs uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              title="Print Receipt to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        <button
          id="submit-another-btn"
          onClick={() => setSubmitSuccess(false)}
          className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 font-mono text-2xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 w-full"
        >
          Submit Another Record
        </button>
      </div>
    );
  }

  return (
    <div id="dynamic-form-card" className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
      {/* Visual background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial-[circle_at_top_right,rgba(6,182,212,0.03)_0%,transparent_70%] pointer-events-none" />

      <div className="mb-4">
        <h2 className="text-xs font-mono text-emerald-400 uppercase tracking-tighter mb-1.5 flex items-center">
          <span className="w-2 h-2 bg-emerald-400 mr-2 rounded-full animate-pulse"></span>
          Info Submission
        </h2>
        <p className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-wider leading-relaxed">
          Complete fields to verify operational node registry.
        </p>
      </div>

      {sortedFields.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl">
          <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
          <p className="text-xs font-mono text-slate-400">Mainframe fields not configured by network admin yet.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {sortedFields.map((field) => {
            const hasError = !!formErrors[field.id];
            const value = formData[field.id] || '';

            return (
              <div
                id={`field-group-${field.id}`}
                key={field.id}
                className="space-y-1.5 relative group"
              >
                <label className="block text-[10px] text-slate-500 uppercase ml-1 font-mono tracking-wider">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1 font-bold">*</span>}
                </label>

                {/* Switch Render Input Types */}
                {field.type === 'textarea' ? (
                  <textarea
                    id={`input-${field.id}`}
                    placeholder={field.placeholder || `Enter ${field.label}...`}
                    value={value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    rows={3}
                    className={`w-full bg-slate-950/60 border ${
                      hasError ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-1 rounded-xl px-4 py-2.5 text-xs text-white transition-all`}
                  />
                ) : field.type === 'dropdown' ? (
                  <select
                    id={`input-${field.id}`}
                    value={value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className={`w-full bg-slate-950/60 border ${
                      hasError ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-1 rounded-xl px-4 py-2.5 text-xs text-slate-300 transition-all`}
                  >
                    <option value="" className="text-slate-500 bg-slate-950">Select an option...</option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt} className="bg-slate-950 text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  field.options && field.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-700">
                      {field.options.map((opt, i) => {
                        const checkedList = Array.isArray(value) ? value : [];
                        const isChecked = checkedList.includes(opt);
                        return (
                          <label key={i} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxGroupChange(field.id, opt, e.target.checked)}
                              className="accent-cyan-500 rounded border-slate-700 bg-slate-950 w-4 h-4 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer py-1">
                      <input
                        id={`input-${field.id}`}
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleInputChange(field.id, e.target.checked)}
                        className="accent-cyan-500 rounded border-slate-700 bg-slate-950 w-4 h-4 cursor-pointer mt-0.5"
                      />
                      <span className="leading-tight">{field.placeholder || `Accept agreement`}</span>
                    </label>
                  )
                ) : field.type === 'radio' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-700">
                    {field.options?.map((opt, i) => (
                      <label key={i} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer py-1">
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          checked={value === opt}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="accent-cyan-500 bg-slate-950 w-4 h-4 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : field.type === 'file' ? (
                  <div className="relative">
                    <input
                      id={`input-${field.id}`}
                      type="file"
                      onChange={(e) => handleFileChange(field.id, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`input-${field.id}`}
                      className={`w-full flex items-center justify-between bg-slate-950/60 border ${
                        hasError ? 'border-red-500/50' : 'border-slate-700 hover:border-cyan-500/50'
                      } rounded-xl px-4 py-3 text-xs text-slate-400 cursor-pointer transition-all`}
                    >
                      <span className="flex items-center space-x-2">
                        {value ? <FileCheck className="w-4 h-4 text-green-400 animate-pulse" /> : <Upload className="w-4 h-4 text-cyan-400" />}
                        <span className={value ? 'text-green-300 font-mono font-medium' : ''}>
                          {fileNames[field.id] || field.placeholder || 'Upload local credential...'}
                        </span>
                      </span>
                      <span className="bg-cyan-950/60 border border-slate-700 text-cyan-400 font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded">
                        Browse
                      </span>
                    </label>
                  </div>
                ) : (
                  <input
                    id={`input-${field.id}`}
                    type={field.type === 'phone' ? 'tel' : field.type}
                    placeholder={field.placeholder || `Enter ${field.label}...`}
                    value={value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className={`w-full bg-slate-950/60 border ${
                      hasError ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-1 rounded-xl px-4 py-2.5 text-xs text-white transition-all`}
                  />
                )}

                {hasError && (
                  <p className="text-[10px] text-red-400 font-mono flex items-center mt-1">
                    <span className="mr-1">⚠</span> {formErrors[field.id]}
                  </p>
                )}
              </div>
            );
          })}

          <button
            id="submit-form-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500 text-cyan-400 font-mono py-3 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
                <span>Transmitting Packet...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Upload Data</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
