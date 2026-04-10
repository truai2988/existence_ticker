import React from "react";
import { Search, Shield, Activity } from "lucide-react";
import { UserProfile } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";

interface AdminCitizensProps {
  userList: UserProfile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleAdmin: (user: UserProfile) => void;
  onLoadMore: () => void;
  isLoading: boolean;
}

export const AdminCitizens = React.memo<AdminCitizensProps>(({
  userList,
  searchQuery,
  setSearchQuery,
  onToggleAdmin,
  onLoadMore,
  isLoading
}) => {
  const { t } = useLanguage();
  const filteredUsers = searchQuery.trim().length >= 1 
    ? userList.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.id?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="animate-in fade-in duration-300 w-full min-w-0">
      <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden w-full">
        <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-2.5 text-slate-700"
              size={16}
            />
            <input
              type="text"
              placeholder={t.ADMIN.SEARCH_PLACEHOLDER}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onLoadMore(); // Trigger fetch if Enter is pressed
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-700 font-mono">
              {t.ADMIN.USER_COUNT.replace('%s', filteredUsers.length.toString())}
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-xs uppercase tracking-widest text-slate-700 border-b border-slate-800 bg-slate-900/80 sticky top-0">
              <tr>
                <th className="px-2 sm:px-4 py-3 font-bold">{t.ADMIN.TABLE.USER}</th>
                <th className="px-2 sm:px-4 py-3 font-bold">{t.ADMIN.TABLE.STATUS}</th>
                <th className="px-2 sm:px-4 py-3 font-bold">{t.ADMIN.TABLE.BALANCE}</th>
                <th className="px-2 sm:px-4 py-3 font-bold text-right">{t.ADMIN.TABLE.ACTIONS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-200 text-sm font-bold truncate max-w-[80px] sm:max-w-[150px]">
                        {u.name || t.PROFILE.TXT_NOT_SET}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-yellow-500/20 whitespace-nowrap">
                        {t.ADMIN.ROLES.ADMIN}
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-700 px-1.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-slate-700 whitespace-nowrap">
                        {t.ADMIN.ROLES.USER}
                      </span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <span className="text-slate-700 font-mono text-xs">
                      {Math.floor(u.balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleAdmin(u)}
                      className="p-2 text-slate-800 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                      title="権限切り替え"
                    >
                      <Shield size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoading && searchQuery.trim().length > 0 && (
            <div className="p-4 flex justify-center border-t border-slate-800">
              <span className="text-sm font-bold text-slate-700 animate-pulse">
                {t.ADMIN.SEARCHING}
              </span>
            </div>
          )}

          {searchQuery.trim().length === 0 && (
            <div className="p-20 text-center text-slate-800 flex flex-col items-center gap-2">
              <Search size={24} className="opacity-20" />
              <p className="text-sm">{t.ADMIN.SEARCH_PROMPT_1}</p>
              <p className="text-sm opacity-90">{t.ADMIN.SEARCH_PROMPT_2}</p>
            </div>
          )}
          
          {searchQuery.trim().length > 0 && filteredUsers.length === 0 && !isLoading && (
            <div className="p-20 text-center text-slate-800 flex flex-col items-center gap-2">
              <Activity size={24} className="opacity-20" />
              <p className="text-sm">{t.ADMIN.NO_USERS}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
