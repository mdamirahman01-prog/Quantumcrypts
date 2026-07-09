import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  increment 
} from 'firebase/firestore';
import { seedDatabaseIfEmpty } from './lib/seed';
import { 
  LogoConfig, 
  WelcomeMessage, 
  Memory, 
  GSTPreset,
  Notice, 
  FormField, 
  Submission,
  SeniorContact
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import CyberBackground from './components/CyberBackground';
import OurMemories from './components/OurMemories';
import NoticeBoard from './components/NoticeBoard';
import DynamicForm from './components/DynamicForm';
import SeniorContacts from './components/SeniorContacts';
import AdminPanel from './components/AdminPanel';
import QuantumCryptsLogo from './components/QuantumCryptsLogo';
import { ShieldCheck, LogOut, Terminal, Cpu, Database, RefreshCw, Layers, Bell, FileText, Image, Settings, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // Visitor info
  const [nickname, setNickname] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [randomWelcomeMsg, setRandomWelcomeMsg] = useState<string>('');

  // Firestore Data Collections
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>(null);
  const [welcomeMessages, setWelcomeMessages] = useState<WelcomeMessage[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [gstPresets, setGstPresets] = useState<GSTPreset[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [seniorContacts, setSeniorContacts] = useState<SeniorContact[]>([]);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);

  // Settings & Visibility Toggle States
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Router States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cyber_admin_authenticated') === 'true' && 
           sessionStorage.getItem('cyber_admin_authenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'form' | 'notices' | 'memories' | 'seniors'>('form');

  // Admin Auth submission handler
  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usernameTrimmed = adminUsername.trim();
    const isMainAdmin = usernameTrimmed === 'aamyr' && adminPassword === 'abdullahsirxudi';
    const isAbdullah = usernameTrimmed.toLowerCase() === 'abdullah@qc.com' && 
                       (adminPassword === ' AbdullahCySE@2425 ' || adminPassword.trim() === 'AbdullahCySE@2425');
    const isNayeem = usernameTrimmed.toLowerCase() === 'nayeem@qc.com' && 
                     (adminPassword === ' NayeemCySE@2425 ' || adminPassword.trim() === 'NayeemCySE@2425');

    if (isMainAdmin || isAbdullah || isNayeem) {
      setIsAdminAuthenticated(true);
      setIsAdminMode(true);
      setIsAdminAuthOpen(false);
      setAdminUsername('');
      setAdminPassword('');
      setAdminAuthError('');
      localStorage.setItem('cyber_admin_authenticated', 'true');
      sessionStorage.setItem('cyber_admin_authenticated', 'true');
    } else {
      setAdminAuthError('ACCESS DENIED: Critical authorization mismatch.');
    }
  };

  // Load and check initial states
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Seed default database elements if empty
        await seedDatabaseIfEmpty(db);

        // 2. Fetch all collections
        const welcomes = await fetchAllData();

        // 3. Resolve user session
        const savedNickname = localStorage.getItem('cyber_community_nickname');
        if (savedNickname) {
          setNickname(savedNickname);
          if (welcomes && welcomes.length > 0) {
            const activeMsgs = welcomes.filter((m) => m.enabled);
            const messagesToPickFrom = activeMsgs.length > 0 ? activeMsgs : welcomes;
            const randomMsg = messagesToPickFrom[Math.floor(Math.random() * messagesToPickFrom.length)];
            if (randomMsg) {
              let text = randomMsg.message;
              if (!text.toLowerCase().includes('{nickname}')) {
                text = `{nickname}, ${text}`;
              }
              const formatted = text.replace(/{nickname}/gi, savedNickname);
              setRandomWelcomeMsg(formatted);
            }
          }
        }

        // 4. Listen to URL Hash to block and clear public #admin access immediately
        const handleHashChange = () => {
          if (window.location.hash.toLowerCase().includes('admin')) {
            // Remove hash immediately from URL to secure against bookmarks or direct links
            window.history.replaceState(null, '', window.location.pathname);
            
            // Strictly check authentication. If they are not authenticated, block them
            const isAuth = localStorage.getItem('cyber_admin_authenticated') === 'true' && 
                           sessionStorage.getItem('cyber_admin_authenticated') === 'true';
            if (isAuth) {
              setIsAdminMode(true);
            } else {
              setIsAdminMode(false);
              setIsAdminAuthOpen(false); // Do NOT show the login modal on public URL access
            }
          }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // check on mount

        // 5. Listen to Keyboard command: Ctrl + Shift + A to open Admin Panel
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            const isAuth = localStorage.getItem('cyber_admin_authenticated') === 'true' && 
                           sessionStorage.getItem('cyber_admin_authenticated') === 'true';
            const hasUserSession = !!localStorage.getItem('cyber_community_nickname');
            
            if (isAuth) {
              setIsAdminMode((prev) => !prev);
            } else if (!hasUserSession) {
              // Only allow opening admin login from public Welcome screen, never when logged in as normal user on homepage
              setIsAdminAuthOpen(true);
            }
          }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
          window.removeEventListener('hashchange', handleHashChange);
          window.removeEventListener('keydown', handleKeyDown);
        };
      } catch (err) {
        console.error('Initial database lookup error:', err);
        handleFirestoreError(err, OperationType.GET, 'init_app');
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  // Selection handled dynamically on session init and on login.
  useEffect(() => {
    // Spacer to preserve indexing structure
  }, []);

  // Fetch all collections in parallel for efficiency
  const fetchAllData = async () => {
    try {
      const [
        logoSnap,
        welcomeSnap,
        memorySnap,
        gstSnap,
        noticeSnap,
        fieldSnap,
        subSnap,
        visitorSnap,
        seniorSnap
      ] = await Promise.all([
        getDoc(doc(db, 'config', 'logo')),
        getDocs(collection(db, 'welcome_messages')),
        getDocs(collection(db, 'memories')),
        getDocs(collection(db, 'gst_presets')),
        getDocs(collection(db, 'notices')),
        getDocs(collection(db, 'form_fields')),
        getDocs(collection(db, 'submissions')),
        getDoc(doc(db, 'config', 'visitors')),
        getDocs(collection(db, 'senior_contacts'))
      ]);

      // Logo url
      if (logoSnap.exists()) {
        setLogoConfig(logoSnap.data() as LogoConfig);
      } else {
        setLogoConfig(null);
      }

      // Welcome messages
      const welcomesList: WelcomeMessage[] = [];
      welcomeSnap.forEach((d) => {
        welcomesList.push({ id: d.id, ...d.data() } as WelcomeMessage);
      });
      setWelcomeMessages(welcomesList);

      // Memories
      const memoriesList: Memory[] = [];
      memorySnap.forEach((d) => {
        memoriesList.push({ id: d.id, ...d.data() } as Memory);
      });
      setMemories(memoriesList);

      // GST Presets
      const gstList: GSTPreset[] = [];
      gstSnap.forEach((d) => {
        gstList.push({ id: d.id, ...d.data() } as GSTPreset);
      });
      setGstPresets(gstList);

      // Notices
      const noticesList: Notice[] = [];
      noticeSnap.forEach((d) => {
        noticesList.push({ id: d.id, ...d.data() } as Notice);
      });
      setNotices(noticesList);

      // Form Fields
      const fieldsList: FormField[] = [];
      fieldSnap.forEach((d) => {
        fieldsList.push({ id: d.id, ...d.data() } as FormField);
      });
      setFields(fieldsList);

      // Submissions
      const submissionsList: Submission[] = [];
      subSnap.forEach((d) => {
        submissionsList.push({ id: d.id, ...d.data() } as Submission);
      });
      setSubmissions(submissionsList);

      // Senior Contacts
      const seniorList: SeniorContact[] = [];
      seniorSnap.forEach((d) => {
        seniorList.push({ id: d.id, ...d.data() } as SeniorContact);
      });
      setSeniorContacts(seniorList);

      // Visitor Count
      if (visitorSnap.exists()) {
        setTotalVisitors(visitorSnap.data().count || 0);
      } else {
        setTotalVisitors(0);
      }

      return welcomesList;
    } catch (err) {
      console.error('Error fetching data from Firestore:', err);
      handleFirestoreError(err, OperationType.GET, 'all_collections');
      return [];
    }
  };

  const handleDataRefresh = async () => {
    await fetchAllData();
  };

  // Visitor enters community
  const handleEnterCommunity = async (userNickname: string) => {
    setNickname(userNickname);
    localStorage.setItem('cyber_community_nickname', userNickname);

    // Pick a random welcome message on entry
    if (welcomeMessages.length > 0) {
      const activeMsgs = welcomeMessages.filter((m) => m.enabled);
      const messagesToPickFrom = activeMsgs.length > 0 ? activeMsgs : welcomeMessages;
      const randomMsg = messagesToPickFrom[Math.floor(Math.random() * messagesToPickFrom.length)];
      if (randomMsg) {
        let text = randomMsg.message;
        if (!text.toLowerCase().includes('{nickname}')) {
          text = `{nickname}, ${text}`;
        }
        const formatted = text.replace(/{nickname}/gi, userNickname);
        setRandomWelcomeMsg(formatted);
      }
    }

    // Track/increment visitor count in database
    try {
      const visitorRef = doc(db, 'config', 'visitors');
      const visitorDoc = await getDoc(visitorRef);
      if (visitorDoc.exists()) {
        await updateDoc(visitorRef, { count: increment(1) });
      } else {
        await setDoc(visitorRef, { count: 1 });
      }
      // Increment local state to show instantly
      setTotalVisitors((prev) => prev + 1);
    } catch (err) {
      console.error('Visitor logging bypassed:', err);
      handleFirestoreError(err, OperationType.WRITE, 'config/visitors');
    }
  };

  const handleLogoutUser = () => {
    setNickname('');
    setRandomWelcomeMsg('');
    localStorage.removeItem('cyber_community_nickname');
    setIsAdminAuthenticated(false);
    setIsAdminMode(false);
    localStorage.removeItem('cyber_admin_authenticated');
    sessionStorage.removeItem('cyber_admin_authenticated');
  };

  const renderAdminAuthModal = () => {
    if (!isAdminAuthOpen) return null;
    const isAuth = localStorage.getItem('cyber_admin_authenticated') === 'true' && 
                   sessionStorage.getItem('cyber_admin_authenticated') === 'true';
    if (nickname && !isAuth) {
      return null;
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl p-6 relative shadow-[0_0_50px_rgba(6,182,212,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
            <span className="text-xs font-mono uppercase text-cyan-300 font-semibold tracking-wider">
              ADMIN CONSOLE AUTHORIZATION
            </span>
            <button
              onClick={() => {
                setIsAdminAuthOpen(false);
                setAdminUsername('');
                setAdminPassword('');
                setAdminAuthError('');
              }}
              className="text-slate-500 hover:text-white font-mono text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => {
                  setAdminUsername(e.target.value);
                  setAdminAuthError('');
                }}
                placeholder="Enter admin ID..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-cyan-400/70 mb-1.5">
                Admin Gateway Key
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminAuthError('');
                }}
                placeholder="Enter password key..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            {adminAuthError && (
              <p className="text-[11px] text-red-400 font-mono bg-red-950/30 border border-red-500/20 p-2 rounded-lg">
                ⚠ {adminAuthError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-mono text-2xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
              >
                Confirm Credentials
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdminAuthOpen(false);
                  setAdminUsername('');
                  setAdminPassword('');
                  setAdminAuthError('');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-2xs px-4 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  if (isInitializing) {
    return (
      <div id="mainframe-spinner" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono space-y-4">
        <CyberBackground />
        <div className="relative">
          <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <Cpu className="w-5 h-5 absolute inset-0 m-auto text-cyan-400 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-cyan-500/70 animate-pulse">Initializing Mainframe Security Handshake...</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Connecting to Firestore Node...</p>
        </div>
      </div>
    );
  }

  // --- Router check ---
  if (isAdminMode) {
    return (
      <div id="app-root-admin">
        <CyberBackground />
        <AdminPanel
          logoConfig={logoConfig}
          onLogoChange={(newLogo) => {
            setLogoConfig(prev => prev ? { ...prev, logoUrl: newLogo } : { id: 'logo', logoUrl: newLogo, updatedAt: Date.now() });
          }}
          onDataRefresh={handleDataRefresh}
          welcomeMessages={welcomeMessages}
          memories={memories}
          gstPresets={gstPresets}
          notices={notices}
          fields={fields}
          submissions={submissions}
          totalVisitorsCount={totalVisitors}
          seniorContacts={seniorContacts}
          onClose={() => {
            setIsAdminMode(false);
          }}
        />
      </div>
    );
  }

  // Step 1: Nickname Landing Screen
  if (!nickname) {
    return (
      <div id="app-root-landing" className="min-h-screen relative flex flex-col justify-between">
        <CyberBackground />

        <div className="flex-1 flex items-center justify-center">
          <WelcomeScreen onEnter={handleEnterCommunity} />
        </div>
        <footer 
          className="w-full text-center py-6 px-4 border-t border-slate-900/40 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/20 border border-emerald-500/20 rounded-full text-[9px] font-mono text-emerald-400 uppercase tracking-widest select-none">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
            <span>All Information Encrypted & Secure</span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 tracking-wide select-none flex items-center justify-center gap-1.5">
            <span>Run & Maintained by Cyber Security Engineering Department 2nd Batch Students</span>
            <button
              onClick={() => setIsAdminAuthOpen(true)}
              className="opacity-10 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 p-0.5 text-slate-400 hover:text-cyan-400 cursor-pointer"
              title="Settings Node"
            >
              <Settings className="w-3 h-3 animate-[spin_8s_linear_infinite]" />
            </button>
          </p>
          <p className="text-[10px] font-mono text-slate-500 select-none">
            Support email: <a href="mailto:2404004@uftb.ac.bd" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 transition-all font-semibold">2404004@uftb.ac.bd</a>
          </p>
        </footer>

        {/* Render modal on landing screen */}
        {renderAdminAuthModal()}
      </div>
    );
  }

  // Step 2: Main dashboard interface
  return (
    <div id="app-root-mainframe" className="min-h-screen bg-[#020617] text-slate-100 font-sans relative pb-16 flex flex-col justify-between">
      <CyberBackground />

      <div className="absolute inset-0 bg-radial-[circle_at_top,rgba(6,182,212,0.02)_0%,transparent_60%] pointer-events-none" />

      {/* Main App Header */}
      <header className="bg-slate-900/40 border-b border-slate-800/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Top Center Logo and Site Identity */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 bg-black border border-slate-800 rounded-xl flex items-center justify-center p-0.5 overflow-hidden shadow-2xl">
              {logoConfig?.logoUrl ? (
                <img
                  src={logoConfig.logoUrl}
                  alt="UFTB Cyber Community Logo"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <QuantumCryptsLogo className="w-full h-full" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-sans font-black tracking-widest text-white uppercase flex items-center gap-1.5 italic">
                UFTB Cyber Community
              </h1>
              <p className="text-[9px] font-mono text-cyan-500/60 uppercase tracking-widest">UFTB Cyber Community Node</p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col items-end text-right mr-1">
              <span className="text-xs font-sans font-bold text-white flex items-center gap-1">
                Hi, {nickname} <span className="animate-pulse">👋</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-500/60 uppercase tracking-wider">Node Verified</span>
            </div>

            {isAdminAuthenticated && (
              <button
                id="settings-header-btn"
                onClick={() => setIsAdminMode(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-slate-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase print:hidden"
                title="Administrative Node Login"
              >
                <Terminal className="w-4 h-4 text-cyan-500" />
                <span className="hidden md:inline">Admin Panel</span>
              </button>
            )}

            <button
              id="user-logout-btn"
              onClick={handleLogoutUser}
              className="p-2.5 bg-slate-900/80 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6 flex-1 w-full print:p-0 print:m-0 print:max-w-none">
        {/* Dynamic Welcome Message Header Banner */}
        {randomWelcomeMsg && (
          <motion.div
            id="welcome-greeting-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/25 p-5 rounded-2xl relative overflow-hidden shadow-2xl print:hidden"
          >
            {/* Visual corner indicators */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/40" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-mono text-cyan-400/40 uppercase tracking-widest">Secured Transmission Handshake</p>
                <h2 className="text-xs sm:text-sm font-mono text-cyan-300 font-medium leading-relaxed">
                  {randomWelcomeMsg}
                </h2>
              </div>

              <div className="flex items-center space-x-2 shrink-0 bg-slate-950/40 px-3 py-1.5 border border-cyan-500/10 rounded-xl text-[9px] font-mono text-cyan-400">
                <Database className="w-3.5 h-3.5 animate-pulse" />
                <span>MEMBERS ONLINE: {totalVisitors}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cybersecurity Module Navigation Tabs */}
        <div id="mainframe-tab-navigation" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/25 border border-slate-800/60 p-2 rounded-2xl backdrop-blur-md print:hidden">
          <div className="flex flex-wrap items-center gap-1.5 p-1 w-full md:w-auto">
            <button
              id="tab-btn-form"
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
                activeTab === 'form'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Form Section</span>
            </button>

            <button
              id="tab-btn-notices"
              onClick={() => setActiveTab('notices')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
                activeTab === 'notices'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notice Board</span>
            </button>

            <button
              id="tab-btn-memories"
              onClick={() => setActiveTab('memories')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
                activeTab === 'memories'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Our Memories</span>
            </button>

            <button
              id="tab-btn-seniors"
              onClick={() => setActiveTab('seniors')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
                activeTab === 'seniors'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contact with Senior</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 animate-pulse text-cyan-500/50" />
            <span>Feed Link: {activeTab === 'form' ? 'Dynamic Submission' : activeTab === 'notices' ? 'Notice Board' : activeTab === 'memories' ? 'Memory Log' : 'Senior Roster'}</span>
          </div>
        </div>

        {/* Dynamic Tab Workspace Content with motion transition */}
        <div className="w-full mt-2">
          {activeTab === 'form' && (
            <motion.div
              id="form-tab-content"
              key="form-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto w-full"
            >
              <DynamicForm fields={fields} visitorNickname={nickname} presetAnswers={gstPresets.find(p => p.id === nickname)?.answers} />
            </motion.div>
          )}

          {activeTab === 'notices' && (
            <motion.div
              id="notices-tab-content"
              key="notices-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto w-full"
            >
              <NoticeBoard notices={notices} />
            </motion.div>
          )}

          {activeTab === 'memories' && (
            <motion.div
              id="memories-tab-content"
              key="memories-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto w-full"
            >
              <OurMemories memories={memories} />
            </motion.div>
          )}

          {activeTab === 'seniors' && (
            <motion.div
              id="seniors-tab-content"
              key="seniors-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto w-full"
            >
              <SeniorContacts contacts={seniorContacts} />
            </motion.div>
          )}
        </div>
      </main>

      {/* Admin Credentials Login Modal */}
      {renderAdminAuthModal()}

      {/* Decorative footer */}
      <footer className="border-t border-slate-900/60 pt-8 pb-10 mt-16 text-center max-w-7xl mx-auto w-full px-6 print:hidden">
        <div className="flex flex-col items-center gap-3">
          {/* Security status bar */}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/20 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span>All Information Encrypted & Secure</span>
          </div>
          
          <p className="text-[11px] font-mono text-slate-400 tracking-wide flex items-center justify-center gap-1.5">
            <span>Run & Maintained by Cyber Security Engineering Department 2nd Batch Students</span>
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  const isAuth = localStorage.getItem('cyber_admin_authenticated') === 'true' && 
                                 sessionStorage.getItem('cyber_admin_authenticated') === 'true';
                  if (isAuth) {
                    setIsAdminMode(true);
                  } else {
                    setIsAdminAuthOpen(true);
                  }
                }}
                className="opacity-10 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 p-0.5 text-slate-400 hover:text-cyan-400 cursor-pointer"
                title="Settings Node"
              >
                <Settings className="w-3.5 h-3.5 animate-[spin_8s_linear_infinite]" />
              </button>
            )}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-mono text-slate-500">
            <span>If there is any problem, please contact us via email:</span>
            <a 
              href="mailto:2404004@uftb.ac.bd" 
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 transition-all font-semibold"
            >
              2404004@uftb.ac.bd
            </a>
          </div>

          {isAdminAuthenticated && (
            <button
              id="footer-admin-btn"
              onClick={() => {
                setIsAdminMode(true);
              }}
              className="mt-2 px-3 py-1.5 bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800/80 hover:border-cyan-500/30 rounded-lg text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
              title="Administrative Node Login"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
