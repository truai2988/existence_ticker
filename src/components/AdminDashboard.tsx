import React, { useState, useCallback } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  X,
  Shield,
  Search,
  Book,
  Activity,
  Users,
  Moon,
  AlertTriangle,
  Sun,
  Key,
  Plus,
  Copy,
  Check,
  Sprout,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { ProtocolManual } from "./ProtocolManual";
import { useStats, MetabolismStatus } from "../hooks/useStats";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticModal } from "./DiagnosticModal";
import { db } from "../lib/firebase";
import { UserProfile, SeedPlaceholder } from "../types";
import {
  getMillis,
  calculateDecayedValue,
  toMilli,
  fromMilli,
  WORLD_CONSTANTS
} from "../logic/worldPhysics";

interface AdminDashboardProps {
  onClose: () => void;
}

interface InviteCode {
  id: string;
  is_used: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  created_at?: any;
  created_by?: string;
  used_by?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  used_at?: any;
  memo?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error } = useStats(); // updateCapacity removed
  const diagnostics = useDiagnostics(stats);
  const [cycleDays, setCycleDays] = useState(10);
  const [showManual, setShowManual] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  // User Management State
  const [activeTab, setActiveTab] = useState<
    "monitor" | "citizens" | "invitations" | "seeds"
  >("monitor");
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [superAdminIds, setSuperAdminIds] = useState<string[]>([]);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Seed Library State
  const [seeds, setSeeds] = useState<SeedPlaceholder[]>([]);
  const [isAddingSeed, setIsAddingSeed] = useState(false);
  const [newSeedTier, setNewSeedTier] = useState<1000 | 500 | 0>(1000);
  const [newSeedContent, setNewSeedContent] = useState("");
  const [isLoadingSeeds, setIsLoadingSeeds] = useState(false);

  const INITIAL_SEEDS = [
    { tier: 1000, content: "止まったままのチェロに、もう一度光を当ててほしいのです。・・・" },
    { tier: 1000, content: "私のとりとめのない人生の断片を、一通の手紙に編み直してくれませんか。・・・" },
    { tier: 1000, content: "実家の古い書庫にある、傷んだ古文書を一緒に紐解いてほしい。・・・" },
    { tier: 500, content: "高いところの電球を、ひとつだけ替えてくれませんか。・・・" },
    { tier: 500, content: "雨の午後、静かに隣で本を読んでいてほしいのです。・・・" },
    { tier: 500, content: "スマホの奥に眠っている、数年前の家族写真を一緒に探してほしい。・・・" },
    { tier: 0, content: "作りすぎた肉じゃがを、お裾分けさせてください。・・・" },
    { tier: 0, content: "今夜、あなたが住む場所から見える一番綺麗な月を教えて。・・・" },
    { tier: 0, content: "あなたが人生の最期に見たい景色は、どこですか？・・・" },
    { tier: 0, content: "深夜2時、宇宙の広さについて語り合いませんか。・・・" },
  ];

  const seedLibrary = async () => {
    if (!window.confirm("初期の種を一括で蒔きますか？")) return;
    setIsLoadingSeeds(true);
    try {
      if (!db) return;
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      for (const seed of INITIAL_SEEDS) {
        await addDoc(collection(db, "seed_placeholders"), {
          ...seed,
          createdAt: serverTimestamp()
        });
      }
      alert("初期の種をすべて蒔きました。");
      fetchSeeds();
    } catch (e) {
      console.error(e);
      alert("不具合が発生しました。");
    } finally {
      setIsLoadingSeeds(false);
    }
  };

  // Safety: Ensure activeTab is always valid (prevents empty screen after tab removal)
  React.useEffect(() => {
    const validTabs = ["monitor", "citizens", "invitations", "seeds"];
    if (!validTabs.includes(activeTab)) {
      setActiveTab("monitor");
    }
  }, [activeTab]);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!db) return;
        const { doc, getDoc } = await import("firebase/firestore");

        const settingsRef = doc(db, "system_settings", "global");
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.cycleDays) setCycleDays(data.cycleDays);
          if (data.super_admin_ids) setSuperAdminIds(data.super_admin_ids);
        }
      } catch (e) {
        console.error("Failed to fetch cycle config", e);
      }
    };
    fetchConfig();
  }, []);

  const fetchUsers = useCallback(async (isLoadMore = false) => {
    setIsLoadingUsers(true);
    try {
      if (!db) return;
      const { collection, getDocs, query, limit, orderBy, startAfter } =
        await import("firebase/firestore");

      const usersRef = collection(db, "users");
      
      let q = query(
        usersRef, 
        orderBy("last_updated", "desc"), 
        limit(50)
      );

      if (isLoadMore && lastVisibleDoc) {
        q = query(
          usersRef,
          orderBy("last_updated", "desc"),
          startAfter(lastVisibleDoc),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisibleDoc(newLastDoc);
      
      if (snapshot.docs.length < 50) {
        setHasMoreUsers(false);
      } else {
        setHasMoreUsers(true);
      }

      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          last_updated: getMillis(data.last_updated),
          cycle_started_at: getMillis(data.cycle_started_at),
          created_at: getMillis(data.created_at),
        } as UserProfile;
      });

      if (isLoadMore) {
        setUserList(prev => [...prev, ...users]);
      } else {
        setUserList(users);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [lastVisibleDoc]);

  const fetchInviteCodes = useCallback(async () => {
    try {
      if (!db) return;
      const { collection, getDocs } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "invitation_codes"));
      setInviteCodes(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InviteCode),
      );
    } catch (e) {
      console.error("Failed to fetch invite codes", e);
    }
  }, []);

  const generateInviteCode = async () => {
    try {
      if (!db) return;
      const { doc, setDoc, serverTimestamp } =
        await import("firebase/firestore");
      const { auth } = await import("../lib/firebase");

      const randomStr = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const code = `ALPHA-${randomStr}`;
      const codeRef = doc(db, "invitation_codes", code);

      await setDoc(codeRef, {
        is_used: false,
        created_at: serverTimestamp(),
        created_by: auth?.currentUser?.uid,
      });

      fetchInviteCodes();
      alert(`招待コードを生成しました: ${code}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to generate code: ${msg}`);
    }
  };


  const toggleAdmin = async (u: UserProfile) => {
    // If the user is being demoted from admin
    if (u.role === "admin") {
      // Check if this specific user will still be a Super Admin after losing the Admin role
      const willStillBeSuper = superAdminIds.includes(u.id);
      
      // Count OTHER administrators
      const otherAdmins = userList.filter((user) => 
        user.id !== u.id && (user.role === "admin" || superAdminIds.includes(user.id))
      ).length;
      
      // If neither this user nor anyone else will have access
      if (!willStillBeSuper && otherAdmins === 0) {
        alert("システムには管理画面にアクセスできるユーザーが最低1人は必要です。");
        return;
      }
    }

    if (!window.confirm(`⚠️ ${u.name || u.id} の権限を変更しますか？`)) return;
    try {
      if (!db) return;
      const { doc, updateDoc } = await import("firebase/firestore");
      const newRole = u.role === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", u.id), {
        role: newRole,
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
    
    if (isCurrentlySuper) {
      // Check if this specific user will still be a regular Admin after losing Super Admin
      const willStillBeAdmin = u.role === "admin";
      
      // Count OTHER administrators
      const otherAdmins = userList.filter((user) => 
        user.id !== u.id && (user.role === "admin" || superAdminIds.includes(user.id))
      ).length;
      
      // If neither this user nor anyone else will have access
      if (!willStillBeAdmin && otherAdmins === 0) {
        alert("システムには管理画面にアクセスできるユーザーが最低1人は必要です。");
        return;
      }
    }

    if (
      !window.confirm(
        `⚠️ ${u.name || u.id} の【特別権限（Super Admin）】を${isCurrentlySuper ? "剥奪" : "付与"}しますか？`,
      )
    )
      return;

    try {
      if (!db) return;
      const { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } = await import("firebase/firestore");
      
      // 1. Update Global Settings (UI / List)
      const newSuperIds = isCurrentlySuper
        ? superAdminIds.filter((id) => id !== u.id)
        : [...superAdminIds, u.id];

      await updateDoc(doc(db, "system_settings", "global"), {
        super_admin_ids: newSuperIds,
      });

      // 2. Update Security Collection (Firestore Rules)
      const adminDocRef = doc(db, "super_admins", u.id);
      if (isCurrentlySuper) {
          // Remove privilege
          await deleteDoc(adminDocRef);
      } else {
          // Grant privilege
          await setDoc(adminDocRef, {
              uid: u.id,
              email: u.email || "",
              is_super: true,
              granted_at: serverTimestamp()
          });
      }

      setSuperAdminIds(newSuperIds);
      alert(`特別権限を${isCurrentlySuper ? "剥奪" : "付与"}しました。\n(DBと設定の両方を同期しました)`);
    } catch (e) {
      console.error(e);
      alert("変更に失敗しました");
    }
  };

  const handleCopyInvitation = async (codeId: string) => {
    const template = `重機を降りて、存在を祝うインフラへ。
あなたを『Existence Ticker』の共同創設者として招待します。

私たちは豊かさを求めて走り続けてきましたが、
ときにはその轟音を離れて、ただ「ここにいること」を祝福する場所が必要です。

まずは、このインフラの「原典（Story）」を読んでみてください：
https://www.existenceticker.com/story

【扉を開く（招待コード）】
${codeId}

【扉はこちら】
https://www.existenceticker.com/?code=${codeId}

一緒に、新しい呼吸を始めましょう。`;

    try {
      await navigator.clipboard.writeText(template);
      setCopiedCodeId(codeId);
      setTimeout(() => setCopiedCodeId(null), 3000);
    } catch (err) {
      console.error("Failed to copy invitation:", err);
      alert("コピーに失敗しました");
    }
  };

  const updateInviteMemo = async (codeId: string, newMemo: string) => {
    try {
      if (!db) return;
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "invitation_codes", codeId), {
        memo: newMemo
      });
      fetchInviteCodes(); // Refresh to show the updated memo
    } catch (err) {
      console.error("Failed to update memo:", err);
    }
  };

  // Data Fetching Logic: Only trigger when switching TO the tab
  React.useEffect(() => {
    if (activeTab === "citizens" && userList.length === 0) {
      fetchUsers();
    }
    if (activeTab === "invitations") {
      fetchInviteCodes();
    }
    if (activeTab === "seeds") {
      fetchSeeds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchSeeds = useCallback(async () => {
    setIsLoadingSeeds(true);
    try {
      if (!db) return;
      const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const q = query(collection(db, "seed_placeholders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetchedSeeds = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SeedPlaceholder[];
      setSeeds(fetchedSeeds);
    } catch (e) {
      console.error("Failed to fetch seeds", e);
    } finally {
      setIsLoadingSeeds(false);
    }
  }, []);

  const addSeed = async () => {
    if (!newSeedContent.trim()) return;
    setIsAddingSeed(true);
    try {
      if (!db) return;
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "seed_placeholders"), {
        tier: newSeedTier,
        content: newSeedContent.trim(),
        createdAt: serverTimestamp()
      });
      setNewSeedContent("");
      fetchSeeds();
    } catch (e) {
      console.error("Failed to add seed", e);
      alert("種の蒔画に失敗しました");
    } finally {
      setIsAddingSeed(false);
    }
  };

  const deleteSeed = async (id: string) => {
    if (!window.confirm("この種を削除しますか？")) return;
    try {
      if (!db) return;
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "seed_placeholders", id));
      fetchSeeds();
    } catch (e) {
      console.error("Failed to delete seed", e);
      alert("種の削除に失敗しました");
    }
  };

  const filteredUsers = userList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.includes(searchQuery),
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
          <div className="text-white font-mono tracking-widest text-xs">
            Loading Economy...
          </div>
        </div>
        <button
          type="button"
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
    <div
      id="admin-scroll-container"
      className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-md ${showManual ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      {/* Header (Full Width Sticky) */}
      {showManual && <ProtocolManual onClose={() => setShowManual(false)} />}
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
              type="button"
              onClick={() => setShowManual(true)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Protocol Whitepaper"
            >
              <Book size={24} />
            </button>
            <button
              type="button"
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
        <div className="flex gap-4 mb-6 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("monitor")}
            className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "monitor" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-400"}`}
          >
            <Activity size={16} />
            監視
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("citizens")}
            className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "citizens" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-400"}`}
          >
            <Users size={16} /> 住民
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "invitations" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-400"}`}
          >
            <Key size={16} /> 招待
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seeds")}
            className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "seeds" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-400"}`}
          >
            <Sprout size={16} /> 種子の書庫
          </button>
        </div>

        {/* Content Stack */}
        <div className="flex flex-col gap-6">
          {activeTab === "seeds" && (
            <div className="animate-in fade-in duration-300 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <Sprout className="text-emerald-400" />
                      種子の書庫 (Seed Library)
                    </h3>
                    <p className="text-xs text-slate-500 font-serif italic mt-1">
                      この世界に蒔かれる「願いの種」を管理します
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={seedLibrary}
                      className="text-[10px] text-emerald-500/70 border border-emerald-500/30 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors"
                    >
                      初期の種を蒔く
                    </button>
                    <button
                      type="button"
                      onClick={fetchSeeds}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Refresh Seeds"
                    >
                      <RefreshCw size={18} className={isLoadingSeeds ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

              {/* Add Seed Form */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Plus size={14} /> 新しい種を蒔く
                </h4>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    {[1000, 500, 0].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewSeedTier(t as 1000 | 500 | 0)}
                        className={`flex-1 py-3 rounded-xl border text-sm font-bold tracking-tight transition-all active:scale-[0.98] ${
                          newSeedTier === t
                            ? t === 1000 ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
                              t === 500 ? "bg-orange-500/10 border-orange-500 text-orange-500" :
                              "bg-pink-500/10 border-pink-500 text-pink-500"
                            : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500"
                        }`}
                      >
                        {t === 1000 ? "人生の節目" : t === 500 ? "日常の手助け" : "魂の共鳴"}
                        <span className="block text-[10px] opacity-70 font-mono mt-0.5">{t} Lm</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea
                      value={newSeedContent}
                      onChange={(e) => setNewSeedContent(e.target.value)}
                      placeholder="「例えば：...」静かな願いの種を綴ってください"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-all min-h-[100px] font-serif"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSeed}
                    disabled={isAddingSeed || !newSeedContent.trim()}
                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                  >
                    {isAddingSeed ? "種を蒔いています..." : "生命のインフラに種を蒔く"}
                  </button>
                </div>
              </div>

              {/* Seeds List */}
              <div className="space-y-4">
                {[1000, 500, 0].map((t) => {
                  const tierSeeds = seeds.filter((s) => s.tier === t);
                  if (tierSeeds.length === 0) return null;
                  return (
                    <div key={t} className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className={`h-[1px] flex-1 ${t === 1000 ? "bg-amber-500/30" : t === 500 ? "bg-orange-500/30" : "bg-pink-500/30"}`} />
                        <h5 className={`text-[10px] font-bold uppercase tracking-widest ${t === 1000 ? "text-amber-500" : t === 500 ? "text-orange-500" : "text-pink-500"}`}>
                          {t === 1000 ? "人生の節目" : t === 500 ? "日常の手助け" : "魂の共鳴"}
                        </h5>
                        <div className={`h-[1px] flex-1 ${t === 1000 ? "bg-amber-500/30" : t === 500 ? "bg-orange-500/30" : "bg-pink-500/30"}`} />
                      </div>
                      <div className="flex flex-col gap-2">
                        {tierSeeds.map((seed) => (
                          <div
                            key={seed.id}
                            className="group bg-slate-900/30 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex justify-between items-start gap-4 transition-all"
                          >
                            <div className="flex-1">
                              <p className="text-slate-400 font-serif leading-relaxed text-sm">
                                {seed.content}
                              </p>
                              <div className="mt-2 text-[9px] text-slate-600 font-mono uppercase tracking-tighter">
                                PLANTED AT: {
                                  seed.createdAt?.toDate 
                                    ? seed.createdAt.toDate().toLocaleString() 
                                    : seed.createdAt 
                                      ? new Date(seed.createdAt.seconds * 1000).toLocaleString() 
                                      : "Ancient Times"
                                }
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteSeed(seed.id)}
                              className="p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                              title="Delete Seed"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {seeds.length === 0 && !isLoadingSeeds && (
                <div className="p-12 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                  <Sprout size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">まだ「種」がありません。最初の種を蒔いてください。</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "invitations" && (
            <div className="animate-in fade-in duration-300 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-200">
                  招待コード管理 (Invitation System)
                </h3>
                <button
                  type="button"
                  onClick={generateInviteCode}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
                >
                  <Plus size={18} /> コードを生成
                </button>
              </div>

              <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {inviteCodes.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                      <Key size={24} className="opacity-20" />
                      <p>まだ招待コードは発行されていません</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {inviteCodes
                        .slice()
                        .sort((a, b) => {
                          const aTime = a.created_at?.toMillis
                            ? a.created_at.toMillis()
                            : a.created_at || 0;
                          const bTime = b.created_at?.toMillis
                            ? b.created_at.toMillis()
                            : b.created_at || 0;
                          return bTime - aTime;
                        })
                        .map((code) => (
                          <div
                            key={code.id}
                            className="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors font-mono"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-800 rounded border border-slate-700">
                                <Key size={14} className="text-yellow-500/70" />
                              </div>
                              <div>
                                <div className="text-lg font-bold text-slate-100 tracking-wider font-mono">
                                  {code.id}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Generated:{" "}
                                  {code.created_at?.toDate
                                    ? code.created_at.toDate().toLocaleString()
                                    : new Date(
                                        code.created_at,
                                      ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {code.is_used ? (
                                <div className="flex flex-col items-end">
                                  <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold ring-1 ring-slate-700">
                                    使用済み (Used)
                                  </span>
                                  {code.used_by && (
                                    <div
                                      className="text-[10px] text-slate-600 mt-1 select-all"
                                      title={code.used_by}
                                    >
                                      by {code.used_by.substring(0, 8)}...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="メモ (誰に渡したか...)"
                                      defaultValue={code.memo || ""}
                                      onBlur={(e) => {
                                        if (e.target.value !== code.memo) {
                                          updateInviteMemo(code.id, e.target.value);
                                        }
                                      }}
                                      className="bg-slate-800/80 border border-slate-700/50 rounded flex-1 px-3 py-1 text-[11px] text-slate-400 focus:outline-none focus:border-slate-500 placeholder:text-slate-400 transition-colors w-40"
                                    />
                                  </div>
                                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold ring-1 ring-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                                    Active
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyInvitation(code.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 text-[10px] font-bold tracking-widest uppercase active:scale-95 ${
                                      copiedCodeId === code.id
                                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                                    }`}
                                  >
                                    {copiedCodeId === code.id ? (
                                      <>
                                        <Check size={12} />
                                        <span>招待状をコピーしました</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>招待状をコピー</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic px-2">
                ※
                招待コードは「ALPHA-XXXX」の形式で自動生成されます。Firestoreの
                `invitation_codes` コレクションに保存されます。
              </p>
            </div>
          )}

          {activeTab === "citizens" && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-64">
                    <Search
                      className="absolute left-3 top-2.5 text-slate-500"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="ID or Check Name..."
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 placeholder-slate-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-mono">
                      {filteredUsers.length} Users Loaded
                    </span>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="p-8 text-center text-slate-500">
                      Scanning bio-signals...
                    </div>
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
                        {filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-4 md:px-6 md:py-4 hover:bg-slate-800/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-4 items-start md:items-center"
                          >
                            {/* User Info Col (Mobile: Row 1) */}
                            <div className="col-span-5 flex items-center gap-3 w-full mb-3 md:mb-0">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-400">
                                {u.name?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-200 truncate">
                                  {u.name || "Unknown"}
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-mono text-xs text-slate-600 truncate">
                                    {u.id}
                                  </div>
                                  {u.email && (
                                    <div className="font-mono text-xs text-blue-400/70 truncate">
                                      {u.email}
                                    </div>
                                  )}
                                  {!u.email && (
                                    <div className="text-xs text-red-500/70 italic">
                                      Email Missing
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Col (Mobile: Row 2) */}
                            <div className="col-span-3 mb-2 md:mb-0 w-full md:w-auto flex items-center md:block text-xs">
                              <span className="md:hidden text-slate-500 w-16 flex-shrink-0">
                                Status:
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <span>Warmth: {u.warmth?.toLocaleString()}</span>
                                {(() => {
                                  const cycleStart = getMillis(u.cycle_started_at, 0);
                                  if (cycleStart === 0) return null;
                                  const elapsedSec = ((Date.now() - cycleStart) / 1000) | 0;
                                  const decayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), elapsedSec);
                                  const currentBalanceMilli = Math.max(0, decayedVesselMilli - toMilli(u.spent_lm || 0));
                                  return (
                                    <span className="font-mono text-cyan-400">
                                      {Math.floor(fromMilli(currentBalanceMilli)).toLocaleString()} Lm
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Role Col (Mobile: Row 3) */}
                            <div className="col-span-2 mb-4 md:mb-0 w-full md:w-auto flex items-center md:block text-xs">
                              <span className="md:hidden text-slate-500 w-16 flex-shrink-0">
                                Role:
                              </span>
                              <div className="inline-flex flex-col items-start gap-1">
                                {superAdminIds.includes(u.id) && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-black border border-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                                    <Shield size={10} fill="black" />
                                    SUPER ADMIN
                                  </span>
                                )}
                                {u.role === "admin" && !superAdminIds.includes(u.id) && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
                                    <Shield size={10} />
                                    Admin
                                  </span>
                                )}
                                {u.role !== "admin" &&
                                  !superAdminIds.includes(u.id) && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500">
                                      User
                                    </span>
                                  )}
                              </div>
                            </div>

                            {/* Action Col (Mobile: Row 4) */}
                            <div className="col-span-2 w-full md:w-auto flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => toggleSuperAdmin(u)}
                                className={`p-2 rounded-lg transition-colors border ${
                                  superAdminIds.includes(u.id)
                                    ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-500 hover:bg-yellow-400/30"
                                    : "bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500"
                                }`}
                                title={
                                  superAdminIds.includes(u.id)
                                    ? "特別権限を剥奪"
                                    : "特別権限を付与"
                                }
                              >
                                <Shield
                                  size={16}
                                  fill={
                                    superAdminIds.includes(u.id)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAdmin(u)}
                                className={`p-2 rounded-lg transition-colors border ${
                                  u.role === "admin"
                                    ? "bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/30"
                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                                }`}
                                title={
                                  u.role === "admin"
                                    ? "一般ユーザーに降格"
                                    : "管理者に昇格"
                                }
                              >
                                <Shield size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {hasMoreUsers && (
                          <div className="p-8 flex justify-center border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => fetchUsers(true)}
                              disabled={isLoadingUsers}
                              className="px-6 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isLoadingUsers ? (
                                <>
                                  <Activity size={14} className="animate-spin" />
                                  読み込み中...
                                </>
                              ) : (
                                "さらに読み込む"
                              )}
                            </button>
                          </div>
                        )}
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
          )}

          {activeTab === "monitor" && (
            <>
              {/* WORLD HEALTH DIAGNOSIS BANNER */}
              <motion.button
                type="button"
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
                  <div
                    className={`text-right ${getMetaColor(metabolism.status)}`}
                  >
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
                  const overflowRatio = Math.min(
                    100,
                    (overflowLoss / total) * 100,
                  );

                  const totalEntropyLoss = decay + overflowLoss;
                  const entropyRatio = decayRatio + overflowRatio;

                  const staticRatio = Math.max(0, 100 - flowRatio);

                  return (
                    <div className="mt-6 border-t border-slate-800/50 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 font-mono">
                          Metabolic Composition
                        </span>
                        <span className="text-xs text-slate-600">
                          対総資産比率
                        </span>
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
                          <span className="ml-2 opacity-70">
                            {flowRatio.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-slate-500">
                          <span>❄️ STAGNATION</span>
                          <span className="ml-2 opacity-70">
                            {staticRatio.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Entropy Loss Indicator (Decay + Overflow) */}
                      <div className="mt-4 flex flex-col gap-1">
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-red-400 font-mono">
                            🔥 ENTROPY LOSS (24h)
                          </span>
                          <span className="text-red-300 font-mono">
                            -{totalEntropyLoss.toLocaleString()} Lm{" "}
                            <span className="opacity-50">
                              ({entropyRatio.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                          {/* Decay (Natural) */}
                          <div
                            className="h-full bg-red-900/50"
                            style={{
                              width: `${(decay / (totalEntropyLoss || 1)) * 100}%`,
                            }}
                          />
                          {/* Overflow (Waste) */}
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${(overflowLoss / (totalEntropyLoss || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 px-0.5">
                          <span>Gravity: {decay.toLocaleString()}</span>
                          <span>Overflow: {overflowLoss.toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 leading-tight">
                        ※
                        赤色の損失（Overflow含む）が緑色の循環を上回る場合、経済圏は縮小（死滅）に向かいます。
                        <br />
                        現在のバランス:{" "}
                        {flowRatio > entropyRatio ? (
                          <span className="text-green-400 font-bold">
                            EXPANDING (成長)
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold">
                            CONTRACTING (縮小)
                          </span>
                        )}
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
                      <span className="font-mono text-slate-400">
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
                      <span className="text-slate-400">
                        🌓 安定 (Stable){" "}
                        <span className="text-xs text-slate-500 ml-1">
                          安定した魂
                        </span>
                      </span>
                      <span className="font-mono text-slate-400">
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
                      <span className="font-mono text-slate-400">
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
                      <span>
                        WARNING: High Hoarding detected during Winter.
                      </span>
                    </div>
                  )}
              </div>

              {/* SECTION D: TIME CONTROL (Previously Sun Control) */}
              <div
                id="time-control-section"
                className="p-6 rounded-2xl border border-yellow-900/30 bg-yellow-900/5 md:col-span-2 lg:col-span-1 relative overflow-hidden"
              >
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
                    {cycleDays} <span className="text-lg">Days</span>
                  </div>
                  <div className="mt-2 text-sm font-bold">
                    {cycleDays < 10 && (
                      <span className="text-green-500">
                        Spring (豊穣 - 循環加速)
                      </span>
                    )}
                    {cycleDays === 10 && (
                      <span className="text-yellow-500">
                        Equinox (調和 - 標準)
                      </span>
                    )}
                    {cycleDays > 10 && (
                      <span className="text-slate-400">
                        Winter (試練 - 選別)
                      </span>
                    )}
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
                        const settingsRef = doc(
                          db,
                          "system_settings",
                          "global",
                        );
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
                  生命贈与額 (Fixed):{" "}
                  <span className="text-slate-400">2,400 Lm</span> (不変の理)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* === DIAGNOSTIC MODAL OVERLAY === */}
      <DiagnosticModal
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        diagnosis={diagnostics}
        stats={stats}
        onScrollToSupply={() => {
          const el = document.getElementById("time-control-section");
          const container = document.getElementById("admin-scroll-container");
          if (el && container) {
            const rect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop;
            // offset 80px for the sticky header
            const targetPosition =
              rect.top - containerRect.top + scrollTop - 80;

            container.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });
          }
        }}
      />
    </div>
  );
};
