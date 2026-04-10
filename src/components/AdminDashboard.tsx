import React, { useState, useCallback } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import {
  X,
  Activity,
  Users,
  Book,
} from "lucide-react";
import { ProtocolManual } from "./ProtocolManual";
import { useStats } from "../hooks/useStats";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { getMillis } from "../logic/worldPhysics";
import { useLanguage } from "../contexts/LanguageContext";

import { AdminMonitor } from "./admin/AdminMonitor";
import { AdminCitizens } from "./admin/AdminCitizens";

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error } = useStats();
  const [showManual, setShowManual] = useState(false);
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"monitor" | "citizens">("monitor");
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);

  const fetchUsers = useCallback(async (isLoadMore = false) => {
    setIsLoadingUsers(true);
    try {
      if (!db) return;
      const { collection, getDocs, query, limit, orderBy, startAfter } =
        await import("firebase/firestore");

      const usersRef = collection(db, "users");
      let q = query(usersRef, orderBy("last_updated", "desc"), limit(50));

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

  // 住民タブに切り替えた際、まだ未取得なら自動フェッチ
  React.useEffect(() => {
    if (searchQuery.trim().length >= 1 && userList.length === 0 && activeTab === 'citizens') {
      fetchUsers();
    }
  }, [searchQuery, userList.length, activeTab, fetchUsers]);

  const toggleAdmin = useCallback(async (u: UserProfile) => {
    if (u.role === "admin") {
      const otherAdmins = userList.filter(
        (user) => user.id !== u.id && user.role === "admin"
      ).length;
      if (otherAdmins === 0) {
        alert(t.ADMIN.ALERT.NEED_AT_LEAST_ONE_ADMIN);
        return;
      }
    }
    if (!window.confirm(t.ADMIN.ALERT.CONFIRM_ROLE_CHANGE.replace('%s', u.name || t.ADMIN.TABLE.USER))) return;
    try {
      if (!db) return;
      const { doc, updateDoc } = await import("firebase/firestore");
      const newRole = u.role === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", u.id), { role: newRole });
      const roleNameMap: Record<string, string> = { admin: t.ADMIN.ROLES.ADMIN, user: t.ADMIN.ROLES.USER };
      alert(t.ADMIN.ALERT.ROLE_CHANGED.replace('%s', roleNameMap[newRole] || newRole));
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert(t.ADMIN.ALERT.CHANGE_FAILED);
    }
  }, [userList, fetchUsers, t]);

  // ダッシュボード表示中はbodyスクロールを無効化
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
            {t.ADMIN.LOADING}
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
      {showManual && <ProtocolManual onClose={() => setShowManual(false)} />}

      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-slate-800/50 w-full">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-slate-800 rounded-lg shrink-0">
              <Activity className="w-5 h-5 text-slate-200" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2
                className="text-xl font-serif font-medium text-slate-200 truncate leading-tight"
                style={{ fontFamily: "'Noto Serif JP', serif" }}
              >
                {t.ADMIN.TITLE}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-700 hover:text-white"
              title={t.PROTOCOL.HEADER_TITLE}
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

        {/* タブナビゲーション */}
        <div className="flex gap-4 mb-6 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("monitor")}
            className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "monitor"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-slate-700 hover:text-slate-700"
            }`}
          >
            <Activity size={16} />
            {t.ADMIN.TAB_MONITOR}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("citizens")}
            className={`pb-3 px-1 text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "citizens"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-slate-700 hover:text-slate-700"
            }`}
          >
            <Users size={16} /> {t.ADMIN.TAB_USERS}
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex flex-col gap-6">
          {activeTab === "monitor" && stats && (
            <AdminMonitor stats={stats} />
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
        </div>
      </div>
    </div>
  );
};
