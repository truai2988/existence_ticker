import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Shield,
  Search,
  Book,
  Activity,
  Users,
  Moon,
  Zap,
  Trash2,
  Settings,
  Key,
  Plus
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  where,
  Timestamp,
  limit
} from "firebase/firestore";
import { motion } from "framer-motion";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticModal } from "./DiagnosticModal";
import { DashboardStats } from "../hooks/useStats";

interface AdminDashboardProps {
  onClose: () => void;
  stats: DashboardStats | null;
}

interface User {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  warmth?: number;
  balance?: number;
  committed_lm?: number;
  last_updated?: Timestamp;
  created_at?: Timestamp;
  location?: {
    prefecture?: string;
    city?: string;
  };
}

interface InviteCode {
  id: string;
  is_used: boolean;
  created_at?: Timestamp;
  created_by?: string;
  used_by?: string;
  used_at?: Timestamp;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'citizens' | 'invitations' | 'integrity'>('monitor');
  const [userList, setUserList] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [superAdminIds, setSuperAdminIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [cycleDays, setCycleDays] = useState(10);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupLog] = useState<string[]>([]);

  const diagnostics = useDiagnostics(stats);

  // Fetch initial data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!db) return;
      try {
          const configDoc = await getDoc(doc(db, "system_settings", "global"));
          if (configDoc.exists()) {
              setSuperAdminIds(configDoc.data().super_admin_ids || []);
              setCycleDays(configDoc.data().cycleDays || 10);
          }
      } catch (err) {
          setError("Failed to fetch admin config");
      }
    };
    fetchAdminData();
  }, []);

  // Fetch users when on citizens tab
  useEffect(() => {
    if (activeTab === 'citizens') {
        fetchUsers();
    }
    if (activeTab === 'invitations') {
        fetchInviteCodes();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    if (!db) return;
    setIsLoadingUsers(true);
    try {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      setUserList(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const fetchInviteCodes = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "invitation_codes"));
      const snap = await getDocs(q);
      setInviteCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as InviteCode)));
    } catch (err) {
      setError("Failed to fetch invitation codes");
    }
  };

  const generateInviteCode = async () => {
    if (!db) return;
    try {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `ALPHA-${randomStr}`;
        const codeRef = doc(db, "invitation_codes", code);
        
        await setDoc(codeRef, {
            is_used: false,
            created_at: serverTimestamp(),
            created_by: auth?.currentUser?.uid
        });
        
        fetchInviteCodes();
        alert(`招待コードを生成しました: ${code}`);
    } catch (err: unknown) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`Failed to generate code: ${errorMessage}`);
    }
  };

  const toggleAdmin = async (user: User) => {
    if (!db) return;
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      fetchUsers();
    } catch (err) { alert("Failed to update role"); }
  };

  const toggleSuperAdmin = async (user: User) => {
    if (!db) return;
    try {
        const isCurrentlySuper = superAdminIds.includes(user.id);
        const newSuperIds = isCurrentlySuper 
            ? superAdminIds.filter(id => id !== user.id)
            : [...superAdminIds, user.id];
        
        await updateDoc(doc(db, "system_settings", "global"), { super_admin_ids: newSuperIds });
        setSuperAdminIds(newSuperIds);
    } catch (err) { alert("Failed to update super admin status"); }
  };

  const filteredUsers = useMemo(() => {
    return userList.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userList, searchQuery]);

  const scrollToSupply = () => {
    const el = document.getElementById('time-control-section');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Redesign Derived Stats
  const cycle = {
      day: stats?.cycle.day || 0,
      season: stats?.cycle.day && stats.cycle.day < 5 ? "豊穣" : stats?.cycle.day && stats.cycle.day > 7 ? "収穫" : "平衡",
      rebornToday: stats?.cycle.rebornToday || 0
  };

  const metabolism = {
      volume24h: stats?.metabolism.volume24h || 0,
      totalSupply: stats?.metabolism.totalSupply || 1,
      decay24h: stats?.metabolism.decay24h || 0,
      overflowLoss: stats?.metabolism.overflowLoss || 0,
      rate: stats?.metabolism.rate.toFixed(1) || "0.0",
      status: stats?.metabolism.status || "Stable"
  };

  const distribution = {
      full: stats?.distribution.full || 0,
      quarter: stats?.distribution.quarter || 0,
      new: stats?.distribution.new || 0
  };

  const totalPop = distribution.full + distribution.quarter + distribution.new;
  const distRatio = {
      full: distribution.full / (totalPop || 1),
      quarter: distribution.quarter / (totalPop || 1),
      new: distribution.new / (totalPop || 1)
  };

  const getMetaColor = (status: string) => {
      if (status === "Active") return "text-emerald-400";
      if (status === "Stable") return "text-emerald-500/60";
      return "text-slate-500";
  };

  return (
    <div id="admin-scroll-container" className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-md ${showManual ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-slate-800/50 w-full">
          <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                <Activity className="w-5 h-5 text-slate-200" />
                </div>
                <div>
                <h1 className="text-xl font-bold text-slate-200 tracking-wider">
                    管理コンソール (GOD MODE)
                </h1>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">
                    互助生態系 監視モニター
                </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                onClick={() => setShowManual(true)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                title="Protocol Whitepaper"
                >
                <Book size={24} />
                </button>
                <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                <X size={24} />
                </button>
            </div>
        </div>
      </div>

      <div className="bg-slate-900 border-b border-white/10 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-slate-500 sticky top-[68px] z-40 overflow-x-auto no-scrollbar">
          <div className="max-w-3xl mx-auto w-full flex flex-col md:flex-row justify-between gap-2">
              <div className="flex gap-4 shrink-0">
                  <span>DB: {db ? "VERIFIED" : "OFFLINE"}</span>
                  <span className={superAdminIds.length > 0 ? "text-green-500" : "text-amber-500"}>
                      SUPER ADMINS: {superAdminIds.length}
                  </span>
              </div>
              <div className="flex gap-4 shrink-0">
                  <span className="text-slate-400">UID: <span className="select-all">{auth?.currentUser?.uid || "???"}</span></span>
                  <span className="text-blue-400">Citizens: {userList.length}</span>
              </div>
          </div>
      </div>

      <div className="min-h-full p-4 pb-40 max-w-3xl mx-auto relative">
        {error && (
          <div className="mb-4 p-3 border border-red-500/30 bg-red-900/10 rounded text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-4 mb-6 border-b border-slate-800">
            <button
                onClick={() => setActiveTab('monitor')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'monitor' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Activity size={16} /> Monitor
            </button>
            <button
                onClick={() => setActiveTab('citizens')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'citizens' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Users size={16} /> Citizens
            </button>
            <button
                onClick={() => setActiveTab('invitations')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'invitations' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Key size={16} /> Invitations
            </button>
            <button
                onClick={() => setActiveTab('integrity')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'integrity' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Shield size={16} /> Integrity
            </button>
        </div>

        <div className="flex flex-col gap-6">
          {activeTab === 'monitor' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowDiagnosisModal(true)}
                  className={`w-full p-5 rounded-2xl border-2 ${diagnostics.bg} ${diagnostics.text} mb-2 flex items-center justify-between group transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-black/20`}
              >
                  <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-white/10 ring-4 ring-white/5">
                          <Activity size={24} className="animate-pulse" />
                      </div>
                      <div className="text-left">
                          <div className="text-[10px] uppercase tracking-[0.3em] opacity-80 mb-1 font-bold">Health Status</div>
                          <div className="text-xl sm:text-2xl font-serif font-bold tracking-wide">{diagnostics.shortDescription}</div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono px-4 py-2 bg-white/10 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">
                      <span>詳しく見る</span>
                      <Book size={14} />
                  </div>
              </motion.button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TIME FLOW */}
                  <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                      <h2 className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Moon size={14} /> 時間の流れとリズム
                      </h2>
                      <div className="space-y-6">
                          <div className="flex items-baseline gap-3">
                              <span className="text-4xl font-bold text-slate-100 font-serif">{cycle.day}日目</span>
                              <span className="text-sm text-emerald-600 font-medium px-2 py-0.5 bg-emerald-500/10 rounded-md">{cycle.season} 期</span>
                          </div>
                          <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                  <div className="flex flex-col text-sm text-slate-300 font-medium">本日の再生数</div>
                                  <span className="text-3xl font-mono text-emerald-400 font-bold">{cycle.rebornToday}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (cycle.rebornToday/(totalPop || 1))*500)}%` }} />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* VITALITY */}
                  <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                      <h2 className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Zap size={14} /> 活気 (新陳代謝)
                      </h2>
                      <div className="space-y-6">
                          <div className="flex justify-between items-start">
                              <div>
                                  <div className="text-sm text-slate-300 font-medium">24h 流動額</div>
                                  <div className="text-3xl font-mono text-white font-bold">{metabolism.volume24h.toLocaleString()} Lm</div>
                              </div>
                              <div className={`text-right ${getMetaColor(metabolism.status)}`}>
                                  <div className="text-2xl font-bold">{metabolism.rate}%</div>
                                  <div className="text-[10px] uppercase font-bold">{metabolism.status}</div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* DISTRIBUTION */}
                  <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                      <h2 className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Users size={14} /> 住民のゆとり具合
                      </h2>
                      <div className="space-y-4">
                          {[
                              { label: "🌕 潤沢", ratio: distRatio.full, color: "bg-yellow-400" },
                              { label: "🌓 安定", ratio: distRatio.quarter, color: "bg-slate-300" },
                              { label: "🌑 枯渇", ratio: distRatio.new, color: "bg-cyan-500" }
                          ].map((item, i) => (
                              <div key={i}>
                                  <div className="flex justify-between text-xs font-bold mb-1">
                                      <span className="text-slate-300">{item.label}</span>
                                      <span className="text-slate-100">{(item.ratio * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full ${item.color}`} style={{ width: `${item.ratio * 100}%` }} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* SETTINGS */}
                  <div id="time-control-section" className="p-6 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 relative overflow-hidden">
                      <h2 className="text-xs font-bold text-yellow-600/70 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Settings size={14} /> 世界のリズム調整
                      </h2>
                      <div className="flex flex-col items-center">
                          <div className="text-5xl font-bold text-yellow-500 font-mono mb-6">{cycleDays} Days</div>
                          <input type="range" min="5" max="20" value={cycleDays} onChange={(e) => setCycleDays(parseInt(e.target.value))} className="w-full mb-4 accent-yellow-500" />
                          <button onClick={async () => {
                              if (window.confirm("法を改正しますか？")) {
                                try {
                                    if (!db) return;
                                    await setDoc(doc(db, "system_settings", "global"), { cycleDays, updated_at: serverTimestamp() }, { merge: true });
                                    alert("完了");
                                } catch (e) { alert("失敗"); }
                              }
                          }} className="w-full py-3 rounded-lg bg-slate-800 text-yellow-500 font-bold text-xs">法を公布する</button>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'citizens' && (
            <div className="animate-in fade-in duration-300">
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                            <input type="text" placeholder="Search..." className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {isLoadingUsers ? (
                            <div className="p-8 text-center text-slate-500">Scanning bio-signals...</div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className="p-4 flex justify-between items-center hover:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{u.name?.charAt(0)}</div>
                                            <div>
                                                <div className="font-bold text-sm">{u.name || 'Unknown'}</div>
                                                <div className="font-mono text-[10px] text-slate-600">{u.id}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleSuperAdmin(u)} className={`p-2 rounded-lg border ${superAdminIds.includes(u.id) ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-500'}`}><Shield size={14} fill={superAdminIds.includes(u.id) ? "currentColor" : "none"}/></button>
                                            <button onClick={() => toggleAdmin(u)} className={`p-2 rounded-lg border ${u.role === 'admin' ? 'border-red-500 text-red-500' : 'border-slate-700 text-slate-500'}`}><Shield size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="animate-in fade-in duration-300 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-200">招待コード管理</h3>
                    <button 
                        onClick={generateInviteCode}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> コード生成
                    </button>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto">
                        {inviteCodes.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">コードがありません</div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {inviteCodes.slice().sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0)).map(code => (
                                    <div key={code.id} className="p-4 flex justify-between items-center hover:bg-slate-800/30 font-mono">
                                        <div>
                                            <div className="text-lg font-bold text-slate-100">{code.id}</div>
                                            <div className="text-[10px] text-slate-500">
                                                作成日: {code.created_at?.toDate().toLocaleString() || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {code.is_used ? (
                                                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-slate-700">
                                                    使用済み
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-500/30">
                                                    未使用
                                                </span>
                                            )}
                                            {code.used_by && (
                                                <div className="text-[10px] text-slate-500 max-w-[80px] truncate" title={code.used_by}>
                                                    UID: {code.used_by.substring(0, 8)}...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                    ※ コードは ALPHA-XXXX 形式でランダムに生成されます。
                </p>
            </div>
          )}

          {activeTab === 'integrity' && (
            <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trash2 className="text-red-400" size={20} /> Orphan Cleanup</h2>
                    <button 
                        disabled={isCleaningUp}
                        onClick={async () => {
                            if (!window.confirm("掃除を開始しますか？")) return;
                            setIsCleaningUp(true);
                            try {
                                if (!db) return;
                                const wishesRef = collection(db, "wishes");
                                await getDocs(query(wishesRef, where("status", "==", "open"), limit(1)));
                                // basic cleanup logic placeholder
                                alert("Cleanup finished (Simulated for safety)");
                            } catch (e) { alert("Error"); } finally { setIsCleaningUp(false); }
                        }} 
                        className={`w-full py-4 rounded-xl border transition-colors ${isCleaningUp ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-red-900/30 text-red-400 border-red-900/50 hover:bg-red-900/40'}`}
                    >
                        {isCleaningUp ? 'Cleaning up...' : '掃除を実行する'}
                    </button>
                    {cleanupLog.length > 0 && <div className="mt-4 p-4 bg-black/40 rounded border border-white/5 font-mono text-[10px]">{cleanupLog.map((l,i)=><div key={i}>{l}</div>)}</div>}
                </div>
            </div>
          )}
        </div>
      </div>

      {showDiagnosisModal && (
        <DiagnosticModal 
            isOpen={showDiagnosisModal}
            diagnosis={diagnostics}
            stats={stats} 
            onClose={() => setShowDiagnosisModal(false)}
            onScrollToSupply={scrollToSupply}
        />
      )}
      
      {showManual && (
        <div className="fixed inset-0 z-[150] bg-black/98 flex flex-col p-6 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
            <h2 className="text-2xl font-serif font-bold text-slate-100 italic">Existential Economy Protocol</h2>
            <button onClick={() => setShowManual(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={32} /></button>
          </div>
          <div className="flex-1 overflow-y-auto font-serif text-lg leading-relaxed text-slate-400 max-w-2xl mx-auto space-y-12 pb-20 scrollbar-hide">
            <section>
              <h3 className="text-xl font-bold text-slate-200 mb-4 tracking-widest uppercase">Fundamental Axiom: Gravity</h3>
              <p>Lm decays naturally over time—representing the entropy of existence. Stagnation is death.</p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
