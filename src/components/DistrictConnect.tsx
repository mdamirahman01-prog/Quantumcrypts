import React, { useState, useRef, useEffect } from 'react';
import { DistrictSenior } from '../types';
import { Search, MapPin, AlertCircle, User, GraduationCap, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface DistrictConnectProps {
  seniors: DistrictSenior[];
}

export default function DistrictConnect({ seniors }: DistrictConnectProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [textSearchQuery, setTextSearchQuery] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter districts based on what user typed in dropdown search
  const filteredDistricts = BANGLADESH_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(districtSearchQuery.toLowerCase())
  );

  // Filter seniors based on both Selected District and Text Search Query (Name / Student ID)
  const filteredSeniors = seniors.filter((senior) => {
    const matchesDistrict = selectedDistrict ? senior.district === selectedDistrict : true;
    const matchesText = textSearchQuery.trim()
      ? senior.name.toLowerCase().includes(textSearchQuery.toLowerCase()) ||
        senior.studentId.toLowerCase().includes(textSearchQuery.toLowerCase())
      : true;
    return matchesDistrict && matchesText;
  });

  // Sort seniors by newest first
  const sortedSeniors = [...filteredSeniors].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div id="district-connect-container" className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header / Top Bar */}
      <div className="p-5 border-b border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-center space-x-2.5">
          <MapPin className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              District Connect
            </h2>
            <p className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest mt-0.5">
              Find senior students from your district
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="p-5 border-b border-cyan-500/10 bg-slate-950/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Searchable District Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[9px] font-mono text-cyan-500/60 uppercase tracking-wider mb-1.5">
              Select Home District ({BANGLADESH_DISTRICTS.length} Districts)
            </label>
            <div
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                if (!isDropdownOpen) {
                  setDistrictSearchQuery('');
                }
              }}
              className="w-full bg-slate-950/60 border border-slate-700/80 hover:border-cyan-500/40 rounded-xl py-2.5 px-4 text-white text-xs font-mono transition-all flex items-center justify-between cursor-pointer select-none h-[40px]"
            >
              <span className={selectedDistrict ? "text-cyan-300 font-bold" : "text-slate-400"}>
                {selectedDistrict ? `📍 ${selectedDistrict}` : 'Select/Search District...'}
              </span>
              <div className="flex items-center gap-1.5">
                {selectedDistrict && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDistrict('');
                    }}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-40 left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[260px] flex flex-col"
                >
                  <div className="p-2 border-b border-slate-800/80 bg-slate-900/40">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Type to filter..."
                        value={districtSearchQuery}
                        onChange={(e) => setDistrictSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 font-mono text-2xs"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 max-h-[190px] p-1 scrollbar-thin scrollbar-thumb-cyan-500/10">
                    {filteredDistricts.length === 0 ? (
                      <p className="text-center py-4 text-[10px] font-mono text-slate-500">
                        No districts match search
                      </p>
                    ) : (
                      filteredDistricts.map((district) => (
                        <button
                          key={district}
                          type="button"
                          onClick={() => {
                            setSelectedDistrict(district);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left font-mono text-2xs py-2 px-3 rounded-lg hover:bg-cyan-950/20 hover:text-cyan-300 transition-all ${
                            selectedDistrict === district
                              ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          📍 {district}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Search for Name / Student ID */}
          <div>
            <label className="block text-[9px] font-mono text-cyan-500/60 uppercase tracking-wider mb-1.5">
              Search by Student Name or Student ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Type senior name or student ID..."
                value={textSearchQuery}
                onChange={(e) => setTextSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-xs transition-all focus:ring-1 focus:ring-cyan-500/20 h-[40px]"
              />
              {textSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTextSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Selected parameters indicator */}
        {(selectedDistrict || textSearchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Active Filters:</span>
            {selectedDistrict && (
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1">
                District: {selectedDistrict}
                <button onClick={() => setSelectedDistrict('')} className="hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {textSearchQuery && (
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1">
                Keyword: "{textSearchQuery}"
                <button onClick={() => setTextSearchQuery('')} className="hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedDistrict('');
                setTextSearchQuery('');
              }}
              className="text-[9px] font-mono text-red-400 hover:text-red-300 hover:underline transition-all uppercase"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid of Seniors */}
      <div className="p-6 flex-1 overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-cyan-500/20">
        {sortedSeniors.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
            <p className="text-sm font-mono text-slate-300 font-bold">
              {selectedDistrict 
                ? "No senior information available for this district." 
                : "No seniors found matching filters."
              }
            </p>
            <p className="text-2xs font-mono text-slate-500 mt-1.5 max-w-sm">
              {selectedDistrict 
                ? `There are no senior operative logs matching ${selectedDistrict} archived in the mainframe yet.`
                : "Try adjusting your search queries or selecting a different home district from the selector above."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSeniors.map((senior) => (
              <motion.div
                key={senior.id}
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

                {/* Profile Picture Container */}
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 group-hover:border-cyan-500/60 p-1 bg-slate-900 overflow-hidden shrink-0 mb-4 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  {senior.imageUrl ? (
                    <img
                      src={senior.imageUrl}
                      alt={senior.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-700" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-sm font-sans font-black tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                  {senior.name}
                </h3>

                {/* Student ID */}
                <p className="text-[10px] font-mono text-cyan-400/80 mt-1 flex items-center gap-1 justify-center bg-cyan-950/20 px-2 py-0.5 border border-cyan-500/10 rounded-md">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>ID: {senior.studentId}</span>
                </p>

                {/* Home District */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500/80" />
                  <span>District: <strong className="text-slate-200">{senior.district}</strong></span>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
