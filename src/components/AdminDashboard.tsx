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
import { motion, AnimatePresence } from "framer-motion";
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
    
    // SAFEGUARD 1: Confirmation
    if (!window.confirm(`${user.name || user.id} のスーパー管理者権限を変更しますか？\n(Change Super Admin status?)`)) {
        return;
    }

    try {
        const isCurrentlySuper = superAdminIds.includes(user.id);
        
        // SAFEGUARD 2: Prevent locking out the last admin
        if (isCurrentlySuper && superAdminIds.length <= 1) {
            alert("最後のスーパー管理者は削除できません。\n(Cannot remove the last Super Admin.)");
            return;
        }

        const newSuperIds = isCurrentlySuper 
            ? superAdminIds.filter(id => id !== user.id)
            : [...superAdminIds, user.id];
        
        await setDoc(doc(db, "system_settings", "global"), { super_admin_ids: newSuperIds }, { merge: true });
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

        <div className="flex gap-4 mb-6 border-b border-slate-800 overflow-x-auto whitespace-nowrap no-scrollbar pb-2">
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
                  className={`w-full p-4 sm:p-5 rounded-2xl border-2 ${diagnostics.bg} ${diagnostics.text} mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-black/20`}
              >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="p-3 rounded-full bg-white/10 ring-4 ring-white/5 shrink-0">
                          <Activity size={24} className="animate-pulse" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                          <div className="text-[10px] uppercase tracking-[0.3em] opacity-80 mb-1 font-bold">Health Status</div>
                          <div className="text-lg sm:text-2xl font-serif font-bold tracking-wide break-words leading-tight">{diagnostics.shortDescription}</div>
                      </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono px-4 py-2 bg-white/10 rounded-full opacity-80 group-hover:opacity-100 transition-opacity w-full sm:w-auto mt-2 sm:mt-0">
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
      
      <AnimatePresence>
        {showManual && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManual(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-full md:max-h-[90vh] bg-white text-slate-800 rounded-none md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Manual Header */}
              <div className="flex justify-between items-start p-6 md:p-10 border-b-2 border-slate-900 bg-white sticky top-0 z-10">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-[0.2em] text-[10px] md:text-xs font-sans">
                    <Activity size={14} />
                    <span>Existence Ticker Protocol v2.0</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 leading-tight">
                    自律分散型互助生態系構想書
                    <span className="block text-sm md:text-lg font-sans font-normal text-slate-500 mt-2">Autonomous Mutual Aid Ecosystem Protocol</span>
                  </h1>
                </div>
                <button
                  onClick={() => setShowManual(false)}
                  className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Manual Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-16 font-serif leading-relaxed text-base md:text-lg text-slate-700 bg-white no-scrollbar">
                
                {/* Introduction */}
                <section className="prose prose-slate max-w-none">
                  <p className="text-lg md:text-xl italic text-slate-500 border-l-4 border-slate-200 pl-6 py-2">
                    本ドキュメントは、本システムの投資家および設計協力者に向けたアーキテクチャ解説書です。<br/>
                    我々は「富の保存」ではなく「感謝の循環」を価値の源泉とする、新たな経済物理学を実装しました。
                  </p>
                </section>

                {/* Chapter 1 */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl md:text-6xl font-thin text-slate-200">01</span>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-sans">理念 (Philosophy)</h2>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-4">"Stock" から "Flow" へ</h3>
                  <p className="mb-6">
                    現代社会の閉塞感は「感謝の滞留」にあります。エネルギー（貨幣）が循環の媒体としての機能を失い、個人の所有物（Stock）としてダムのように堰き止められた時、生態系は枯れ果てます。<br/>
                    我々はこの問題を解決するために、通貨を<strong className="text-slate-900 font-bold bg-yellow-100 px-1">「保存する資産（Stock）」から「感謝を伝えるエネルギー（Flow）」へと再定義</strong>しました。
                  </p>
                  <p>
                    この世界では、溜め込むことは腐敗（減価）を意味し、他者へ循環させることこそが生存戦略となります。<br/>
                    住人は「富を得るため」ではなく、「誰かを助け、誰かに助けられるため」にこのエネルギーを使用します。
                  </p>
                </section>

                {/* Chapter 2 */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl md:text-6xl font-thin text-slate-200">02</span>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-sans">構造 (Mechanism)</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded border border-slate-100">
                      <h3 className="text-base md:text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                        <span className="text-red-400">▼</span> エントロピー (Entropy)
                      </h3>
                      <p className="text-sm md:text-base text-slate-600">
                        自然界の法則と同様に、全てのエネルギーは時間とともに散逸（Decay）します。
                        現在、<span className="font-mono bg-slate-200 text-slate-800 px-1 text-xs md:text-sm">毎時 10 Lm</span> の減価圧力がシステム全体にかかっています。
                        これにより、既得権益の固定化（格差の固定）を物理的に阻止し、常に新たな代謝を促します。
                      </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded border border-slate-100">
                      <h3 className="text-base md:text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                        <span className="text-yellow-500">▲</span> 太陽 (The Sun)
                      </h3>
                      <p className="text-sm md:text-base text-slate-600">
                        減価によって失われた総量は、システム全体への「生命贈与（Basic Supply）」として還元されます。
                        これは行政による「給付」でも、富める者からの「再分配」でもありません。<br/>
                        あなたがここに<strong className="text-slate-900">「存在している」という事実そのものを担保にして</strong>、天から無条件に降り注ぐ<span className="font-mono bg-slate-200 text-slate-800 px-1 text-xs md:text-sm">光のギフト</span>です。
                        太陽が昇る限り、あなたの生存は世界によって肯定され続けます。
                      </p>
                    </div>
                  </div>
                </section>

                {/* Chapter 3 */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl md:text-6xl font-thin text-slate-200">03</span>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-sans">統治 (Governance)</h2>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-4">支配ではなく、調律</h3>
                  <p className="mb-6">
                    管理者の役割は、住人の個別のやり取りを監視することではありません。<br/>
                    世界の「温度（代謝率）」と「湿度（エネルギー分布）」を観測し、<strong className="text-slate-900 font-bold">「再生サイクル期間（Regeneration Cycle Duration）」というたった一つの物理定数（時間軸）を調整すること</strong>だけが許された権限です。
                  </p>
                  
                  <div className="bg-slate-900 text-white p-6 md:p-8 rounded-sm shadow-xl mt-8">
                     <h4 className="font-sans text-[10px] md:text-xs uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">管理者の誓い (Admin Protocol)</h4>
                     <p className="font-mono text-xs md:text-sm leading-relaxed text-slate-300">
                       &gt; We do not manage the economy. <span className="text-slate-500 text-xs">(我々は経済を管理しない)</span><br/>
                       &gt; We design the ecosystem. <span className="text-slate-500 text-xs">(我々は生態系を設計する)</span><br/>
                       &gt; <br/>
                       &gt; The goal is to maximize the "Circulation Rate" (Metabolism), not the "Total Asset Value" (Stock).<br/>
                       <span className="text-slate-500 text-xs pl-4 block mb-1"> (目的は「循環」の最大化であり、「総資産」の最大化ではない)</span>
                       &gt; A healthy world is not one where everyone is rich, but one where help is always available.<br/>
                       <span className="text-slate-500 text-xs pl-4 block"> (健全な世界とは、全員が富裕な場所ではなく、救済が常に遍在する場所である)</span>
                     </p>
                  </div>
                </section>

                {/* Chapter 4 */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl md:text-6xl font-thin text-slate-200">04</span>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-sans">運用規約 (Operational Protocols)</h2>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold mb-6 font-sans">4.1 構造的制約 (Structural Constraints)</h3>
                  <div className="bg-slate-50 p-6 rounded border border-slate-100 mb-8">
                     <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                         <span className="text-blue-600">ℹ</span> 基準値 (Standard Baseline)
                     </h4>
                     <p className="font-mono text-slate-600 text-[11px] md:text-sm mb-4 leading-relaxed">
                         本システムのデフォルト容量（物理定数）は <strong className="text-slate-900">2400 Lm</strong> に設定されています。<br/><br/>
                         これは「24時間 × 10日間 = 2400 Lm」という, <strong className="text-slate-900">一人の人間が誰にも助けられずに生存できる最大備蓄量</strong>を意味します。孤立した個体が保持できるエネルギーの物理的限界点です。<br/><br/>
                         この器（Cap）を超えたエネルギーは「溢出（Overflow）」となり、虚空へ還ります。<br/>
                         しかし、この「溢れ」こそが、実は「太陽（Basic Supply）」のエネルギー源として再利用される<strong className="text-slate-900">隠れたエコシステム・ループ</strong>を形成しています。<br/>
                         個人の余剰は、巡り巡って世界全体の生命維持装置を稼働させる燃料となるのです。
                     </p>

                     <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-t border-slate-200 pt-4 text-sm md:text-base">
                         <span className="text-yellow-600">⚠</span> 法の不遡及 (Law of Non-Retroactivity)
                     </h4>
                     <p className="text-slate-600 text-[11px] md:text-sm mb-0 leading-relaxed">
                         「再生サイクルの期間」の変更は、即座に全ユーザーに適用されるわけではありません。<br/>
                         各ユーザーは個別に決定された「リセット日」を持っており、新しい時間設定は<strong className="text-slate-900">個々の次回リセット計算時</strong>に初めて適用されます。<br/>
                         したがって、調律（Tuning）の効果が生態系全体に行き渡るまでには、現行サイクルの解消待ち（Latency）が発生します。
                     </p>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold mb-6 font-sans">4.2 生体バイタル (Vital Signs)</h3>
                  
                  <div className="space-y-6">
                      {/* KPI 1 */}
                      <div>
                          <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-base md:text-lg text-slate-800 mb-2">
                              A. 経済代謝率 (Metabolic Rate)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm mb-2">
                               <div className="bg-slate-50 p-3 rounded">
                                   <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Calculation</div>
                                   <div className="font-mono text-slate-700">Daily Volume ÷ Total Supply × 100 (%)</div>
                               </div>
                               <div className="bg-slate-50 p-3 rounded">
                                   <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Target Zone</div>
                                   <div className="font-mono text-green-600 font-bold">&gt; 10.0% (Ideal)</div>
                               </div>
                          </div>
                          <p className="text-slate-600 text-xs md:text-sm">
                              総滞留量（GDP）の多寡は重要ではありません。「血液の流速」こそが生命の証です。<br/>
                              5%を下回る状態は「心停止」と同義であり、緊急の介入（Divine Intervention）を要します。
                          </p>
                      </div>
                  </div>
                </section>

                {/* Glossary Supplement (merged from previous fix) */}
                <section className="bg-slate-50 p-6 md:p-10 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-400 mb-6 tracking-[0.3em] uppercase">Supplemental Glossary / 用語補足</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">存在ルーメン (Lm)</h4>
                      <p className="text-slate-500 leading-relaxed md:text-xs">生命エネルギーの単位。全ての価値と時間の最小構成要素。</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">代謝 (Metabolism)</h4>
                      <p className="text-slate-500 leading-relaxed md:text-xs">システム内の全エネルギー流動量。世界の活力を示す指標。</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">積立比率 (Committed)</h4>
                      <p className="text-slate-500 leading-relaxed md:text-xs">特定の目的（Wish/Trust）に固定され、循環から一時的に離れたLmの割合。</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">賢者の助言 (Sage)</h4>
                      <p className="text-slate-500 leading-relaxed md:text-xs">生体バイタルに基づいて「調律」の方向性を提示するシステム内示。</p>
                    </div>
                  </div>
                </section>

                {/* Footer */}
                <div className="pt-20 text-center">
                   <div className="w-16 h-px bg-slate-300 mx-auto mb-6"></div>
                   <p className="text-slate-400 font-sans text-[10px] uppercase tracking-widest leading-loose">
                     Proprietary & Confidential<br/>
                     Designed for The Mutual Aid Economic Zone<br/>
                     <span className="italic mt-4 block text-[8px]">entropy is the only constant.</span>
                   </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
