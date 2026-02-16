import React from "react";
import { MapPin } from "lucide-react";
import { AppViewMode } from "../types";

interface HeaderStatusDisplayProps {
  viewMode?: AppViewMode;
  locationText: string;
  onOpenLocation: () => void;
}

export const HeaderStatusDisplay: React.FC<HeaderStatusDisplayProps> = ({
  viewMode,
  locationText,
  onOpenLocation,
}) => {
  if (viewMode === 'history') {
    return (
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-widest text-slate-800 uppercase font-['Inter']">
          JOURNAL
        </h1>
        <div className="text-xs text-slate-500 font-light tracking-wide">
          あなたの歩みの記録
        </div>
        <LocationButton text={locationText} onClick={onOpenLocation} />
      </div>
    );
  }

  if (viewMode === 'profile' || viewMode === 'profile_edit') {
    return (
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-widest text-slate-800 uppercase font-['Inter']">
          PROFILE
        </h1>
        <div className="text-xs text-slate-500 font-light tracking-wide">
          あなたの記録
        </div>
        <LocationButton text={locationText} onClick={onOpenLocation} />
      </div>
    );
  }

  // Default Home View
  return (
    <>
      <div className="text-xs font-bold tracking-[0.4em] uppercase text-slate-400/80 leading-none mb-1.5 select-none pl-0.5">
        Existence Ticker
      </div>
    </>
  );
};

const LocationButton: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-start transition-all duration-300"
  >
    <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-800 transition-colors">
      <MapPin size={10} className="text-slate-600" />
      <span className="text-xs font-bold tracking-wider leading-none">
        {text}
      </span>
    </div>
  </button>
);
