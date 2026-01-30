import React, { useState } from 'react';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkUserAnomaly, UserAnomaly } from '../hooks/useDiagnostics';
import { UserProfile } from '../types';
import { Loader2, CheckCircle, Search } from 'lucide-react';

export const AnomalyScanner: React.FC = () => {
    const [anomalies, setAnomalies] = useState<{user: UserProfile, anomaly: UserAnomaly}[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCount, setScannedCount] = useState(0);

    const runScan = async () => {
        if (!db) return;
        setIsScanning(true);
        setAnomalies([]);
        setScannedCount(0);

        try {
            // Fetch users (Limit 100 for safety, in real prod use pagination)
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('last_updated', 'desc'), limit(100));
            const snapshot = await getDocs(q);
            
            setScannedCount(snapshot.size);
            
            const results: {user: UserProfile, anomaly: UserAnomaly}[] = [];

            snapshot.forEach(doc => {
                const data = doc.data() as Omit<UserProfile, 'id'>;
                // Ensure ID is present
                const userData: UserProfile = { ...data, id: doc.id } as UserProfile;
                const anomaly = checkUserAnomaly(userData);
                if (anomaly) {
                    results.push({ user: userData, anomaly });
                }
            });

            setAnomalies(results);

        } catch (e) {
            console.error("Scan failed", e);
            alert("Scan failed: " + e);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="w-full">
            <button 
                onClick={runScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700 disabled:opacity-50 mb-4"
            >
                {isScanning ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                {isScanning ? 'Scanning...' : 'Scan for Anomalies (Max 100)'}
            </button>

            {scannedCount > 0 && (
                <div className="text-xs text-slate-500 mb-2">
                    Scanned {scannedCount} users. Found {anomalies.length} anomalies.
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {anomalies.length === 0 && scannedCount > 0 && (
                     <div className="p-4 bg-green-900/10 border border-green-900/30 rounded-lg text-green-400 text-xs flex items-center gap-2">
                        <CheckCircle size={14} />
                        No anomalies detected. The world is healthy.
                     </div>
                )}
                
                {anomalies.map((item, idx) => (
                    <div key={idx} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-400 font-bold text-xs">{item.user.name || 'Unknown'}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{item.user.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-300">
                                {item.anomaly.description}
                            </div>
                        </div>
                        <div className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded border border-red-500/30 uppercase font-bold">
                            {item.anomaly.severity}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
