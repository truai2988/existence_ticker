import React from "react";
import { Plus, Key, Copy, Check } from "lucide-react";

import { Timestamp } from "firebase/firestore";

interface InviteCode {
  id: string;
  is_used: boolean;
  created_at?: Timestamp | number;
  created_by?: string;
  used_by?: string;
  used_at?: Timestamp | number;
  memo?: string;
}

interface AdminInvitationsProps {
  inviteCodes: InviteCode[];
  onGenerateCode: () => void;
  onCopyInvitation: (codeId: string) => void;
  onUpdateMemo: (codeId: string, memo: string) => void;
  copiedCodeId: string | null;
}

import { useLanguage } from "../../contexts/LanguageContext";

export const AdminInvitations = React.memo<AdminInvitationsProps>(({
  inviteCodes,
  onGenerateCode,
  onCopyInvitation,
  onUpdateMemo,
  copiedCodeId
}) => {
  const { t } = useLanguage();

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-200">
          {t.ADMIN.INVITES.TITLE}
        </h3>
        <button
          type="button"
          onClick={onGenerateCode}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
        >
          <Plus size={18} /> {t.ADMIN.INVITES.BTN_GENERATE}
        </button>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden overflow-x-auto">
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {inviteCodes.length === 0 ? (
            <div className="p-12 text-center text-slate-700 flex flex-col items-center gap-2">
              <Key size={24} className="opacity-20" />
              <p>{t.ADMIN.INVITES.NO_CODES}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {inviteCodes
                .slice()
                .sort((a, b) => {
                  const aTime = (a.created_at as Timestamp)?.toMillis
                    ? (a.created_at as Timestamp).toMillis()
                    : (a.created_at as number) || 0;
                  const bTime = (b.created_at as Timestamp)?.toMillis
                    ? (b.created_at as Timestamp).toMillis()
                    : (b.created_at as number) || 0;
                  return bTime - aTime;
                })
                .map((code) => (
                  <div
                    key={code.id}
                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-800/30 transition-colors font-mono"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-800 rounded border border-slate-700">
                        <Key size={14} className="text-yellow-500/70" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-100 tracking-wider font-mono">
                          {code.id}
                        </div>
                        <div className="text-xs text-slate-700">
                          {t.ADMIN.INVITES.CREATED_AT.replace('%s', (code.created_at as Timestamp)?.toDate
                            ? (code.created_at as Timestamp).toDate().toLocaleString()
                            : new Date(code.created_at as number).toLocaleString())}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {code.is_used ? (
                        <div className="flex flex-col items-end">
                          <span className="bg-slate-800 text-slate-700 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-slate-700">
                            {t.ADMIN.INVITES.USED}
                          </span>
                          {code.used_by && (
                            <div
                              className="text-xs text-slate-700 mt-1"
                            >
                              {t.ADMIN.INVITES.USED_BY.replace('%s', code.used_by.substring(0, 5))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={t.ADMIN.INVITES.PLACEHOLDER}
                              defaultValue={code.memo || ""}
                              onBlur={(e) => {
                                if (e.target.value !== code.memo) {
                                  onUpdateMemo(code.id, e.target.value);
                                }
                              }}
                              className="bg-slate-800/80 border border-slate-700/50 rounded flex-1 px-3 py-1 text-base text-slate-700 focus:outline-none focus:border-slate-500 placeholder:text-slate-700 transition-colors w-40"
                            />
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                            {t.ADMIN.INVITES.AVAILABLE}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopyInvitation(code.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 text-xs font-bold tracking-widest uppercase active:scale-95 ${
                              copiedCodeId === code.id
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-slate-800/50 border-slate-700 text-slate-700 hover:text-white hover:border-slate-500"
                            }`}
                          >
                            {copiedCodeId === code.id ? (
                              <>
                                <Check size={12} />
                                <span>{t.ADMIN.INVITES.COPIED}</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>{t.ADMIN.INVITES.COPY}</span>
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
      <p className="text-xs text-slate-700 italic px-2">
        {t.ADMIN.INVITES.VERSION}
      </p>
    </div>
  );
});
