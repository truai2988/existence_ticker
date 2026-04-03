import React from "react";
import { User, CheckCircle, Loader2 } from "lucide-react";
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
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        {/* Avatar with fallback */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-200"}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-base font-bold text-slate-500">
              {isMasked ? (
                <User className="w-5 h-5 text-slate-500" />
              ) : (
                displayName?.charAt(0).toUpperCase() || (
                  <User className="w-5 h-5 text-slate-500" />
                )
              )}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => !isMasked && onOpenProfile && onOpenProfile(applicant.id, isMasked)}
            disabled={isMasked}
            className={`text-base font-bold text-left truncate w-full block transition-colors font-sans ${isMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:text-blue-600 hover:underline"}`}
          >
            {displayName}
            {metadata && (
              <span className="ml-1.5 text-xs font-normal text-slate-500 opacity-80 whitespace-nowrap font-sans">
                {metadata}
              </span>
            )}
          </button>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
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
              <span className="text-slate-500">|</span>
              <span className="text-slate-600 font-bold">{MESSAGES.DATA.RANKS[rank.id]}</span>
            </>
          </div>
        </div>
      </div>

      <button
        onClick={() => onApprove(applicant.id, displayName)}
        disabled={isActionLoading}
        className="w-full py-2.5 bg-slate-900 text-white text-base rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] font-sans"
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
