import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Activity, Moon, Sun, AlertTriangle, Book, Users, Search, Shield, Trash2, Archive, Droplets } from "lucide-react";
import { useStats, MetabolismStatus } from "../hooks/useStats";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticModal } from "./DiagnosticModal";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { calculateDecayedValue, toMilli, fromMilli, getMillis } from "../logic/worldPhysics";


interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error } = useStats(); // updateCapacity removed
  const diagnostics = useDiagnostics(stats);
  const [cycleDays, setCycleDays] = useState(10);
  const [showManual, setShowManual] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  // User Management State
  const [activeTab, setActiveTab] = useState<'monitor' | 'citizens' | 'integrity'>('monitor');
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupLog, setCleanupLog] = useState<string[]>([]);
  const [superAdminIds, setSuperAdminIds] = useState<string[]>([]);



  React.useEffect(() => {
    const fetchConfig = async () => {
        try {
            if (!db) return;
            const { doc, getDoc } = await import("firebase/firestore");
            
            const settingsRef = doc(db, "system_settings", "global");
            const snap = await getDoc(settingsRef);
            if (snap.exists() && snap.data().cycleDays) {
                setCycleDays(snap.data().cycleDays);
            }
        } catch (e) {
            console.error("Failed to fetch cycle config", e);
        }
    };
    fetchConfig();
  }, []);

  const fetchUsers = useCallback(async () => {
      setIsLoadingUsers(true);
      try {
          if (!db) return;
          const { collection, getDocs, query, limit } = await import("firebase/firestore");
          
          const usersRef = collection(db, "users");
          const q = query(usersRef, limit(50));

          const snapshot = await getDocs(q);
          const users = snapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                  ...data, 
                  id: doc.id,
                  last_updated: getMillis(data.last_updated),
                  cycle_started_at: getMillis(data.cycle_started_at),
                  created_at: getMillis(data.created_at)
              } as UserProfile;
          });
          
          // Client-side sort (now using normalized numbers)
          users.sort((a, b) => (Number(b.last_updated) || 0) - (Number(a.last_updated) || 0));
          
          setUserList(users);

          // Fetch Super Admins
          const superRef = collection(db, "super_admins");
          const superSnap = await getDocs(superRef);
          setSuperAdminIds(superSnap.docs.map(d => d.id));
      } catch (e) {
          console.error("Failed to fetch users", e);
      } finally {
          setIsLoadingUsers(false);
      }
  }, []);

  const toggleAdmin = async (u: UserProfile) => {
    if (!window.confirm(`⚠️ ${u.name || u.id} の権限を変更しますか？`)) return;
    try {
        if (!db) return;
        const { doc, updateDoc } = await import("firebase/firestore");
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        await updateDoc(doc(db, "users", u.id), {
            role: newRole
        });
        alert(`権限を ${newRole} に変更しました。`);
        fetchUsers();
    } catch (e) {
        console.error(e);
        alert("変更に失敗しました");
    }
  };

  const toggleSuperAdmin = async (u: UserProfile) => {
    const isCurrentlySuper = superAdminIds.includes(u.id);
    if (!window.confirm(`⚠️ ${u.name || u.id} の【特別権限（Super Admin）】を${isCurrentlySuper ? '剥奪' : '付与'}しますか？`)) return;
    
    try {
        if (!db) return;
        const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
        const superRef = doc(db, "super_admins", u.id);
        
        if (isCurrentlySuper) {
            await deleteDoc(superRef);
        } else {
            await setDoc(superRef, { 
                uid: u.id,
                email: u.email || "unknown", 
                is_super: true, 
                granted_at: new Date().toISOString() 
            });
        }
        
        alert(`特別権限を${isCurrentlySuper ? '剥奪' : '付与'}しました。`);
        fetchUsers();
    } catch (e) {
        console.error(e);
        alert("変更に失敗しました");
    }
  };

  // Fetch Users Logic
  React.useEffect(() => {
      if (activeTab === 'citizens') {
          fetchUsers();
      }
  }, [activeTab, fetchUsers]);




  const filteredUsers = userList.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.id?.includes(searchQuery)
  );



  // Lock body scroll when dashboard is open
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!stats) {
      return (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
              <div className="text-center">
                  <Activity className="w-10 h-10 text-yellow-500 animate-pulse mx-auto mb-4" />
                  <div className="text-white font-mono tracking-widest text-xs">Loading Economy...</div>
              </div>
              <button 
                  onClick={onClose}
                  className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                  <X size={24} />
              </button>
          </div>
      );
  }

  const { cycle, metabolism, distribution } = stats;

  const getMetaColor = (s: MetabolismStatus) => {
    if (s === "Active") return "text-green-400";
    if (s === "Stable") return "text-yellow-400";
    return "text-red-500";
  };

  const totalPop = distribution.full + distribution.quarter + distribution.new;

  const distRatio = {
    full: distribution.full / (totalPop || 1), // Avoid DBZ
    quarter: distribution.quarter / (totalPop || 1),
    new: distribution.new / (totalPop || 1),
  };

  return (
    <div id="admin-scroll-container" className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-md ${showManual ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {/* Header (Full Width Sticky) */}
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

      <div className="min-h-full p-4 pb-40 max-w-3xl mx-auto relative">

        {error && (
          <div className="mb-4 p-3 border border-red-500/30 bg-red-900/10 rounded text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}


        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-slate-800">
            <button
                onClick={() => setActiveTab('monitor')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'monitor' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Activity size={16} />
                Monitor
            </button>
            <button
                onClick={() => setActiveTab('citizens')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'citizens' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Users size={16} />
                Citizens
            </button>
            <button
                onClick={() => setActiveTab('integrity')}
                className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'integrity' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Shield size={16} />
                Integrity
            </button>

        </div>

        {/* Content Stack */}
        <div className="flex flex-col gap-6">

        {activeTab === 'citizens' ? (
            <div className="animate-in fade-in duration-300">
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="ID or Check Name..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 placeholder-slate-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            {filteredUsers.length} Users Loaded
                        </div>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto">
                        {isLoadingUsers ? (
                            <div className="p-8 text-center text-slate-500">Scanning bio-signals...</div>
                        ) : (
                            <div className="w-full text-slate-400">
                                {/* Responsive Header - Hidden on Mobile */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800/50 text-xs uppercase font-mono text-slate-500 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-700">
                                    <div className="col-span-5">User</div>
                                    <div className="col-span-3">Status</div>
                                    <div className="col-span-2">Role</div>
                                    <div className="col-span-2 text-right">Actions</div>
                                </div>

                                {/* Responsive Body */}
                                <div className="divide-y divide-slate-800">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} className="p-4 md:px-6 md:py-4 hover:bg-slate-800/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-4 items-start md:items-center">
                                            {/* User Info Col (Mobile: Row 1) */}
                                            <div className="col-span-5 flex items-center gap-3 w-full mb-3 md:mb-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-300">
                                                    {u.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-slate-200 truncate">{u.name || 'Unknown'}</div>
                                                    <div className="flex flex-col">
                                                        <div className="font-mono text-xs text-slate-600 truncate">{u.id}</div>
                                                        {u.email && <div className="font-mono text-xs text-blue-400/70 truncate">{u.email}</div>}
                                                        {!u.email && <div className="text-xs text-red-500/70 italic">Email Missing</div>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Col (Mobile: Row 2) */}
                                            <div className="col-span-3 mb-2 md:mb-0 w-full md:w-auto flex items-center md:block text-xs">
                                                <span className="md:hidden text-slate-500 w-16 flex-shrink-0">Status:</span>
                                                <span>Warmth: {u.warmth?.toLocaleString()}</span>
                                            </div>

                                            {/* Role Col (Mobile: Row 3) */}
                                            <div className="col-span-2 mb-4 md:mb-0 w-full md:w-auto flex items-center md:block text-xs">
                                                <span className="md:hidden text-slate-500 w-16 flex-shrink-0">Role:</span>
                                                <div className="inline-flex flex-col items-start gap-1">
                                                    {superAdminIds.includes(u.id) && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-black border border-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                                                            <Shield size={10} fill="black" />
                                                            SUPER ADMIN
                                                        </span>
                                                    )}
                                                    {u.role === 'admin' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
                                                            <Shield size={10} />
                                                            Admin
                                                        </span>
                                                    )}
                                                    {u.role !== 'admin' && !superAdminIds.includes(u.id) && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500">
                                                            User
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Col (Mobile: Row 4) */}
                                            <div className="col-span-2 w-full md:w-auto flex justify-end gap-2">
                                                <button
                                                    onClick={() => toggleSuperAdmin(u)}
                                                    className={`p-2 rounded-lg transition-colors border ${superAdminIds.includes(u.id)
                                                        ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-500 hover:bg-yellow-400/30'
                                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'}`}
                                                    title={superAdminIds.includes(u.id) ? "特別権限を剥奪" : "特別権限を付与"}
                                                >
                                                    <Shield size={16} fill={superAdminIds.includes(u.id) ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => toggleAdmin(u)}
                                                    className={`p-2 rounded-lg transition-colors border ${u.role === 'admin' 
                                                        ? 'bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/30' 
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                                                    title={u.role === 'admin' ? "一般ユーザーに降格" : "管理者に昇格"}
                                                >
                                                    <Shield size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!isLoadingUsers && filteredUsers.length === 0 && (
                             <div className="p-12 text-center text-slate-600 flex flex-col items-center gap-2">
                                <Search size={24} className="opacity-50" />
                                <p>No users found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : activeTab === 'integrity' ? (
            <div className="animate-in fade-in duration-300 space-y-6">
                
                {/* 1. Orphan Cleanup */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Trash2 className="text-red-400" size={20} />
                        <h2 className="text-xl font-bold text-slate-200">Orphan Cleanup (孤立データの掃拭)</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 font-serif italic">
                        "この世界から去った者が残した未練（願い）を静かに還します。"
                    </p>

                    <button
                        onClick={async () => {
                            if (!window.confirm("⚠️ ゴーストデータ（孤立した願い）の掃除を開始しますか？")) return;
                            setIsCleaningUp(true);
                            setCleanupLog(["[Init] 探索の準備をしています..."]);
                            try {
                                if (!db) throw new Error("Database not initialized");
                                const { collection, getDocs, query, limit, doc, writeBatch, getDoc } = await import("firebase/firestore");
                                
                                const wishesRef = collection(db, "wishes");
                                const wishSnapshot = await getDocs(query(wishesRef, limit(500)));
                                const usersRef = collection(db, "users");

                                let deletedCount = 0;
                                const batch = writeBatch(db);

                                for (const wishDoc of wishSnapshot.docs) {
                                    const wish = wishDoc.data();
                                    const requesterId = wish.requester_id;
                                    if (requesterId) {
                                        const userDoc = await getDoc(doc(usersRef, requesterId));
                                        if (!userDoc.exists()) {
                                            batch.delete(wishDoc.ref);
                                            deletedCount++;
                                            setCleanupLog(prev => [...prev, `🗑️ Orphan: ${wish.content?.slice(0,15)}... (Master missing)`]);
                                        }
                                    }
                                }

                                if (deletedCount > 0) {
                                    await batch.commit();
                                    setCleanupLog(prev => [...prev, `✅ 完了: ${deletedCount}件の孤立データを整理しました。`]);
                                } else {
                                    setCleanupLog(prev => [...prev, "✨ 孤立データは検出されませんでした。"]);
                                }
                            } catch (e) {
                                console.error(e);
                                setCleanupLog(prev => [...prev, `❌ Error: ${String(e)}`]);
                            } finally {
                                setIsCleaningUp(false);
                            }
                        }}
                        disabled={isCleaningUp}
                        className="w-full py-4 rounded-xl bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 hover:border-red-500 text-red-400 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCleaningUp ? "浄化中..." : <><Trash2 size={16} /> 孤立データを掃除する</>}
                    </button>
                </div>

                {/* 2. World Recount */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="text-blue-400" size={20} />
                        <h2 className="text-xl font-bold text-blue-400">World Recount (生存統計の編纂)</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 font-serif italic">
                        "この世界の各地に住まう魂の数を改めて数え直し、地図を正します。"
                    </p>

                    <button
                        onClick={async () => {
                            if (!window.confirm("⚠️ 全住民の所在地を集計し直しますか？")) return;
                            setIsCleaningUp(true);
                            setCleanupLog(["[Init] 住民名簿を広げています..."]);
                            try {
                                if (!db) throw new Error("Database not initialized");
                                const { collection, getDocs, query, writeBatch, doc } = await import("firebase/firestore");
                                
                                const userSnap = await getDocs(query(collection(db, "users")));
                                const countsMap: Record<string, number> = {};
                                userSnap.docs.forEach(uDoc => {
                                    const data = uDoc.data();
                                    if (data.location?.prefecture && data.location?.city) {
                                        const key = `${data.location.prefecture}_${data.location.city}`;
                                        countsMap[key] = (countsMap[key] || 0) + 1;
                                    }
                                });

                                const statsRef = collection(db, "location_stats");
                                const statsSnap = await getDocs(query(statsRef));
                                const batch = writeBatch(db);
                                statsSnap.docs.forEach(sDoc => batch.delete(sDoc.ref));
                                Object.entries(countsMap).forEach(([key, count]) => {
                                    batch.set(doc(db!, "location_stats", key), { count });
                                });

                                await batch.commit();
                                setCleanupLog(prev => [...prev, `✅ 完了: ${Object.keys(countsMap).length}地域の統計を更新しました。`]);
                            } catch (e) {
                                console.error(e);
                                setCleanupLog(prev => [...prev, `❌ Error: ${String(e)}`]);
                            } finally {
                                setIsCleaningUp(false);
                            }
                        }}
                        disabled={isCleaningUp}
                        className="w-full py-4 rounded-xl bg-blue-900/30 hover:bg-blue-900/50 border border-blue-900/50 hover:border-blue-500 text-blue-400 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCleaningUp ? "編纂中..." : <><Users size={16} /> 統計を再構成する</>}
                    </button>
                </div>

                {/* 3. Wish Crystallization */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Archive className="text-indigo-400" size={20} />
                        <h2 className="text-xl font-bold text-indigo-400">Wish Crystallization (想いの結晶化)</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 font-serif italic">
                        "既に叶った、あるいは途絶えた想いを、永久不変の結晶として記録に刻みます。"
                    </p>

                    <button
                        onClick={async () => {
                            if (!window.confirm("⚠️ 終了した願いを物理削除し、履歴（Transaction）のみを残しますか？")) return;
                            setIsCleaningUp(true);
                            setCleanupLog(["[Init] 想いの抽出を開始します..."]);
                            try {
                                if (!db) throw new Error("Database not initialized");
                                const { collection, getDocs, query, where, doc, writeBatch, Timestamp } = await import("firebase/firestore");
                                
                                const wishesRef = collection(db, "wishes");
                                const q = query(wishesRef, where("status", "in", ["fulfilled", "completed", "cancelled", "expired", "interrupted"]));
                                const snap = await getDocs(q);
                                if (snap.empty) {
                                    setCleanupLog(prev => [...prev, "✨ 整理対象の願いは見つかりませんでした。"]);
                                    return;
                                }

                                let successCount = 0;
                                const batch = writeBatch(db);
                                for (const wishDoc of snap.docs) {
                                    const wishData = wishDoc.data();
                                    const txRef = collection(db, "transactions");
                                    const txSnap = await getDocs(query(txRef, where("wish_id", "==", wishDoc.id)));

                                    if (txSnap.empty) {
                                        const newTxRef = doc(db, "transactions", `crystallize_${wishDoc.id}`);
                                        batch.set(newTxRef, {
                                            amount: wishData.val_at_fulfillment || wishData.cost || 0,
                                            timestamp: Timestamp.now(),
                                            created_at: wishData.cancelled_at || wishData.fulfilled_at || wishData.created_at || Timestamp.now(),
                                            type: "WISH_CRYSTALLIZED",
                                            wish_id: wishDoc.id,
                                            wish_title: wishData.content,
                                            sender_id: wishData.requester_id,
                                            sender_name: wishData.requester_name || "Unknown",
                                            recipient_id: wishData.helper_id || null,
                                            recipient_name: wishData.helper_name || null
                                        });
                                    }
                                    batch.delete(wishDoc.ref);
                                    successCount++;
                                    setCleanupLog(prev => [...prev, `💎 Crystallized: ${wishData.content?.slice(0,15)}...`]);
                                }
                                await batch.commit();
                                setCleanupLog(prev => [...prev, `✅ 完了: ${successCount}件の願いを昇華しました。`]);
                            } catch (e) {
                                console.error(e);
                                setCleanupLog(prev => [...prev, `❌ Error: ${String(e)}`]);
                            } finally {
                                setIsCleaningUp(false);
                            }
                        }}
                        disabled={isCleaningUp}
                        className="w-full py-4 rounded-xl bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-900/50 hover:border-indigo-500 text-indigo-400 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCleaningUp ? "昇華中..." : <><Archive size={16} /> 結晶化を実行する</>}
                    </button>
                </div>

                {/* 4. Vessel Purification */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Droplets className="text-cyan-400" size={20} />
                        <h2 className="text-xl font-bold text-cyan-400">Vessel Purification (器の正常化)</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 font-serif italic">
                        "未完了の願いと、住民の器の予約状況に不一致がないか確認します。"
                    </p>

                    <button
                        onClick={async () => {
                            if (!window.confirm("⚠️ 予約金額（committed_lm）の不整合を修復しますか？")) return;
                            setIsCleaningUp(true);
                            setCleanupLog(["[Init] 魂の器をスキャン中..."]);
                            try {
                                if (!db) throw new Error("Database not initialized");
                                const { collection, getDocs, writeBatch, serverTimestamp } = await import("firebase/firestore");
                                
                                const wishesSnap = await getDocs(collection(db, "wishes"));
                                const activeWishes = wishesSnap.docs.filter(d => ["open", "in_progress", "review_pending"].includes(d.data().status));
                                const userReservationMap = new Map<string, number>();

                                activeWishes.forEach(wDoc => {
                                    const wData = wDoc.data();
                                    const startMs = getMillis(wData.created_at);
                                    const decayedMilli = calculateDecayedValue(toMilli(wData.cost || 0), ((Date.now() - startMs) / 1000) | 0);
                                    userReservationMap.set(wData.requester_id, (userReservationMap.get(wData.requester_id) || 0) + decayedMilli);
                                });

                                const usersSnap = await getDocs(collection(db, "users"));
                                const batch = writeBatch(db);
                                let fixCount = 0;

                                usersSnap.docs.forEach(uDoc => {
                                    const uData = uDoc.data();
                                    const expected = userReservationMap.get(uDoc.id) || 0;
                                    const uLastMs = getMillis(uData.last_updated);
                                    const currentCommittedMilli = calculateDecayedValue(toMilli(uData.committed_lm || 0), ((Date.now() - uLastMs)/1000)|0);

                                    if (Math.abs(expected - currentCommittedMilli) > 1) {
                                        const currentBalanceMilli = calculateDecayedValue(toMilli(uData.balance || 0), ((Date.now() - uLastMs)/1000)|0);
                                        batch.update(uDoc.ref, {
                                            balance: fromMilli(currentBalanceMilli),
                                            committed_lm: fromMilli(expected),
                                            last_updated: serverTimestamp(),
                                            system_note: "Purified by Admin"
                                        });
                                        fixCount++;
                                        setCleanupLog(prev => [...prev, `🔧 Fix: ${uData.name || uDoc.id} (${fromMilli(currentCommittedMilli)} → ${fromMilli(expected)})`]);
                                    }
                                });

                                if (fixCount > 0) await batch.commit();
                                setCleanupLog(prev => [...prev, `✅ 完了: ${fixCount}名の器を正常化しました。`]);
                            } catch (e) {
                                console.error(e);
                                setCleanupLog(prev => [...prev, `❌ Error: ${String(e)}`]);
                            } finally {
                                setIsCleaningUp(false);
                            }
                        }}
                        disabled={isCleaningUp}
                        className="w-full py-4 rounded-xl bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-900/50 hover:border-cyan-500 text-cyan-400 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCleaningUp ? "正常化中..." : <><Droplets size={16} /> 整合性を修復する</>}
                    </button>
                </div>

                {/* execution log overlay */}
                {cleanupLog.length > 0 && (
                    <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700 font-mono text-xs text-slate-300">
                        <div className="flex items-center gap-2 mb-2 font-bold text-slate-400 uppercase tracking-tighter">
                            <Activity size={12} /> Live Inventory Status
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                            {cleanupLog.map((line, i) => <div key={i} className="border-l border-slate-700 pl-2">{line}</div>)}
                        </div>
                    </div>
                )}
            </div>

        ) : (
          <>
          {/* WORLD HEALTH DIAGNOSIS BANNER */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowDiagnosisModal(true)}
            className={`w-full p-4 rounded-2xl border ${diagnostics.bg} ${diagnostics.text} mb-6 flex items-center justify-between group transition-all hover:scale-[1.01] active:scale-[0.99]`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/10">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-widest opacity-70 mb-0.5">
                  World Health Status (現在の生態系診断)
                </div>
                <div className="text-lg font-serif font-bold tracking-wide">
                  {diagnostics.shortDescription}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View Analysis</span>
              <Book size={14} />
            </div>
          </motion.button>

          {/* SECTION A: ACTIVE CYCLES */}
          <div
            className={`p-6 rounded-2xl border border-slate-700 bg-slate-900/20 relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Moon size={100} />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-widest opacity-70 mb-4">
              現在の暦 (Cycle Status)
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-3xl font-bold text-slate-200">
                  Day {cycle.day}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  現在のサイクル日数
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  ({cycle.season} Phase)
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono text-cyan-300">
                    {cycle.rebornToday}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-400">
                      Souls Reborn Today
                    </span>
                    <span className="text-xs text-slate-500">
                      本日の再生数 (Rebirths)
                    </span>
                  </div>
                </div>

                {(() => {
                  const rate = (cycle.rebornToday / (totalPop || 1)) * 100;
                  const barWidth = Math.min(100, (rate / 20) * 100);
                  const isWarning = rate >= 20;
                  return (
                    <div className="mt-1">
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${isWarning ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-cyan-500/50"} animate-pulse`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                        <div className="flex justify-between mt-1 px-0.5">
                        <span className="text-xs text-slate-600 font-mono">
                          0%
                        </span>
                        <span className="text-xs text-cyan-500 font-bold font-mono">
                          10% IDEAL
                        </span>
                        <span className="text-xs text-slate-600 font-mono">
                          20%+
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-tight border-t border-slate-800/50 pt-1">
                        日次代謝率:
                        10%が理想状態。中央より右なら過剰、左なら停滞を意味します。
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* SECTION B: METABOLISM */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 relative">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
              代謝・循環 (Metabolism)
            </h2>

            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">
                  24時間流通量
                  <span className="text-xs text-slate-600 ml-2">
                    24時間の総循環量
                  </span>
                </div>
                <div className="text-3xl font-mono text-slate-200">
                  {metabolism.volume24h.toLocaleString()}{" "}
                  <span className="text-sm font-sans">Lm</span>
                </div>
              </div>
              <div className={`text-right ${getMetaColor(metabolism.status)}`}>
                <div className="text-3xl font-bold">{metabolism.rate}%</div>
                <div className="text-xs uppercase tracking-wider">
                  {metabolism.status}
                </div>
                <div className="text-xs opacity-70">循環効率</div>
              </div>
            </div>

            {/* Visual Meter */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${metabolism.status === "Stagnant" ? "bg-red-500" : metabolism.status === "Active" ? "bg-green-500" : "bg-yellow-500"}`}
                style={{
                  width: `${Math.min(100, metabolism.rate * 10)}%`,
                }} // Scale approx for visual
              />
            </div>

            {/* Metabolic Composition (Tri-State) */}
            {(() => {
                const m = metabolism;
                const total = m.totalSupply;
                
                // 1. Circulation (Flow)
                const circulation = m.volume24h;
                
                // 2. Gravity (Decay Loss) - approximated naturally lost
                const decay = m.decay24h;

                const flowRatio = Math.min(100, (circulation / total) * 100);
                const decayRatio = Math.min(100, (decay / total) * 100);
                const overflowLoss = m.overflowLoss || 0;
                const overflowRatio = Math.min(100, (overflowLoss / total) * 100);
                
                const totalEntropyLoss = decay + overflowLoss;
                const entropyRatio = decayRatio + overflowRatio;

                const staticRatio = Math.max(0, 100 - flowRatio);

                return (
                    <div className="mt-6 border-t border-slate-800/50 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 font-mono">Metabolic Composition</span>
                            <span className="text-xs text-slate-600">対総資産比率</span>
                        </div>
                        
                        {/* 1. Main Bar: Flow vs Static */}
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex relative">
                            {/* Flow */}
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                style={{ width: `${flowRatio}%` }}
                            />
                            {/* Static */}
                            <div 
                                className="h-full bg-slate-700"
                                style={{ width: `${staticRatio}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-xs mt-2 font-mono">
                            <div className="text-green-400">
                                <span>⚡ CIRCULATION</span>
                                <span className="ml-2 opacity-70">{flowRatio.toFixed(1)}%</span>
                            </div>
                            <div className="text-slate-500">
                                <span>❄️ STAGNATION</span>
                                <span className="ml-2 opacity-70">{staticRatio.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Entropy Loss Indicator (Decay + Overflow) */}
                        <div className="mt-4 flex flex-col gap-1">
                             <div className="flex justify-between text-xs items-center">
                                 <span className="text-red-400 font-mono">🔥 ENTROPY LOSS (24h)</span>
                                 <span className="text-red-300 font-mono">-{totalEntropyLoss.toLocaleString()} Lm <span className="opacity-50">({entropyRatio.toFixed(1)}%)</span></span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                 {/* Decay (Natural) */}
                                 <div className="h-full bg-red-900/50" style={{ width: `${(decay / (totalEntropyLoss || 1)) * 100}%` }} />
                                 {/* Overflow (Waste) */}
                                 <div className="h-full bg-red-500" style={{ width: `${(overflowLoss / (totalEntropyLoss || 1)) * 100}%` }} />
                             </div>
                             <div className="flex justify-between text-xs text-slate-600 px-0.5">
                                 <span>Gravity: {decay.toLocaleString()}</span>
                                 <span>Overflow: {overflowLoss.toLocaleString()}</span>
                             </div>
                        </div>
                        
                         <p className="text-xs text-slate-500 mt-2 leading-tight">
                            ※ 赤色の損失（Overflow含む）が緑色の循環を上回る場合、経済圏は縮小（死滅）に向かいます。<br/>
                            現在のバランス: {flowRatio > entropyRatio ? <span className="text-green-400 font-bold">EXPANDING (成長)</span> : <span className="text-red-400 font-bold">CONTRACTING (縮小)</span>}
                        </p>
                    </div>
                );
            })()}
          </div>

          {/* SECTION C: MOON DISTRIBUTION */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 md:col-span-2 lg:col-span-1">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-6">
              資産分布 (ASSET DISTRIBUTION)
            </h2>

            <div className="space-y-4">
              {/* Full */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-yellow-200">
                    🌕 潤沢 (Rich) (&gt;1500){" "}
                    <span className="text-xs text-slate-500 ml-1">
                      saturation (Full)
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {distribution.full}{" "}
                    <span className="text-xs opacity-70">
                      ({(distRatio.full * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                    style={{ width: `${distRatio.full * 100}%` }}
                  />
                </div>
              </div>
              {/* Quarter */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    🌓 安定 (Stable){" "}
                    <span className="text-xs text-slate-500 ml-1">
                      安定した魂
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {distribution.quarter}{" "}
                    <span className="text-xs opacity-70">
                      ({(distRatio.quarter * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.3)]"
                    style={{ width: `${distRatio.quarter * 100}%` }}
                  />
                </div>
              </div>
              {/* New */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">
                    🌑 枯渇 (Scarce) (&lt;500){" "}
                    <span className="text-xs text-slate-500 ml-1">
                      新生した魂
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {distribution.new}{" "}
                    <span className="text-xs opacity-70">
                      ({(distRatio.new * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.3)]"
                    style={{ width: `${distRatio.new * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Alert Logic */}
            {cycle.season === "Winter" &&
              distribution.full > totalPop * 0.3 && (
                <div className="mt-6 p-3 border border-red-500/30 bg-red-900/10 rounded flex items-center gap-3 text-red-400 text-xs">
                  <AlertTriangle size={16} />
                  <span>WARNING: High Hoarding detected during Winter.</span>
                </div>
              )}
          </div>

          {/* SECTION D: TIME CONTROL (Previously Sun Control) */}
          <div id="time-control-section" className="p-6 rounded-2xl border border-yellow-900/30 bg-yellow-900/5 md:col-span-2 lg:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500">
              <Sun size={80} />
            </div>
            <h2 className="text-xs font-mono text-yellow-600 uppercase tracking-widest mb-4">
              時空調整 (TIME CONTROL)
            </h2>

            <div className="mb-8 text-center">
              <div className="text-xs text-yellow-600/70 mb-2">
                再生サイクル期間 (Cycle Duration)
                <div className="text-xs">次回リセットまでの日数</div>
              </div>
              <div className="text-5xl font-bold text-yellow-500 font-mono tracking-tighter">
                {cycleDays}{" "}
                <span className="text-lg">Days</span>
              </div>
              <div className="mt-2 text-sm font-bold">
                 {cycleDays < 10 && <span className="text-green-500">Spring (豊穣 - 循環加速)</span>}
                 {cycleDays === 10 && <span className="text-yellow-500">Equinox (調和 - 標準)</span>}
                 {cycleDays > 10 && <span className="text-slate-400">Winter (試練 - 選別)</span>}
              </div>
            </div>

            <div className="relative mb-6">
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={cycleDays}
                  onChange={(e) => setCycleDays(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
                    <span>5 Days (Fast)</span>
                    <span>10 Days (Std)</span>
                    <span>20 Days (Slow)</span>
                </div>
            </div>

            <button
              onClick={async () => {
                if (
                  window.confirm(
                    `PUBLISH NEW LAW: Cycle Duration = ${cycleDays} Days.\n\nChanges will apply to users upon their NEXT rebirth calculation.\n\nShorter cycle = More frequent 2400 Lm grants.\nLonger cycle = Scarcity.\n\nAre you sure?`,
                  )
                ) {
                  try {
                    // Use top-level db import
                    const { doc, setDoc, serverTimestamp } =
                      await import("firebase/firestore");

                    if (!db) throw new Error("Database not initialized");

                    // Update Global Config (cycleDays)
                    const settingsRef = doc(db, "system_settings", "global");
                    await setDoc(
                      settingsRef,
                      {
                        cycleDays: cycleDays,
                        updated_at: serverTimestamp(),
                      },
                      { merge: true },
                    );

                    alert(
                      `法改正完了: サイクルを ${cycleDays} 日に変更しました。\n世界のリズムが変わります。`,
                    );
                    // No need to update local stats derived state immediately, handled by next reload or logic
                  } catch (e: unknown) {
                    console.error(e);
                    alert(`法令の発布に失敗しました: ${e}`);
                  }
                }
              }}
              className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-yellow-500/50 text-yellow-500 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              法を公布・改定する (Publish Law)
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              生命贈与額 (Fixed): <span className="text-slate-300">2,400 Lm</span> (不変の理)
            </p>
          </div>





        </>
      )}
      </div>
    </div>


      {/* === PROTOCOL WHITEPAPER OVERLAY === */}
      {showManual && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-800">
          <div className="max-w-3xl mx-auto pb-20 mt-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-6">
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-[0.2em] text-xs font-sans">
                  <Activity size={14} />
                  <span>Existence Ticker Protocol v2.0</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-slate-900 leading-tight">
                  自律分散型互助生態系構想書
                  <span className="block text-lg font-sans font-normal text-slate-500 mt-2">Autonomous Mutual Aid Ecosystem Protocol</span>
                </h1>
              </div>
              <button
                onClick={() => setShowManual(false)}
                className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-16 font-serif leading-relaxed text-lg text-slate-700">
              
              {/* Introduction */}
              <section className="prose prose-slate max-w-none">
                <p className="text-xl italic text-slate-500 border-l-4 border-slate-200 pl-6 py-2">
                  本ドキュメントは、本システムの投資家および設計協力者に向けたアーキテクチャ解説書です。<br/>
                  我々は「富の保存」ではなく「感謝の循環」を価値の源泉とする、新たな経済物理学を実装しました。
                </p>
              </section>

              {/* Chapter 1 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">01</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">理念 (Philosophy)</h2>
                </div>
                <h3 className="text-xl font-bold mb-4">"Stock" から "Flow" へ</h3>
                <p className="mb-6">
                  現代社会の閉塞感は「感謝の滞留」にあります。エネルギー（貨幣）が循環の媒体としての機能を失い、個人の所有物（Stock）としてダムのように堰き止められた時、生態系は枯れ果てます。<br/>
                  我々はこの問題を解決するために、通貨を<strong className="text-slate-900 font-bold bg-yellow-100 px-1">「保存する資産（Stock）」から「感謝を伝えるエネルギー（Flow）」へと再定義</strong>しました。
                </p>
                <p>
                  この世界では、溜め込むことは重力による<strong className="text-slate-900 font-bold">「深化（Deepening）」</strong>を意味し、他者へ循環させることこそが生存戦略となります。<br/>
                  住人は「富を得るため」ではなく、「誰かを助け、誰かに助けられるため」にこのエネルギーを使用します。
                </p>
              </section>

              {/* Chapter 2 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">02</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">構造 (Mechanism)</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded border border-slate-100">
                    <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                      <span className="text-blue-500">▼</span> 深化 (Deepening)
                    </h3>
                    <p className="text-base text-slate-600">
                      自然界の法則と同様に、全てのエネルギーは時間とともに器の底へと「深化」します。
                      この物理現象により、既得権益の固定化（格差の固定）を自然法則として阻止し、常に新たな代謝を促します。
                      これは「損失」ではなく、エネルギーがより純粋な形へと相転移する過程です。
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded border border-slate-100">
                    <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                      <span className="text-yellow-500">▲</span> 太陽 (The Sun)
                    </h3>
                    <p className="text-base text-slate-600">
                      「深化」によって底へと還ったエネルギーは、システム全体への「生命贈与（Basic Supply）」として蒸散・還元されます。
                      これは行政による「給付」でも、再分配でもありません。
                      あなたがここに<strong className="text-slate-900">「存在している」という事実そのものを担保にして</strong>、天から降り注ぐ光のギフトです。
                    </p>
                  </div>
                </div>
              </section>

              {/* Chapter 3 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">03</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">統治 (Governance)</h2>
                </div>
                <h3 className="text-xl font-bold mb-4">支配ではなく、調律</h3>
                <p className="mb-6">
                  管理者の役割は、住人の個別のやり取りを監視することではありません。<br/>
                  世界の「温度（代謝率）」と「湿度（エネルギー分布）」を観測し、<strong className="text-slate-900 font-bold">「再生サイクル期間（Regeneration Cycle Duration）」というたった一つの物理定数（時間軸）を調整すること</strong>だけが許された権限です。
                </p>
                
                <div className="bg-slate-900 text-white p-8 rounded-sm shadow-xl mt-8">
                   <h4 className="font-sans text-xs uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">管理者の誓い (Admin Protocol)</h4>
                   <p className="font-mono text-sm leading-relaxed text-slate-300">
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
                  <span className="text-6xl font-thin text-slate-200">04</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">運用規約 (Operational Protocols)</h2>
                </div>
                
                <h3 className="text-xl font-bold mb-6 font-sans">4.1 構造的制約 (Structural Constraints)</h3>
                  <div className="bg-slate-50 p-6 rounded border border-slate-100 mb-8">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="text-blue-600">ℹ</span> エネルギー還流 (Energy Reflux)
                    </h4>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                      本システムでは「あるがままの計算（Simple Physics）」を採用しています。
                      個々の「願い（Committed Lm）」も時間とともに「深化」し、その価値を減じていきます。
                      この際、持ち主の Available Lm が微増する現象が発生しますが、これは<strong className="text-slate-900">「深化によって願いがより純粋な形になり、余剰エネルギーが器に還流した」</strong>ものとして定義されます。
                      この自然な還流を、我々は生態系の健全な呼吸として仕様認定しています。
                    </p>

                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                      <span className="text-slate-900">V</span> 物理定数 (Physical Baseline)
                    </h4>
                    <p className="font-mono text-slate-600 text-sm mb-0 leading-relaxed">
                      一人の人間が保持できるエネルギーの限界点は <strong className="text-slate-900">2400 Lm</strong> です。
                      この器（Vessel）を超えたエネルギーは「溢出（Overflow）」となり、巡り巡って「太陽」の燃料として再利用されるエコシステム・ループを形成します。
                    </p>


                   <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                       <span className="text-yellow-600">⚠</span> 法の不遡及 (Law of Non-Retroactivity)
                   </h4>
                   <p className="text-slate-600 text-sm mb-0 leading-relaxed">
                       「再生サイクルの期間」の変更は、即座に全ユーザーに適用されるわけではありません。<br/>
                       各ユーザーは個別に決定された「リセット日」を持っており、新しい時間設定は<strong className="text-slate-900">個々の次回リセット計算時</strong>に初めて適用されます。<br/>
                       したがって、調律（Tuning）の効果が生態系全体に行き渡るまでには、現行サイクルの解消待ち（Latency）が発生します。
                   </p>
                </div>

                <h3 className="text-xl font-bold mb-6 font-sans">4.2 生体バイタル (Vital Signs)</h3>
                
                <div className="space-y-6">
                    {/* KPI 1 */}
                    <div>
                        <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                            A. 経済代謝率 (Metabolic Rate)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                             <div className="bg-slate-50 p-3 rounded">
                                 <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Calculation</div>
                                 <div className="font-mono text-slate-700">Daily Volume ÷ Total Supply × 100 (%)</div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded">
                                 <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Target Zone</div>
                                 <div className="font-mono text-green-600 font-bold">&gt; 10.0% (Ideal)</div>
                             </div>
                        </div>
                        <p className="text-slate-600 text-sm">
                            総滞留量（GDP）の多寡は重要ではありません。「血液の流速」こそが生命の証です。<br/>
                            5%を下回る状態は「心停止」と同義であり、緊急の介入（Divine Intervention）を要します。
                        </p>
                    </div>

                    {/* KPI 2 */}
                    <div>
                        <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                            B. 資産分布深度 (Distribution Depth)
                        </h4>
                         <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                             <li>
                                 <strong className="text-slate-800">Saturated (&gt;1500 Lm):</strong> 
                                 この層が30%を超えると「飽和（Saturation）」です。エネルギー価値が希釈され、誰も働かなくなります。
                             </li>
                             <li>
                                 <strong className="text-slate-800">Thirsty (&lt;500 Lm):</strong>
                                 この層が50%を超えると「飢餓（Starvation）」です。生存不安により、他者への貢献（循環）が停止します。
                             </li>
                         </ul>
                    </div>
                </div>

                <h3 className="text-xl font-bold mt-10 mb-6 font-sans">4.3 サイクルと季節性 (Cycle & Seasonality)</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                             C. 世界の季節 (Global Seasons)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-sm mb-2">
                            <div className="bg-green-50 p-2 rounded border border-green-100">
                                <span className="block font-bold text-green-700">春 (5-9 Days)</span>
                                <span className="text-xs text-slate-500">豊穣・加速</span>
                            </div>
                            <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                                <span className="block font-bold text-yellow-700">分点 (10 Days)</span>
                                <span className="text-xs text-slate-500">調和・標準</span>
                            </div>
                            <div className="bg-slate-100 p-2 rounded border border-slate-200">
                                <span className="block font-bold text-slate-700">冬 (11-20 Days)</span>
                                <span className="text-xs text-slate-500">試練・選別</span>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm">
                            調律者は「1サイクルの長さ」を伸縮させることで季節を操ります。<br/>
                            <strong>春（豊穣期）</strong>では頻繁に給付が行われ、世界は潤いますが、インフレ（飽和）のリスクがあります。<br/>
                            <strong>冬（厳冬期）</strong>では次の給付までの期間が長く、備蓄が枯渇しやすくなります。これにより生存本能が刺激され、停滞した富の強制循環（贈与）が促されます。
                        </p>
                    </div>

                    <div>
                         <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                             D. 日次代謝率 (Daily Turnover)
                        </h4>
                         <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                             <li><strong className="text-slate-800">Ideal: 10%</strong> (10日間で1巡するため、毎日10%が入れ替わるのが平衡状態)</li>
                             <li>この値が大きく偏ると、将来的に特定の日だけ「リセット祭り」が発生するボラティリティのリスクとなります。</li>
                         </ul>
                    </div>
                </div>


                <h3 className="text-xl font-bold mt-10 mb-6 font-sans">4.4 介入の書 (Intervention Matrix)</h3>
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-100 text-slate-900 font-sans uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">状況 (Phase)</th>
                                <th className="px-6 py-3">根本原因 (Root Cause)</th>
                                <th className="px-6 py-3">処方箋 (Actions)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="bg-green-50/50">
                                <td className="px-6 py-4 font-bold text-green-800">HEALTHY<br/><span className="text-xs font-normal text-green-600">Rate &gt; 10% + Balanced</span></td>
                                <td className="px-6 py-4">理想的な循環状態</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-green-600">ACTION: 維持 (Maintain)</span>
                                    介入不要。この均衡を見守ることが神の仕事です。
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-6 py-4 font-bold text-slate-900">STARVATION<br/><span className="text-xs font-normal text-slate-500">Low Rate + Low Balance</span></td>
                                <td className="px-6 py-4">流動性枯渇による信頼崩壊</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-blue-600">ACTION: 春化 (Spring Shift)</span>
                                    サイクルを短縮 (例えば5日へ) し、給付頻度を倍増させる。<br/>恐怖を取り除くことが最優先。
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-6 py-4 font-bold text-slate-900">SATURATION<br/><span className="text-xs font-normal text-slate-500">Low Rate + High Balance</span></td>
                                <td className="px-6 py-4">欲求(Wish)不足による停滞</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-purple-600">ACTION: 冬化 (Winter Shift)</span>
                                    サイクルを延長 (例えば20日へ)。<br/>「使わなければ尽きる」環境を作る。
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-6 py-4 font-bold text-slate-900">STAGNATION<br/><span className="text-xs font-normal text-slate-500">Rate &lt; 5% (Critical)</span></td>
                                <td className="px-6 py-4">文化の欠如 / 初期段階</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-red-600">ACTION: 緊急介入 (Emergency Intervention)</span>
                                    Admin自身による直接取引。<br/>管理者が動いて手本を示す。
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
              </section>

              {/* Footer */}
              <div className="pt-20 text-center">
                 <div className="w-16 h-px bg-slate-300 mx-auto mb-6"></div>
                 <p className="text-slate-400 font-sans text-xs uppercase tracking-widest">
                   Proprietary & Confidential<br/>
                   Designed for The Mutual Aid Economic Zone
                 </p>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* === DIAGNOSTIC MODAL OVERLAY === */}
      <DiagnosticModal
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        diagnosis={diagnostics}
        stats={stats}
        onScrollToSupply={() => {
           const el = document.getElementById('time-control-section');
           const container = document.getElementById('admin-scroll-container');
           if (el && container) {
              const rect = el.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const scrollTop = container.scrollTop;
              // offset 80px for the sticky header
              const targetPosition = rect.top - containerRect.top + scrollTop - 80;
              
              container.scrollTo({
                  top: targetPosition,
                  behavior: 'smooth'
              });
           }
        }}
      />

    </div>
  );
};
