import React, { useState, useCallback } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import {
  X,
  Activity,
  Users,
  Sprout,
  Book,
} from "lucide-react";
import { ProtocolManual } from "./ProtocolManual";
import { useStats } from "../hooks/useStats";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticModal } from "./DiagnosticModal";
import { db } from "../lib/firebase";
import { UserProfile, SeedPlaceholder } from "../types";
import { getMillis } from "../logic/worldPhysics";

import { AdminMonitor } from "./admin/AdminMonitor";
import { AdminCitizens } from "./admin/AdminCitizens";
import { AdminSeeds } from "./admin/AdminSeeds";

interface AdminDashboardProps {
  onClose: () => void;
}


export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error } = useStats();
  const diagnostics = useDiagnostics(stats);
  const [showManual, setShowManual] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  // User Management State
  const [activeTab, setActiveTab] = useState<
    "monitor" | "citizens" | "seeds"
  >("monitor");
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);

  // Seed Library State
  const [seeds, setSeeds] = useState<SeedPlaceholder[]>([]);
  const [isAddingSeed, setIsAddingSeed] = useState(false);
  const [isLoadingSeeds, setIsLoadingSeeds] = useState(false);

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

  const INITIAL_SEEDS = React.useMemo(() => [
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
  ], []);

  const seedLibrary = useCallback(async () => {
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
  }, [fetchSeeds, INITIAL_SEEDS]);

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
          startAfter(lastVisibleDoc as QueryDocumentSnapshot),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisibleDoc(newLastDoc || null);
      
      if (snapshot.docs.length < 50) {
        // End of list
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

  // Handle Search Trigger
  React.useEffect(() => {
    if (searchQuery.trim().length >= 1 && userList.length === 0 && activeTab === 'citizens') {
        fetchUsers();
    }
  }, [searchQuery, userList.length, activeTab, fetchUsers]);


  const toggleAdmin = useCallback(async (u: UserProfile) => {
    if (u.role === "admin") {
      const otherAdmins = userList.filter((user) =>
        user.id !== u.id && user.role === "admin"
      ).length;
      if (otherAdmins === 0) {
        alert("システムには管理画面にアクセスできるユーザーが最低1人は必要です。");
        return;
      }
    }
    if (!window.confirm(`⚠️ ${u.name || "ユーザー"} の権限を変更しますか？`)) return;
    try {
      if (!db) return;
      const { doc, updateDoc } = await import("firebase/firestore");
      const newRole = u.role === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", u.id), { role: newRole });
      const roleNameMap: Record<string, string> = { admin: "管理者", user: "一般ユーザー" };
      alert(`権限を ${roleNameMap[newRole] || newRole} に変更しました。`);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert("変更に失敗しました");
    }
  }, [userList, fetchUsers]);

  const addSeed = useCallback(async (tier: 1000 | 500 | 0, content: string) => {
    setIsAddingSeed(true);
    try {
      if (!db) return;
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "seed_placeholders"), {
        tier,
        content,
        createdAt: serverTimestamp()
      });
      fetchSeeds();
    } catch (e) {
      console.error("Failed to add seed", e);
      alert("種の蒔画に失敗しました");
    } finally {
      setIsAddingSeed(false);
    }
  }, [fetchSeeds]);

  const deleteSeed = useCallback(async (id: string) => {
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
  }, [fetchSeeds]);

  // Data Fetching Logic: Only trigger when switching TO the tab
  React.useEffect(() => {
    if (activeTab === "seeds" && seeds.length === 0) fetchSeeds();
  }, [activeTab, seeds.length, fetchSeeds]);

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
          <div className="text-white font-mono tracking-widest text-sm">
            経済を読み込み中...
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-700 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <div
      id="admin-scroll-container"
      className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-md ${showManual ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      {/* Header (Full Width Sticky) */}
      {showManual && <ProtocolManual onClose={() => setShowManual(false)} />}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-slate-800/50 w-full">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Activity className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-200 tracking-wider">
                管理コンソール
              </h1>
              <p className="text-sm text-slate-700 font-mono uppercase tracking-[0.2em] mt-0.5">
                互助生態系 監視モニター
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-700 hover:text-white"
              title="プロトコル構想書"
            >
              <Book size={24} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-700 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-full p-4 pb-40 max-w-3xl mx-auto relative w-full overflow-x-hidden">
        {error && (
          <div className="mb-4 p-3 border border-red-500/30 bg-red-900/10 rounded text-red-400 text-base">
            ⚠️ {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("monitor")}
            className={`pb-3 px-1 text-base font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "monitor" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-700 hover:text-slate-700"}`}
          >
            <Activity size={16} />
            監視
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("citizens")}
            className={`pb-3 px-1 text-base font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "citizens" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-700 hover:text-slate-700"}`}
          >
            <Users size={16} /> 住民
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seeds")}
            className={`pb-3 px-1 text-base font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === "seeds" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-slate-700 hover:text-slate-700"}`}
          >
            <Sprout size={16} /> 種子の書庫
          </button>
        </div>

        {/* Content Stack */}
        <div className="flex flex-col gap-6">
          {activeTab === "monitor" && stats && (
            <AdminMonitor 
              stats={stats} 
              onOpenDiagnostics={() => setShowDiagnosisModal(true)} 
            />
          )}

          {activeTab === "citizens" && (
            <div className="w-full min-w-0">
              <AdminCitizens 
                userList={userList}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onToggleAdmin={toggleAdmin}
                onLoadMore={() => fetchUsers(true)}
                isLoading={isLoadingUsers}
              />
            </div>
          )}

          {activeTab === "seeds" && (
            <div className="w-full min-w-0">
              <AdminSeeds 
                seeds={seeds}
                onFetchSeeds={fetchSeeds}
                onSeedLibrary={seedLibrary}
                onAddSeed={addSeed}
                onDeleteSeed={deleteSeed}
                isLoading={isLoadingSeeds}
                isAdding={isAddingSeed}
              />
            </div>
          )}
        </div>
      </div>

      {showDiagnosisModal && stats && (
        <DiagnosticModal 
          isOpen={showDiagnosisModal} 
          onClose={() => setShowDiagnosisModal(false)}
          stats={stats}
          diagnosis={diagnostics}
          onScrollToSupply={() => {
            const container = document.getElementById("admin-scroll-container");
            if (container) {
              container.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />
      )}
    </div>
  );
};
