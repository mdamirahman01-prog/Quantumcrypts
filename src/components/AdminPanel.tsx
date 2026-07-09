import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, compressImage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  LogoConfig, 
  WelcomeMessage, 
  Memory, 
  GSTPreset,
  Notice, 
  FormField, 
  Submission, 
  FieldType,
  SeniorContact,
  DistrictSenior
} from '../types';
import SubmissionDetailModal from './SubmissionDetailModal';
import { 
  ShieldAlert, 
  Terminal, 
  LayoutDashboard, 
  Image, 
  MessageSquare, 
  UserCheck, 
  BellRing, 
  Wrench, 
  FolderGit2, 
  Save, 
  Trash2, 
  Plus, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Pin, 
  Archive, 
  Check, 
  Download, 
  Printer, 
  Search, 
  Settings, 
  RefreshCw, 
  X,
  Database,
  Users,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';

const BANGLADESH_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
  'Chapainawabganj', 'Chattogram', 'Chuadanga', 'Cumilla', "Cox's Bazar", 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni',
  'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah',
  'Joypurhat', 'Khagrachari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat',
  'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh',
  'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali',
  'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon'
].sort();

interface AdminPanelProps {
  onClose: () => void;
  logoConfig: LogoConfig | null;
  onLogoChange: (newLogoUrl: string) => void;
  onDataRefresh: () => Promise<void>;
  welcomeMessages: WelcomeMessage[];
  memories: Memory[];
  gstPresets: GSTPreset[];
  notices: Notice[];
  fields: FormField[];
  submissions: Submission[];
  totalVisitorsCount: number;
  seniorContacts: SeniorContact[];
  districtSeniors: DistrictSenior[];
}

export default function AdminPanel({
  onClose,
  logoConfig,
  onLogoChange,
  onDataRefresh,
  welcomeMessages,
  memories,
  gstPresets,
  notices,
  fields,
  submissions,
  totalVisitorsCount,
  seniorContacts,
  districtSeniors
}: AdminPanelProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cyber_admin_authenticated') === 'true' &&
           sessionStorage.getItem('cyber_admin_authenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logo_welcome' | 'memories' | 'notices' | 'builder' | 'submissions' | 'gst_presets' | 'senior_contacts' | 'district_connect'>('dashboard');

  // Loading indicator for saves
  const [isActionPending, setIsActionPending] = useState(false);

  // Custom confirmation and alert states to bypass iframe sandboxing limitations of window.confirm and alert
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 4000);
  };

  const askConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDestructive = false,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText,
      cancelText,
    });
  };

  // Editor Sub-states
  // --- Senior Contacts ---
  const [seniorContactForm, setSeniorContactForm] = useState({ name: '', phone: '', email: '', photoUrl: '' });
  const [editingSeniorContactId, setEditingSeniorContactId] = useState<string | null>(null);

  // --- District Connect ---
  const [districtSeniorForm, setDistrictSeniorForm] = useState({ name: '', studentId: '', district: '', imageUrl: '' });
  const [editingDistrictSeniorId, setEditingDistrictSeniorId] = useState<string | null>(null);
  const [districtSeniorSearch, setDistrictSeniorSearch] = useState('');

  // --- Logo Config ---
  const [tempLogoUrl, setTempLogoUrl] = useState('');

  // --- Welcome Messages ---
  const [newWelcomeMsg, setNewWelcomeMsg] = useState('');
  const [editingWelcomeId, setEditingWelcomeId] = useState<string | null>(null);
  const [editingWelcomeText, setEditingWelcomeText] = useState('');

  // --- Memories ---
  const [memoryForm, setMemoryForm] = useState({ title: '', description: '', imageUrl: '', date: '' });
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);

  // --- GST Presets ---
  const [presetGst, setPresetGst] = useState('');
  const [presetAnswers, setPresetAnswers] = useState<Record<string, any>>({});
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  // --- Notices ---
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', date: '', attachmentUrl: '', pinned: false, hidden: false, archived: false });
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  // --- Form Builder ---
  const [fieldForm, setFieldForm] = useState<{ label: string; type: FieldType; required: boolean; placeholder: string; optionsString: string }>({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    optionsString: '',
  });
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // --- Submissions Manager ---
  const [subSearch, setSubSearch] = useState('');
  const [subSortKey, setSubSortKey] = useState<'submittedAt' | 'visitorNickname'>('submittedAt');
  const [subSortOrder, setSubSortOrder] = useState<'asc' | 'desc'>('desc');
  const [subFilterFieldId, setSubFilterFieldId] = useState('');
  const [subFilterValue, setSubFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedInspectSub, setSelectedInspectSub] = useState<Submission | null>(null);

  // Default credentials
  const DEFAULT_USERNAME = 'aamyr';
  const DEFAULT_PASSWORD = 'abdullahsirxudi';

  // Verify and enforce local session
  useEffect(() => {
    const isAuth = localStorage.getItem('cyber_admin_authenticated') === 'true' &&
                   sessionStorage.getItem('cyber_admin_authenticated') === 'true';
    if (!isAuth) {
      setIsAuthenticated(false);
      onClose(); // Force redirect back to home page if session is missing
    } else {
      setIsAuthenticated(true);
    }
  }, [onClose]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('cyber_admin_authenticated', 'true');
      sessionStorage.setItem('cyber_admin_authenticated', 'true');
      setLoginError('');
    } else {
      setLoginError('ACCESS DENIED: Credentials mismatch or unauthorized token.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cyber_admin_authenticated');
    sessionStorage.removeItem('cyber_admin_authenticated');
    onClose(); // Close the Admin panel view on logout
  };

  // --- CRUD LOGIC ---

  // 1. Logo management
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsActionPending(true);
    try {
      const base64Str = await compressImage(file, 200, 200, 0.8);
      const logoDocRef = doc(db, 'config', 'logo');
      await setDoc(logoDocRef, {
        logoUrl: base64Str,
        updatedAt: Date.now(),
      });
      onLogoChange(base64Str);
      showToast('Community logo uploaded successfully!');
    } catch (err) {
      console.error('Error saving logo:', err);
      showToast('Firestore logo save failed.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteLogo = () => {
    askConfirmation(
      'Purge Community Logo',
      'Are you sure you want to permanently delete the community logo from Firestore?',
      async () => {
        setIsActionPending(true);
        try {
          const logoDocRef = doc(db, 'config', 'logo');
          await setDoc(logoDocRef, {
            logoUrl: '',
            updatedAt: Date.now(),
          });
          onLogoChange('');
          showToast('Community logo deleted successfully!');
        } catch (err) {
          console.error(err);
          showToast('Logo removal failed.', 'error');
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 2. Welcome Messages
  const handleAddWelcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWelcomeMsg.trim()) return;
    setIsActionPending(true);
    try {
      await addDoc(collection(db, 'welcome_messages'), {
        message: newWelcomeMsg.trim(),
        enabled: true,
        createdAt: Date.now(),
      });
      setNewWelcomeMsg('');
      await onDataRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleToggleWelcomeEnabled = async (id: string, currentVal: boolean) => {
    setIsActionPending(true);
    try {
      await updateDoc(doc(db, 'welcome_messages', id), {
        enabled: !currentVal,
      });
      await onDataRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUpdateWelcome = async (id: string) => {
    if (!editingWelcomeText.trim()) return;
    setIsActionPending(true);
    try {
      await updateDoc(doc(db, 'welcome_messages', id), {
        message: editingWelcomeText.trim(),
      });
      setEditingWelcomeId(null);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteWelcome = (id: string) => {
    askConfirmation(
      'Purge Welcome Message',
      'Are you sure you want to delete this welcome packet template permanently from Firestore?',
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'welcome_messages', id));
          await onDataRefresh();
          showToast('Welcome message purged!');
        } catch (err) {
          console.error(err);
          showToast('Failed to delete welcome packet.', 'error');
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 3. Memories Management
  const handleMemoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsActionPending(true);
    try {
      const base64Str = await compressImage(file, 800, 800, 0.7);
      setMemoryForm((prev) => ({ ...prev, imageUrl: base64Str }));
      showToast('Memory image processed and compressed successfully!');
    } catch (err) {
      console.error('Error uploading memory image:', err);
      showToast('Failed to compress/upload image.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryForm.title.trim() || !memoryForm.description.trim() || !memoryForm.imageUrl) {
      showToast('Please provide a title, description, and upload a memory image.', 'error');
      return;
    }
    setIsActionPending(true);
    try {
      if (editingMemoryId) {
        await updateDoc(doc(db, 'memories', editingMemoryId), {
          title: memoryForm.title.trim(),
          description: memoryForm.description.trim(),
          imageUrl: memoryForm.imageUrl,
          date: memoryForm.date.trim() || new Date().toLocaleDateString(),
        });
        showToast('Memory entry updated successfully!');
      } else {
        await addDoc(collection(db, 'memories'), {
          title: memoryForm.title.trim(),
          description: memoryForm.description.trim(),
          imageUrl: memoryForm.imageUrl,
          date: memoryForm.date.trim() || new Date().toLocaleDateString(),
          createdAt: Date.now(),
        });
        setMemoryForm({ title: '', description: '', imageUrl: '', date: '' });
        showToast('Memory entry logged successfully!');
      }
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      showToast('Memory save failed.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteMemory = (id: string) => {
    askConfirmation(
      'Purge Memory',
      'Are you sure you want to permanently delete this memory asset?',
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'memories', id));
          await onDataRefresh();
          showToast('Memory deleted successfully!');
        } catch (err: any) {
          console.error(err);
          showToast(`Memory deletion failed: ${err.message || err}`, 'error');
          handleFirestoreError(err, OperationType.DELETE, `memories/${id}`);
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 3a. Senior Contacts Management
  const handleSeniorContactPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsActionPending(true);
    try {
      const base64Str = await compressImage(file, 400, 400, 0.7);
      setSeniorContactForm((prev) => ({ ...prev, photoUrl: base64Str }));
      showToast('Advisor photo processed successfully!');
    } catch (err) {
      console.error('Error uploading contact photo:', err);
      showToast('Failed to compress/upload contact photo.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleSeniorContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seniorContactForm.name.trim() || !seniorContactForm.phone.trim() || !seniorContactForm.email.trim() || !seniorContactForm.photoUrl) {
      showToast('Please provide a name, phone, email, and upload a contact photo.', 'error');
      return;
    }
    setIsActionPending(true);
    try {
      if (editingSeniorContactId) {
        await updateDoc(doc(db, 'senior_contacts', editingSeniorContactId), {
          name: seniorContactForm.name.trim(),
          phone: seniorContactForm.phone.trim(),
          email: seniorContactForm.email.trim(),
          photoUrl: seniorContactForm.photoUrl,
        });
        showToast('Senior advisor contact updated successfully!');
      } else {
        await addDoc(collection(db, 'senior_contacts'), {
          name: seniorContactForm.name.trim(),
          phone: seniorContactForm.phone.trim(),
          email: seniorContactForm.email.trim(),
          photoUrl: seniorContactForm.photoUrl,
          createdAt: Date.now(),
        });
        setSeniorContactForm({ name: '', phone: '', email: '', photoUrl: '' });
        showToast('Senior advisor contact added successfully!');
      }
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      showToast('Senior contact save failed.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteSeniorContact = (id: string) => {
    askConfirmation(
      'Purge Advisor Contact',
      'Are you sure you want to delete this senior advisor contact record?',
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'senior_contacts', id));
          await onDataRefresh();
          showToast('Senior contact deleted successfully!');
        } catch (err: any) {
          console.error(err);
          showToast(`Senior contact deletion failed: ${err.message || err}`, 'error');
          handleFirestoreError(err, OperationType.DELETE, `senior_contacts/${id}`);
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 3a-2. District Connect Management
  const handleDistrictSeniorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsActionPending(true);
    try {
      const base64Str = await compressImage(file, 400, 400, 0.7);
      setDistrictSeniorForm((prev) => ({ ...prev, imageUrl: base64Str }));
      showToast('Profile image processed successfully!');
    } catch (err) {
      console.error('Error uploading senior image:', err);
      showToast('Failed to compress/upload profile image.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDistrictSeniorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtSeniorForm.name.trim() || !districtSeniorForm.studentId.trim() || !districtSeniorForm.district.trim() || !districtSeniorForm.imageUrl) {
      showToast('Please provide a name, student ID, district, and upload a profile picture.', 'error');
      return;
    }
    setIsActionPending(true);
    try {
      if (editingDistrictSeniorId) {
        await updateDoc(doc(db, 'district_seniors', editingDistrictSeniorId), {
          name: districtSeniorForm.name.trim(),
          studentId: districtSeniorForm.studentId.trim(),
          district: districtSeniorForm.district.trim(),
          imageUrl: districtSeniorForm.imageUrl,
          updatedAt: Date.now(),
        });
        showToast('District senior updated successfully!');
      } else {
        await addDoc(collection(db, 'district_seniors'), {
          name: districtSeniorForm.name.trim(),
          studentId: districtSeniorForm.studentId.trim(),
          district: districtSeniorForm.district.trim(),
          imageUrl: districtSeniorForm.imageUrl,
          createdAt: Date.now(),
        });
        showToast('District senior added successfully!');
      }
      setDistrictSeniorForm({ name: '', studentId: '', district: '', imageUrl: '' });
      setEditingDistrictSeniorId(null);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      showToast('District senior save failed.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteDistrictSenior = (id: string) => {
    askConfirmation(
      'Purge District Senior',
      'Are you sure you want to delete this district senior operative record?',
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'district_seniors', id));
          await onDataRefresh();
          showToast('District senior deleted successfully!');
        } catch (err: any) {
          console.error(err);
          showToast(`District senior deletion failed: ${err.message || err}`, 'error');
          handleFirestoreError(err, OperationType.DELETE, `district_seniors/${id}`);
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 3b. GST Presets Management
  const handlePresetAnswerChange = (fieldId: string, value: any) => {
    setPresetAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePresetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGst = presetGst.trim();
    if (!cleanGst) {
      showToast('GST Roll/ID is required.', 'error');
      return;
    }
    setIsActionPending(true);
    try {
      const presetRef = doc(db, 'gst_presets', cleanGst);
      
      const cleanedAnswers: Record<string, any> = {};
      Object.entries(presetAnswers).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanedAnswers[k] = v;
        }
      });

      await setDoc(presetRef, {
        id: cleanGst,
        answers: cleanedAnswers,
        updatedAt: Date.now(),
      });

      if (editingPresetId) {
        showToast('GST prefill preset updated successfully!');
      } else {
        setPresetGst('');
        setPresetAnswers({});
        setEditingPresetId(null);
        showToast('GST prefill preset created successfully!');
      }
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      showToast('Failed to save GST preset.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeletePreset = (id: string) => {
    askConfirmation(
      'Purge Prefill Preset',
      `Are you sure you want to delete the prefill preset for GST: ${id}?`,
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'gst_presets', id));
          await onDataRefresh();
          showToast('Prefill preset deleted successfully!');
        } catch (err) {
          console.error(err);
          showToast('Failed to delete preset.', 'error');
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 4. Notice Board
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.description.trim() || !noticeForm.date) return;
    setIsActionPending(true);
    try {
      if (editingNoticeId) {
        await updateDoc(doc(db, 'notices', editingNoticeId), {
          title: noticeForm.title.trim(),
          description: noticeForm.description.trim(),
          date: noticeForm.date,
          attachmentUrl: noticeForm.attachmentUrl.trim(),
          pinned: noticeForm.pinned,
          hidden: noticeForm.hidden,
          archived: noticeForm.archived,
        });
        showToast('Notice bulletin updated successfully!');
      } else {
        await addDoc(collection(db, 'notices'), {
          title: noticeForm.title.trim(),
          description: noticeForm.description.trim(),
          date: noticeForm.date,
          attachmentUrl: noticeForm.attachmentUrl.trim(),
          pinned: noticeForm.pinned,
          hidden: noticeForm.hidden,
          archived: noticeForm.archived,
          createdAt: Date.now(),
        });
        setNoticeForm({ title: '', description: '', date: '', attachmentUrl: '', pinned: false, hidden: false, archived: false });
        showToast('Notice bulletin published successfully!');
      }
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      showToast('Failed to save notice bulletin.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteNotice = (id: string) => {
    askConfirmation(
      'Purge Notice Bulletin',
      'Are you sure you want to permanently delete this notice bulletin? This cannot be undone.',
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'notices', id));
          await onDataRefresh();
          showToast('Notice bulletin purged successfully!');
        } catch (err: any) {
          console.error(err);
          showToast(`Notice deletion failed: ${err.message || err}`, 'error');
          handleFirestoreError(err, OperationType.DELETE, `notices/${id}`);
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  const handleToggleNoticeFlag = async (id: string, field: 'pinned' | 'hidden' | 'archived', currentVal: boolean) => {
    setIsActionPending(true);
    try {
      await updateDoc(doc(db, 'notices', id), {
        [field]: !currentVal,
      });
      await onDataRefresh();
      showToast(`Notice flag '${field}' updated.`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update notice status.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  // 5. Form Builder Fields
  const handleFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) return;

    setIsActionPending(true);
    // Parse options list
    const options = fieldForm.optionsString
      ? fieldForm.optionsString.split(',').map((o) => o.trim()).filter((o) => !!o)
      : [];

    const fieldId = editingFieldId || fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      if (editingFieldId) {
        // Edit mode
        await updateDoc(doc(db, 'form_fields', editingFieldId), {
          label: fieldForm.label.trim(),
          type: fieldForm.type,
          required: fieldForm.required,
          placeholder: fieldForm.placeholder.trim(),
          options,
        });
        showToast('Custom field updated successfully!');
      } else {
        // Add mode
        const maxOrder = fields.reduce((max, f) => (f.order > max ? f.order : max), -1);
        await setDoc(doc(db, 'form_fields', fieldId), {
          id: fieldId,
          label: fieldForm.label.trim(),
          type: fieldForm.type,
          required: fieldForm.required,
          placeholder: fieldForm.placeholder.trim(),
          options,
          order: maxOrder + 1,
        });
        setFieldForm({ label: '', type: 'text', required: false, placeholder: '', optionsString: '' });
        showToast('Custom field added successfully!');
      }
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      showToast('Failed to save custom field.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReorderField = async (id: string, currentIndex: number, direction: 'up' | 'down') => {
    const sorted = [...fields].sort((a, b) => a.order - b.order);
    const swapWithIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapWithIndex < 0 || swapWithIndex >= sorted.length) return;

    setIsActionPending(true);
    try {
      const targetField = sorted[swapWithIndex];
      const currentDocRef = doc(db, 'form_fields', id);
      const targetDocRef = doc(db, 'form_fields', targetField.id);

      await updateDoc(currentDocRef, { order: swapWithIndex });
      await updateDoc(targetDocRef, { order: currentIndex });

      await onDataRefresh();
      showToast('Form order updated.');
    } catch (err) {
      console.error(err);
      showToast('Failed to reorder fields.', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteField = (id: string) => {
    askConfirmation(
      'Remove Custom Field',
      'Purging this field does NOT remove existing submission keys, but will disable the field in forms. Continue?',
      async () => {
        setIsActionPending(true);
        try {
          await deleteDoc(doc(db, 'form_fields', id));
          await onDataRefresh();
          showToast('Custom form field removed successfully!');
        } catch (err: any) {
          console.error(err);
          showToast(`Custom field deletion failed: ${err.message || err}`, 'error');
          handleFirestoreError(err, OperationType.DELETE, `form_fields/${id}`);
        } finally {
          setIsActionPending(false);
        }
      },
      true
    );
  };

  // 6. Submissions Delete & Exporters
  const handleDeleteSubmission = async (id: string, skipConfirm = false) => {
    const performDelete = async () => {
      setIsActionPending(true);
      try {
        await deleteDoc(doc(db, 'submissions', id));
        await onDataRefresh();
        showToast('Community member record purged successfully!');
      } catch (err: any) {
        console.error(err);
        showToast(`Purging record failed: ${err.message || err}`, 'error');
        handleFirestoreError(err, OperationType.DELETE, `submissions/${id}`);
      } finally {
        setIsActionPending(false);
      }
    };

    if (skipConfirm) {
      await performDelete();
    } else {
      askConfirmation(
        'Purge Member Record',
        'Are you absolutely sure you want to permanently delete this community member submission record? This action is irreversible.',
        performDelete,
        true
      );
    }
  };

  // CSV and Excel Exporting Engines
  const handleExportData = (format: 'csv' | 'excel') => {
    if (submissions.length === 0) {
      showToast('No record packets to transmit.', 'error');
      return;
    }

    // Build header columns
    const headerCols = ['Submission ID', 'Visitor Nickname', 'Submitted At'];
    const sortedFields = [...fields].sort((a, b) => a.order - b.order);
    sortedFields.forEach((f) => headerCols.push(f.label));

    // Convert rows
    const rows = submissions.map((sub) => {
      const rowData = [
        sub.id,
        sub.visitorNickname,
        new Date(sub.submittedAt).toISOString()
      ];

      sortedFields.forEach((f) => {
        const val = sub.answers[f.id];
        if (val === undefined || val === null) {
          rowData.push('');
        } else if (f.type === 'file' && typeof val === 'object') {
          rowData.push(val.name || 'File Link');
        } else if (Array.isArray(val)) {
          rowData.push(val.join('; '));
        } else {
          rowData.push(String(val).replace(/"/g, '""')); // escape quotes
        }
      });
      return rowData;
    });

    // Generate string content
    const csvContent = [
      headerCols.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = "\uFEFF"; // UTF-8 BOM indicator for proper Excel compatibility!
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cyber_community_submissions_${Date.now()}.${format === 'excel' ? 'csv' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Submissions
  const filteredSubs = submissions.filter((sub) => {
    const matchesSearch = sub.visitorNickname.toLowerCase().includes(subSearch.toLowerCase());
    
    let matchesFilter = true;
    if (subFilterFieldId && subFilterValue) {
      const val = sub.answers[subFilterFieldId];
      if (Array.isArray(val)) {
        matchesFilter = val.some((v) => String(v).toLowerCase().includes(subFilterValue.toLowerCase()));
      } else {
        matchesFilter = String(val || '').toLowerCase().includes(subFilterValue.toLowerCase());
      }
    }
    return matchesSearch && matchesFilter;
  });

  const sortedSubs = [...filteredSubs].sort((a, b) => {
    let comp = 0;
    if (subSortKey === 'submittedAt') {
      comp = a.submittedAt - b.submittedAt;
    } else {
      comp = a.visitorNickname.localeCompare(b.visitorNickname);
    }
    return subSortOrder === 'asc' ? comp : -comp;
  });

  // Paginated elements
  const totalSubPages = Math.ceil(sortedSubs.length / itemsPerPage);
  const paginatedSubs = sortedSubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isAuthenticated) {
    return (
      <div id="admin-login-wrapper" className="flex items-center justify-center min-h-screen px-4">
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(239,68,68,0.03)_0%,transparent_70%] pointer-events-none" />

        <motion.div
          id="admin-login-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
        >
          {/* Edge styles */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500/40" />

          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 bg-red-950/30 rounded-xl border border-red-500/20 mb-3 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-sans font-bold text-white tracking-tight">
              COMMUNITY MAINFRAME LOCKOUT
            </h2>
            <p className="text-[10px] font-mono text-red-400/70 uppercase tracking-widest mt-1">
              PROCEED ONLY WITH COMMAND AUTHORIZATION
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-red-400/70 mb-1.5">Identifier ID</label>
              <input
                id="admin-user-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., admin"
                className="w-full bg-slate-950/60 border border-red-500/20 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-red-400/70 mb-1.5">Authorization Code</label>
              <input
                id="admin-pass-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g., cyberadmin123"
                className="w-full bg-slate-950/60 border border-red-500/20 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-mono"
                required
              />
            </div>

            {loginError && (
              <p className="text-[10px] text-red-400 font-mono bg-red-950/30 border border-red-500/20 p-2.5 rounded-lg">
                ⚠ {loginError}
              </p>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                id="admin-cancel-login"
                type="button"
                onClick={onClose}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-2xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
              >
                Abort
              </button>
              <button
                id="admin-login-submit"
                type="submit"
                className="w-1/2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-200 font-mono text-2xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer active:scale-95"
              >
                Decrypt Panel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="admin-mainframe-wrapper" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.03)_0%,transparent_50%)] pointer-events-none" />

      {/* Admin Nav Header */}
      <header className="bg-slate-900/60 border-b border-cyan-500/20 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 rounded-xl">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-sans font-bold tracking-tight text-white uppercase flex items-center gap-1.5">
              Cyber Mainframe Control Center
              <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-mono">ROOT</span>
            </h1>
            <p className="text-[10px] font-mono text-cyan-500/60 tracking-wider">SECURE SEED DATABASE MODERATOR PORTAL</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="refresh-mainframe-data"
            onClick={async () => {
              setIsActionPending(true);
              await onDataRefresh();
              setIsActionPending(false);
            }}
            disabled={isActionPending}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-slate-400 hover:text-cyan-400 transition-colors border border-slate-700/60 cursor-pointer"
            title="Force refresh database arrays"
          >
            <RefreshCw className={`w-4 h-4 ${isActionPending ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-2xs uppercase px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Logout session
          </button>
          <button
            id="exit-mainframe-btn"
            onClick={onClose}
            className="bg-cyan-600/10 hover:bg-cyan-600/25 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Exit Mainframe
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left sidebar nav */}
        <aside className="w-full lg:w-64 bg-slate-900/30 border-r border-slate-800/80 p-4 space-y-2 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)]">
          <p className="text-[9px] font-mono uppercase text-slate-500 tracking-widest px-3 mb-2">Operational Sections</p>

          <button
            id="tab-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="tab-logo-btn"
            onClick={() => setActiveTab('logo_welcome')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'logo_welcome' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Logo & Welcome</span>
          </button>

          <button
            id="tab-memories-btn"
            onClick={() => setActiveTab('memories')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'memories' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Our Memories</span>
          </button>

          <button
            id="tab-notices-btn"
            onClick={() => setActiveTab('notices')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'notices' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>Notice Board</span>
          </button>

          <button
            id="tab-senior-contacts-btn"
            onClick={() => setActiveTab('senior_contacts')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'senior_contacts' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Senior Contacts</span>
          </button>

          <button
            id="tab-district-connect-btn"
            onClick={() => setActiveTab('district_connect')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'district_connect' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>District Connect</span>
          </button>

          <button
            id="tab-gst-presets-btn"
            onClick={() => setActiveTab('gst_presets')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'gst_presets' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>GST Auto-fills</span>
          </button>

          <button
            id="tab-builder-btn"
            onClick={() => setActiveTab('builder')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'builder' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Form Builder</span>
          </button>

          <button
            id="tab-submissions-btn"
            onClick={() => setActiveTab('submissions')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'submissions' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Submissions</span>
          </button>

          <div className="pt-6 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[10px] font-mono text-slate-500">Database Engine</p>
            <div className="mt-2 flex items-center justify-center space-x-1.5 text-[11px] font-mono text-cyan-400/80 bg-slate-900/50 p-2 border border-slate-800 rounded-lg">
              <Database className="w-3.5 h-3.5" />
              <span>FIRESTORE ONLINE</span>
            </div>
          </div>
        </aside>

        {/* Right dashboard workspace content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <div id="mainframe-dashboard" className="space-y-6">
              {/* Grid Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-cyan-500/10 p-5 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">Total Unique Visitors</p>
                  <p className="text-3xl font-sans font-bold text-white mt-1">{totalVisitorsCount}</p>
                </div>
                <div className="bg-slate-900/40 border border-cyan-500/10 p-5 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">Total Submissions</p>
                  <p className="text-3xl font-sans font-bold text-white mt-1">{submissions.length}</p>
                </div>
                <div className="bg-slate-900/40 border border-cyan-500/10 p-5 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">Active Notices</p>
                  <p className="text-3xl font-sans font-bold text-white mt-1">{notices.length}</p>
                </div>
                <div className="bg-slate-900/40 border border-cyan-500/10 p-5 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">Our Memories</p>
                  <p className="text-3xl font-sans font-bold text-white mt-1">{memories.length}</p>
                </div>
              </div>

              {/* Recent activity & quick actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent submissions logs */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    Latest Transmission Streams
                  </h3>

                  {submissions.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No recent packet telemetry received.</p>
                  ) : (
                    <div className="space-y-3">
                      {submissions.slice(0, 5).map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            <div>
                              <p className="font-sans font-semibold text-white">Operator: {sub.visitorNickname}</p>
                              <p className="text-[10px] font-mono text-slate-400">Stream ID: {sub.id}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400/60">
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick operations */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2">
                    Quick Operational Actions
                  </h3>

                  <button
                    id="quick-add-notice"
                    onClick={() => { setActiveTab('notices'); setEditingNoticeId(null); }}
                    className="w-full text-left bg-slate-950/60 hover:bg-slate-900 hover:border-cyan-500/30 border border-slate-800 p-3 rounded-xl flex items-center justify-between group transition-all text-xs cursor-pointer"
                  >
                    <div>
                      <p className="font-sans font-medium text-white group-hover:text-cyan-300">File New Bulletin Notice</p>
                      <p className="text-[10px] font-mono text-slate-500">Post announcements to community</p>
                    </div>
                    <Plus className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    id="quick-add-field"
                    onClick={() => { setActiveTab('builder'); setEditingFieldId(null); }}
                    className="w-full text-left bg-slate-950/60 hover:bg-slate-900 hover:border-cyan-500/30 border border-slate-800 p-3 rounded-xl flex items-center justify-between group transition-all text-xs cursor-pointer"
                  >
                    <div>
                      <p className="font-sans font-medium text-white group-hover:text-cyan-300">Inject Custom Field Key</p>
                      <p className="text-[10px] font-mono text-slate-500">Add questions to visitor form</p>
                    </div>
                    <Settings className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logo_welcome' && (
            <div id="logo-welcome-moderation" className="space-y-8">
              {/* Logo Settings */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                  Top Central Community Logo Settings
                </h3>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Preview box */}
                  <div className="w-32 h-32 bg-slate-950 rounded-2xl border border-cyan-500/10 flex items-center justify-center p-2 relative overflow-hidden group">
                    {logoConfig?.logoUrl ? (
                      <img
                        src={logoConfig.logoUrl}
                        alt="Logo Preview"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600 text-center uppercase tracking-wider">No Active Logo</span>
                    )}
                  </div>

                  <div className="space-y-4 flex-1">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Upload an image file (PNG, JPG, SVG, WebP) from your system. This logo replaces the main display at the top-center of the Cyber Community home and dashboards. The image is compressed and stored as a secure asset key inside Firebase Firestore database permanently.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <input
                        id="logo-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-image-upload"
                        className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-colors inline-block"
                      >
                        Upload Local Logo
                      </label>

                      {logoConfig?.logoUrl && (
                        <button
                          id="delete-logo-btn"
                          onClick={handleDeleteLogo}
                          className="bg-red-600/10 hover:bg-red-600/25 border border-red-500/30 text-red-400 font-mono text-2xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          Remove Current Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome messages list */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                  Welcome Messages Templates (Random Pool)
                </h3>

                {/* Form to add */}
                <form onSubmit={handleAddWelcome} className="flex gap-2.5 mb-6">
                  <input
                    id="welcome-msg-text-input"
                    type="text"
                    placeholder="Enter welcome message. MUST contain {nickname} where nickname should be injected..."
                    value={newWelcomeMsg}
                    onChange={(e) => setNewWelcomeMsg(e.target.value)}
                    className="flex-1 bg-slate-950/60 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
                    required
                  />
                  <button
                    id="welcome-msg-submit"
                    type="submit"
                    className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-xs uppercase px-4 rounded-xl cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Message
                  </button>
                </form>

                {/* Messages grid table list */}
                <div className="space-y-3">
                  {welcomeMessages.map((msg, idx) => (
                    <div key={msg.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs font-mono">
                      <div className="flex-1">
                        {editingWelcomeId === msg.id ? (
                          <div className="flex gap-2 w-full">
                            <input
                              type="text"
                              value={editingWelcomeText}
                              onChange={(e) => setEditingWelcomeText(e.target.value)}
                              className="flex-1 bg-slate-950 border border-cyan-500/40 text-white text-xs px-3 py-1 rounded"
                            />
                            <button
                              onClick={() => handleUpdateWelcome(msg.id)}
                              className="bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 text-green-300 px-3 py-1 rounded text-2xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWelcomeId(null)}
                              className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-2xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-200">
                            <span className="text-cyan-500/50 mr-2">#{idx+1}</span>
                            {msg.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleToggleWelcomeEnabled(msg.id, msg.enabled)}
                          className={`px-2.5 py-1 rounded border text-3xs uppercase tracking-wider cursor-pointer ${
                            msg.enabled ? 'bg-green-950/40 border-green-500/30 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {msg.enabled ? 'Active' : 'Disabled'}
                        </button>
                        
                        {editingWelcomeId !== msg.id && (
                          <button
                            onClick={() => { setEditingWelcomeId(msg.id); setEditingWelcomeText(msg.message); }}
                            className="p-1.5 bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteWelcome(msg.id)}
                          className="p-1.5 bg-slate-800 text-slate-300 hover:text-red-400 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memories' && (
            <div id="memories-moderation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form column */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-fit">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    {editingMemoryId ? 'Edit Memory Entry' : 'Create New Memory'}
                  </h3>

                  <form onSubmit={handleMemorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Memory Title</label>
                      <input
                        type="text"
                        value={memoryForm.title}
                        onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                        placeholder="e.g., Department Orientation 2026"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Description / Details</label>
                      <textarea
                        value={memoryForm.description}
                        onChange={(e) => setMemoryForm({ ...memoryForm, description: e.target.value })}
                        placeholder="Type memories context..."
                        rows={4}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Date / Timeframe (Optional)</label>
                      <input
                        type="text"
                        value={memoryForm.date}
                        onChange={(e) => setMemoryForm({ ...memoryForm, date: e.target.value })}
                        placeholder="e.g., March 2026"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Memory Photo (From My Device)</label>
                      <div className="mt-1 flex items-center gap-4">
                        <input
                          id="memory-image-upload-field"
                          type="file"
                          accept="image/*"
                          onChange={handleMemoryImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="memory-image-upload-field"
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-2xs uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition-colors inline-block"
                        >
                          Choose Image
                        </label>

                        {memoryForm.imageUrl && (
                          <div className="w-12 h-12 rounded border border-cyan-500/30 overflow-hidden shrink-0 bg-slate-950">
                            <img
                              src={memoryForm.imageUrl}
                              alt="Memory Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
                      >
                        {editingMemoryId ? 'Update Memory' : 'Save Memory'}
                      </button>
                      {editingMemoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemoryId(null);
                            setMemoryForm({ title: '', description: '', imageUrl: '', date: '' });
                          }}
                          className="bg-slate-800 text-slate-300 text-2xs px-3 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List column */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    Saved Department Memories
                  </h3>

                  {memories.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No department memories saved yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {memories.map((mem) => (
                        <div key={mem.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex gap-4 relative">
                          {mem.imageUrl && (
                            <div className="w-20 h-20 rounded-lg border border-slate-800 overflow-hidden shrink-0 bg-slate-950">
                              <img
                                src={mem.imageUrl}
                                alt={mem.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-sans font-bold text-white uppercase">{mem.title}</h4>
                                <span className="text-[9px] font-mono text-cyan-500/70 bg-cyan-950/20 border border-cyan-500/10 px-1.5 py-0.5 rounded">
                                  {mem.date}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingMemoryId(mem.id);
                                    setMemoryForm({ title: mem.title, description: mem.description, imageUrl: mem.imageUrl, date: mem.date });
                                  }}
                                  className="p-1 bg-slate-800 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMemory(mem.id)}
                                  className="p-1 bg-slate-800 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-2xs text-slate-300 leading-relaxed pt-1">
                              {mem.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div id="notices-moderation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notice Creator Form */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-fit">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    {editingNoticeId ? 'Decrypt and Edit Bulletin' : 'Broadcast New Bulletin'}
                  </h3>

                  <form onSubmit={handleNoticeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Bulletin Title</label>
                      <input
                        type="text"
                        value={noticeForm.title}
                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                        placeholder="e.g., Classes Suspended"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Notice Description</label>
                      <textarea
                        value={noticeForm.description}
                        onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
                        placeholder="Type notice bulletin body..."
                        rows={4}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Calendar Date Stamp</label>
                      <input
                        type="text"
                        value={noticeForm.date}
                        onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                        placeholder="e.g., October 24, 2026"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Attachment Protocol URL (Optional)</label>
                      <input
                        type="text"
                        value={noticeForm.attachmentUrl}
                        onChange={(e) => setNoticeForm({ ...noticeForm, attachmentUrl: e.target.value })}
                        placeholder="e.g., https://example.com/syllabus.pdf"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noticeForm.pinned}
                          onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
                          className="accent-cyan-500 rounded border-slate-800"
                        />
                        <span>Pin notice to top position</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noticeForm.hidden}
                          onChange={(e) => setNoticeForm({ ...noticeForm, hidden: e.target.checked })}
                          className="accent-cyan-500 rounded border-slate-800"
                        />
                        <span>Hide notice bulletin from page</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noticeForm.archived}
                          onChange={(e) => setNoticeForm({ ...noticeForm, archived: e.target.checked })}
                          className="accent-cyan-500 rounded border-slate-800"
                        />
                        <span>Archive notice record</span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
                      >
                        {editingNoticeId ? 'Update Notice' : 'Broadcast Notice'}
                      </button>
                      {editingNoticeId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoticeId(null);
                            setNoticeForm({ title: '', description: '', date: '', attachmentUrl: '', pinned: false, hidden: false, archived: false });
                          }}
                          className="bg-slate-800 text-slate-300 text-2xs px-3 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Notices List */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    Active Bulletin Stream
                  </h3>

                  {notices.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No notice bulletins broadcasted.</p>
                  ) : (
                    <div className="space-y-3">
                      {notices.map((n) => (
                        <div key={n.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {n.pinned && (
                                <span className="bg-cyan-950 text-cyan-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-wider">
                                  PINNED
                                </span>
                              )}
                              <h4 className="text-xs font-sans font-bold text-white uppercase">{n.title}</h4>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {/* Pin, Hide, Archive Flags */}
                              <button
                                onClick={() => handleToggleNoticeFlag(n.id, 'pinned', n.pinned)}
                                className={`p-1 rounded cursor-pointer ${n.pinned ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}
                                title="Pin Bulletin"
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleNoticeFlag(n.id, 'hidden', n.hidden)}
                                className={`p-1 rounded cursor-pointer ${n.hidden ? 'bg-red-950 text-red-400' : 'bg-green-950 text-green-400'}`}
                                title={n.hidden ? 'Hidden' : 'Visible'}
                              >
                                {n.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleToggleNoticeFlag(n.id, 'archived', n.archived)}
                                className={`p-1 rounded cursor-pointer ${n.archived ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-500'}`}
                                title="Archive bulletin"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit / Delete */}
                              <button
                                onClick={() => {
                                  setEditingNoticeId(n.id);
                                  setNoticeForm({
                                    title: n.title,
                                    description: n.description,
                                    date: n.date,
                                    attachmentUrl: n.attachmentUrl || '',
                                    pinned: n.pinned || false,
                                    hidden: n.hidden || false,
                                    archived: n.archived || false,
                                  });
                                }}
                                className="p-1 bg-slate-800 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNotice(n.id)}
                                className="p-1 bg-slate-800 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-2xs text-slate-400 font-mono">Timestamp: {n.date}</p>
                          <p className="text-2xs text-slate-200 leading-relaxed pt-1">{n.description}</p>
                          {n.attachmentUrl && (
                            <p className="text-[10px] font-mono text-cyan-400/80">
                              Attachment: <a href={n.attachmentUrl} target="_blank" rel="noreferrer" className="underline hover:text-cyan-300">{n.attachmentUrl}</a>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'senior_contacts' && (
            <div id="senior-contacts-moderation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Creator Form */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-fit">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    {editingSeniorContactId ? 'Decrypt and Edit Senior Contact' : 'Enlist New Senior Contact'}
                  </h3>

                  <form onSubmit={handleSeniorContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={seniorContactForm.name}
                        onChange={(e) => setSeniorContactForm({ ...seniorContactForm, name: e.target.value })}
                        placeholder="e.g., Prof. Abdullah Al Mamun"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={seniorContactForm.phone}
                        onChange={(e) => setSeniorContactForm({ ...seniorContactForm, phone: e.target.value })}
                        placeholder="e.g., +880 1712-345678"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={seniorContactForm.email}
                        onChange={(e) => setSeniorContactForm({ ...seniorContactForm, email: e.target.value })}
                        placeholder="e.g., mamun@university.edu"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Upload Photo from Device</label>
                      <div className="mt-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/40 relative hover:border-cyan-500/30 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSeniorContactPhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="text-center">
                          {seniorContactForm.photoUrl ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={seniorContactForm.photoUrl}
                                alt="Preview"
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 rounded-full object-cover border border-cyan-500/30 mb-2 shadow-lg"
                              />
                              <span className="text-[10px] text-emerald-400 font-mono">✓ Image loaded from device</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-slate-500">
                              <Plus className="w-6 h-6 mb-1 text-slate-600" />
                              <span className="text-[10px] font-mono uppercase tracking-wider">Drag or click to choose file</span>
                              <span className="text-[8px] text-slate-600 font-mono">PNG, JPG, WEBP formats</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
                      >
                        {editingSeniorContactId ? 'Update Contact' : 'Enlist Contact'}
                      </button>
                      {editingSeniorContactId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSeniorContactId(null);
                            setSeniorContactForm({ name: '', phone: '', email: '', photoUrl: '' });
                          }}
                          className="bg-slate-800 text-slate-300 text-2xs px-3 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Contacts List */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    Active Senior Advisors List
                  </h3>

                  {seniorContacts.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No senior contacts enlisted.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {seniorContacts.map((c) => (
                        <div key={c.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl relative flex items-start space-x-4">
                          {/* Photo preview */}
                          <div className="w-14 h-14 rounded-full border border-slate-800 shrink-0 overflow-hidden bg-slate-900">
                            {c.photoUrl ? (
                              <img
                                src={c.photoUrl}
                                alt={c.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                {c.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Contact detail texts */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-sans font-bold text-white uppercase truncate">{c.name}</h4>
                            <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">📞 {c.phone}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">✉ {c.email}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingSeniorContactId(c.id);
                                setSeniorContactForm({
                                  name: c.name,
                                  phone: c.phone,
                                  email: c.email,
                                  photoUrl: c.photoUrl,
                                });
                              }}
                              className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                              title="Edit contact info"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSeniorContact(c.id)}
                              className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                              title="Delete contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'district_connect' && (
            <div id="district-connect-moderation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Creator/Editor Form */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-fit">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    {editingDistrictSeniorId ? 'Edit District Senior Operative' : 'Enlist New District Senior'}
                  </h3>

                  <form onSubmit={handleDistrictSeniorSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={districtSeniorForm.name}
                        onChange={(e) => setDistrictSeniorForm({ ...districtSeniorForm, name: e.target.value })}
                        placeholder="e.g., Abdullah Al Nayeem"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Student ID</label>
                      <input
                        type="text"
                        value={districtSeniorForm.studentId}
                        onChange={(e) => setDistrictSeniorForm({ ...districtSeniorForm, studentId: e.target.value })}
                        placeholder="e.g., CySE-222301"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Home District</label>
                      <select
                        value={districtSeniorForm.district}
                        onChange={(e) => setDistrictSeniorForm({ ...districtSeniorForm, district: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono cursor-pointer"
                        required
                      >
                        <option value="" disabled className="text-slate-600 bg-slate-950">-- Select Home District --</option>
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d} value={d} className="bg-slate-950 text-white font-mono text-xs">{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Profile Photo</label>
                      <div className="flex items-center space-x-3 mt-1.5">
                        <div className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          {districtSeniorForm.imageUrl ? (
                            <img
                              src={districtSeniorForm.imageUrl}
                              alt="District senior preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-slate-800" />
                          )}
                        </div>

                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDistrictSeniorPhotoUpload}
                            id="district-senior-photo-upload"
                            className="hidden"
                          />
                          <label
                            htmlFor="district-senior-photo-upload"
                            className="inline-block px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-2xs uppercase tracking-wider rounded-lg border border-slate-800 transition-colors cursor-pointer select-none"
                          >
                            Upload File
                          </label>
                          <p className="text-[8px] font-mono text-slate-500 mt-1">Lightweight smart crop & compress</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        type="submit"
                        disabled={isActionPending}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-mono text-2xs uppercase font-bold tracking-widest py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 font-bold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{editingDistrictSeniorId ? 'Save Changes' : 'Publish Senior'}</span>
                      </button>
                      
                      {editingDistrictSeniorId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDistrictSeniorId(null);
                            setDistrictSeniorForm({ name: '', studentId: '', district: '', imageUrl: '' });
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-2xs font-mono uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List & Search View */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
                      <div>
                        <h3 className="text-sm font-mono uppercase text-cyan-300">
                          Archived District Senior Records
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                          Total database entries: {districtSeniors.length}
                        </p>
                      </div>

                      {/* Search Bar */}
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                        <input
                          type="text"
                          value={districtSeniorSearch}
                          onChange={(e) => setDistrictSeniorSearch(e.target.value)}
                          placeholder="Search entries..."
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/40 rounded-xl py-1.5 pl-8 pr-3 text-2xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/10 font-mono"
                        />
                      </div>
                    </div>

                    {/* Table / Grid list */}
                    {districtSeniors.length === 0 ? (
                      <div className="py-16 text-center">
                        <Users className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                        <p className="text-xs font-mono text-slate-500 uppercase">No records registered in the mainframe database.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/10">
                        {districtSeniors
                          .filter((s) => {
                            const queryStr = districtSeniorSearch.toLowerCase();
                            return (
                              s.name.toLowerCase().includes(queryStr) ||
                              s.studentId.toLowerCase().includes(queryStr) ||
                              s.district.toLowerCase().includes(queryStr)
                            );
                          })
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((s) => (
                            <div
                              key={s.id}
                              className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex items-center space-x-3.5 relative group hover:border-cyan-500/20 transition-all duration-300"
                            >
                              <div className="w-11 h-11 rounded-full border border-slate-800 bg-slate-900 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
                                {s.imageUrl ? (
                                  <img
                                    src={s.imageUrl}
                                    alt={s.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <Users className="w-5 h-5 text-slate-700" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 pr-12">
                                <h4 className="text-xs font-sans font-black text-white truncate">{s.name}</h4>
                                <p className="text-[10px] font-mono text-cyan-400 mt-0.5 truncate flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3" />
                                  <span>ID: {s.studentId}</span>
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-cyan-500/60" />
                                  <span>District: <strong>{s.district}</strong></span>
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDistrictSeniorId(s.id);
                                    setDistrictSeniorForm({
                                      name: s.name,
                                      studentId: s.studentId,
                                      district: s.district,
                                      imageUrl: s.imageUrl,
                                    });
                                  }}
                                  className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded cursor-pointer transition-colors"
                                  title="Edit entry"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDistrictSenior(s.id)}
                                  className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded cursor-pointer transition-colors"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gst_presets' && (
            <div id="gst-presets-moderation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Creator Form */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-fit">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    {editingPresetId ? 'Edit GST Auto-fill Preset' : 'Add GST Auto-fill Preset'}
                  </h3>

                  <form onSubmit={handlePresetSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">GST Roll Number / ID</label>
                      <input
                        type="text"
                        value={presetGst}
                        onChange={(e) => setPresetGst(e.target.value)}
                        placeholder="e.g., 200201"
                        disabled={!!editingPresetId}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                        required
                      />
                      <p className="text-[9px] text-slate-500 mt-1 font-mono">Enter the exact Roll ID used by the user to login.</p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3 space-y-3">
                      <p className="text-[10px] font-mono uppercase text-cyan-500 tracking-wider">Default Answers Preset Config</p>
                      
                      {fields.length === 0 ? (
                        <p className="text-2xs text-slate-500 italic">No fields in the database schema yet.</p>
                      ) : (
                        fields.map((field) => (
                          <div key={field.id} className="space-y-1">
                            <label className="block text-[10px] font-sans font-medium text-slate-300">{field.label}</label>
                            <input
                              type="text"
                              placeholder={`Default prefill for ${field.label}`}
                              value={presetAnswers[field.id] || ''}
                              onChange={(e) => handlePresetAnswerChange(field.id, e.target.value)}
                              className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
                      >
                        {editingPresetId ? 'Update Preset' : 'Save Preset'}
                      </button>
                      {editingPresetId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPresetId(null);
                            setPresetGst('');
                            setPresetAnswers({});
                          }}
                          className="bg-slate-800 text-slate-300 text-2xs px-3 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Existing Presets List */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    Active GST Roll Auto-fill Keys
                  </h3>

                  {gstPresets.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic">No GST presets saved yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {gstPresets.map((preset) => (
                        <div key={preset.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-4">
                          <div className="space-y-1">
                            <h4 className="font-sans font-bold text-white uppercase">GST Roll / ID: {preset.id}</h4>
                            <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                              {Object.entries(preset.answers || {}).map(([fId, val]) => {
                                const field = fields.find((f) => f.id === fId);
                                if (!field) return null;
                                return (
                                  <div key={fId}>
                                    <span className="text-cyan-500/70 font-semibold">{field.label}:</span> <span className="text-slate-300">"{String(val)}"</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex space-x-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setPresetGst(preset.id);
                                setPresetAnswers(preset.answers || {});
                                setEditingPresetId(preset.id);
                              }}
                              className="p-1 bg-slate-800 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-1 bg-slate-800 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div id="form-builder-moderation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Field creator form */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-fit">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    {editingFieldId ? 'Decrypt and Edit Field' : 'Inject Custom Form Field'}
                  </h3>

                  <form onSubmit={handleFieldSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Field Label (Title)</label>
                      <input
                        type="text"
                        value={fieldForm.label}
                        onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                        placeholder="e.g., Emergency Contact"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Field Data Type</label>
                      <select
                        value={fieldForm.type}
                        onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as FieldType })}
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="text">Text / String</option>
                        <option value="number">Numeric Integer</option>
                        <option value="dropdown">Dropdown Options Selection</option>
                        <option value="date">Calendar Date Selector</option>
                        <option value="email">Secure Email Protocol</option>
                        <option value="phone">Dialer Phone String</option>
                        <option value="textarea">Multi-line Text Area</option>
                        <option value="file">Local Attachment Upload</option>
                        <option value="checkbox">Checkbox Selector / Boolean</option>
                        <option value="radio">Radio Options Group</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">Placeholder (Helper)</label>
                      <input
                        type="text"
                        value={fieldForm.placeholder}
                        onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                        placeholder="e.g., Enter emergency contact phone..."
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Options list for selectors */}
                    {(fieldForm.type === 'dropdown' || fieldForm.type === 'checkbox' || fieldForm.type === 'radio') && (
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1">
                          Options List (Comma-Separated)
                        </label>
                        <input
                          type="text"
                          value={fieldForm.optionsString}
                          onChange={(e) => setFieldForm({ ...fieldForm, optionsString: e.target.value })}
                          placeholder="e.g., Cyber, Network, Other"
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                          required
                        />
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">Separate each selectable choice with a comma.</p>
                      </div>
                    )}

                    <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldForm.required}
                        onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                        className="accent-cyan-500 rounded border-slate-800"
                      />
                      <span>Make this field strictly required</span>
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
                      >
                        {editingFieldId ? 'Update Field Key' : 'Inject Field Key'}
                      </button>
                      {editingFieldId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFieldId(null);
                            setFieldForm({ label: '', type: 'text', required: false, placeholder: '', optionsString: '' });
                          }}
                          className="bg-slate-800 text-slate-300 text-2xs px-3 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Form layout preview */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <h3 className="text-sm font-mono uppercase text-cyan-300 border-b border-slate-800 pb-2 mb-4">
                    Registry Schema Fields
                  </h3>

                  <div className="space-y-3">
                    {[...fields]
                      .sort((a, b) => a.order - b.order)
                      .map((field, idx) => (
                        <div key={field.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono text-cyan-500">#{idx+1}</span>
                              <span className="font-sans font-bold text-white">{field.label}</span>
                              {field.required && (
                                <span className="bg-red-950 text-red-400 text-[8px] font-mono px-1 rounded border border-red-500/30 uppercase">
                                  REQUIRED
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-slate-500">
                              Type: <span className="text-cyan-400/80">{field.type}</span>
                              {field.options && field.options.length > 0 && ` • Options: [${field.options.join(', ')}]`}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {/* Reorder keys */}
                            <button
                              onClick={() => handleReorderField(field.id, idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 bg-slate-800 text-slate-400 hover:text-cyan-400 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReorderField(field.id, idx, 'down')}
                              disabled={idx === fields.length - 1}
                              className="p-1 bg-slate-800 text-slate-400 hover:text-cyan-400 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit / Delete keys */}
                            <button
                              onClick={() => {
                                setEditingFieldId(field.id);
                                setFieldForm({
                                  label: field.label,
                                  type: field.type,
                                  required: field.required,
                                  placeholder: field.placeholder || '',
                                  optionsString: field.options ? field.options.join(', ') : '',
                                });
                              }}
                              className="p-1 bg-slate-800 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1 bg-slate-800 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div id="submissions-moderation" className="space-y-6">
              {/* Toolbar */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                {/* Search / Filters */}
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative w-full sm:w-60">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search operator nickname..."
                      value={subSearch}
                      onChange={(e) => { setSubSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Schema Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={subFilterFieldId}
                      onChange={(e) => { setSubFilterFieldId(e.target.value); setSubFilterValue(''); setCurrentPage(1); }}
                      className="bg-slate-950/60 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none"
                    >
                      <option value="">Filter by field...</option>
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>

                    {subFilterFieldId && (
                      <input
                        type="text"
                        placeholder="Search field response..."
                        value={subFilterValue}
                        onChange={(e) => { setSubFilterValue(e.target.value); setCurrentPage(1); }}
                        className="bg-slate-950/60 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:outline-none w-40"
                      />
                    )}
                  </div>
                </div>

                {/* Downloader triggers */}
                <div className="flex items-center space-x-2">
                  <button
                    id="export-csv-btn"
                    onClick={() => handleExportData('csv')}
                    className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 font-mono text-2xs uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>

                  <button
                    id="export-excel-btn"
                    onClick={() => handleExportData('excel')}
                    className="bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/30 text-teal-400 font-mono text-2xs uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Excel File
                  </button>
                </div>
              </div>

              {/* Submissions list table */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="p-4">Visitor Nickname</th>
                        <th className="p-4">Submission Telemetry ID</th>
                        <th className="p-4">Timestamp Received</th>
                        <th className="p-4">Answers Collected</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {paginatedSubs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 italic font-mono">
                            No matching submissions registered.
                          </td>
                        </tr>
                      ) : (
                        paginatedSubs.map((sub) => {
                          const keysCount = Object.keys(sub.answers || {}).length;
                          return (
                            <tr key={sub.id} className="hover:bg-slate-900/25 transition-colors">
                              <td className="p-4 font-sans font-bold text-white">{sub.visitorNickname}</td>
                              <td className="p-4 font-mono text-[10px] text-slate-400">{sub.id}</td>
                              <td className="p-4 font-mono text-[10px] text-slate-300">
                                {new Date(sub.submittedAt).toLocaleString()}
                              </td>
                              <td className="p-4 text-cyan-400/80 font-mono text-[11px]">
                                {keysCount} parsed field keys
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end items-center space-x-2">
                                  <button
                                    onClick={() => setSelectedInspectSub(sub)}
                                    className="p-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 rounded-lg cursor-pointer"
                                    title="Audit submissions details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubmission(sub.id)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer"
                                    title="Purge record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalSubPages > 1 && (
                  <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-2xs font-mono text-slate-400">
                    <span>
                      Page {currentPage} of {totalSubPages} ({filteredSubs.length} total entries)
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md disabled:opacity-35 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((c) => Math.min(totalSubPages, c + 1))}
                        disabled={currentPage === totalSubPages}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md disabled:opacity-35 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Detail Inspector Modal */}
      {selectedInspectSub && (
        <SubmissionDetailModal
          submission={selectedInspectSub}
          fields={fields}
          onClose={() => setSelectedInspectSub(null)}
          onDelete={(id) => {
            setSelectedInspectSub(null);
            handleDeleteSubmission(id, false);
          }}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md bg-slate-950 border ${confirmDialog.isDestructive ? 'border-red-500/40' : 'border-cyan-500/40'} rounded-2xl p-6 relative shadow-[0_0_50px_rgba(6,182,212,0.15)]`}
          >
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
              <ShieldAlert className={`w-5 h-5 ${confirmDialog.isDestructive ? 'text-red-500' : 'text-cyan-400'}`} />
              <span className={`text-xs font-mono uppercase font-bold tracking-wider ${confirmDialog.isDestructive ? 'text-red-400' : 'text-cyan-300'}`}>
                {confirmDialog.title}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
              {confirmDialog.message}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const onConfirm = confirmDialog.onConfirm;
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  await onConfirm();
                }}
                className={`flex-1 py-2 rounded-xl text-2xs font-mono uppercase tracking-wider cursor-pointer font-bold border transition-all ${
                  confirmDialog.isDestructive
                    ? 'bg-red-950/40 hover:bg-red-900 border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] text-red-400'
                    : 'bg-cyan-950/40 hover:bg-cyan-900 border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] text-cyan-400'
                }`}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-2xs px-5 py-2 rounded-xl border border-slate-800 cursor-pointer font-mono uppercase tracking-wider"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Toast Alert */}
      {toast.isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-200'
                : toast.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/40 text-blue-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            } shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md max-w-sm`}
          >
            {toast.type === 'error' ? (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-mono uppercase tracking-wide leading-relaxed">{toast.message}</span>
            <button 
              onClick={() => setToast(prev => ({ ...prev, isOpen: false }))}
              className="text-slate-400 hover:text-white ml-2 text-2xs cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
