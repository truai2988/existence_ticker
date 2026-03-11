import React from "react";
import { Search, Shield, Activity } from "lucide-react";
import { UserProfile } from "../../types";

interface AdminCitizensProps {
  userList: UserProfile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleAdmin: (user: UserProfile) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const AdminCitizens = React.memo<AdminCitizensProps>(({
  userList,
  searchQuery,
  setSearchQuery,
  onToggleAdmin,
  onLoadMore,
  hasMore,
  isLoading
}) => {
  const filteredUsers = userList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.includes(searchQuery),
  );

  return (
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
              placeholder="名前またはIDで検索..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono">
              {filteredUsers.length} 名を表示中
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800 bg-slate-900/80 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-bold">住民 (名前/ID)</th>
                <th className="px-4 py-3 font-bold">状態 (Role)</th>
                <th className="px-4 py-3 font-bold">Lm残高</th>
                <th className="px-4 py-3 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 text-sm font-bold truncate max-w-[120px]">
                        {u.name || "未設定"}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {u.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-[9px] font-bold ring-1 ring-yellow-500/20 whitespace-nowrap">
                        管理者
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-bold ring-1 ring-slate-700 whitespace-nowrap">
                        一般ユーザー
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 font-mono text-xs">
                      {Math.floor(u.balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleAdmin(u)}
                      className="p-2 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                      title="権限切り替え"
                    >
                      <Shield size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="p-4 flex justify-center border-t border-slate-800">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoading}
                className="text-xs font-bold text-slate-500 hover:text-yellow-500 py-2 px-6 rounded-lg transition-colors disabled:opacity-30"
              >
                {isLoading ? "読み込み中..." : "さらに読み込む"}
              </button>
            </div>
          )}

          {filteredUsers.length === 0 && !isLoading && (
            <div className="p-20 text-center text-slate-600 flex flex-col items-center gap-2">
              <Activity size={24} className="opacity-20" />
              <p className="text-sm">該当する住民が見つかりませんでした</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
