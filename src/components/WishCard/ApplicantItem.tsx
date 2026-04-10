import React from "react";
import { User, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTrustRank } from "../../logic/worldPhysics";
import { useOtherProfile } from "../../hooks/useOtherProfile";

export const ApplicantItem: React.FC<{
  applicant: { id: string; name: string; trust_score?: number };
  onApprove: (id: string, name: string) => void;
  onOpenProfile?: (id: string, isMasked?: boolean) => void;
  isActionLoading: boolean;
  isMasked?: boolean;
}> = ({ applicant, onApprove, onOpenProfile, isActionLoading, isMasked }) => {
  const { t: MESSAGES } = useLanguage();
  const { profile } = useOtherProfile(applicant.id);

  // MASKING LOGIC
  const displayName = isMasked ? MESSAGES.WISH_CARD.LBL_ANONYMOUS : profile?.name || applicant.name;
  const avatarUrl = isMasked ? null : profile?.avatarUrl;
  const trustScore = applicant.trust_score || 0;
  const rank = getTrustRank(profile, trustScore);

  const genderLabel =
    profile?.gender && profile.gender !== "other"
      ? profile.gender === "male"
        ? MESSAGES.WISH_CARD.LBL_MALE
        : MESSAGES.WISH_CARD.LBL_FEMALE
      : "";

  const metadata = isMasked
    ? profile?.location
      ? `(${profile.location.prefecture} ${profile.location.city}) ${genderLabel}`
      : genderLabel
    : profile?.age_group
      ? `${profile.age_group}${genderLabel ? ` / ${genderLabel}` : ""}`
      : genderLabel;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <button
        onClick={() => !isMasked && onOpenProfile && onOpenProfile(applicant.id, isMasked)}
        disabled={isMasked}
        className={`w-full flex items-center gap-3 text-left transition-colors ${
          isMasked ? "cursor-default" : "group/btn hover:opacity-80"
        }`}
      >
        {/* Avatar with fallback */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${
            isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-300 bg-white shadow-sm"
          }`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-base font-bold text-slate-700">
              {isMasked ? (
                <User className="w-5 h-5 text-slate-700" />
              ) : (
                displayName?.charAt(0).toUpperCase() || (
                  <User className="w-5 h-5 text-slate-700" />
                )
              )}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`text-base font-bold truncate w-full block transition-colors font-sans ${
              isMasked ? "text-slate-700" : "text-slate-900 group-hover/btn:text-blue-600"
            }`}
          >
            {displayName}
            {metadata && (
              <span className="ml-1.5 text-xs font-normal text-slate-700 opacity-80 whitespace-nowrap font-sans">
                {metadata}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-700 flex items-center gap-2 mt-0.5">
            {/* Trust/Helped Count Badge */}
            <div
              title={`${trustScore} times helped`}
              className={`flex items-center gap-0.5 ${rank.color}`}
            >
              {rank.icon}
              <span className="font-sans font-bold">({trustScore})</span>
            </div>

            {/* Rank Label */}
            <>
              <span className="text-slate-700">|</span>
              <span className="text-slate-800 font-bold">{MESSAGES.DATA.RANKS[rank.id]}</span>
            </>
          </div>
        </div>

        {!isMasked && (
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
        )}
      </button>

      <button
        onClick={() => onApprove(applicant.id, displayName)}
        disabled={isActionLoading}
        className="w-full py-2.5 bg-white border border-slate-300 text-slate-800 text-base rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] font-sans"
      >
        {isActionLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CheckCircle className="w-3 h-3" />
        )}
        <span>{MESSAGES.WISH_CARD.BTN_CHOOSE}</span>
      </button>
    </div>
  );
};
