"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { scanParcel, unscanParcel, getSorterStats, ScanResponse, SortingStats } from "@/lib/api";

type ScanState = "ready" | "success" | "error";

interface ScanResult {
  driverName: string;
  position: number;
  trackingNo: string;
}

interface ScanError {
  type: "not_found" | "already_sorted";
  message: string;
  details?: string;
}

export default function SorterPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [scanState, setScanState] = useState<ScanState>("ready");
  const [scanInput, setScanInput] = useState("");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [shiftGoal] = useState(500);
  const [undoing, setUndoing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const stats = await getSorterStats(user.id);
      setTodayCount(stats.total_scanned_today);
    } catch {
      // Stats loading failed, use default
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "trieur")) {
      router.push("/login");
    } else if (!isLoading && user) {
      loadStats();
    }
  }, [user, isLoading, router, loadStats]);

  useEffect(() => {
    // Auto-focus on input
    if (inputRef.current && scanState === "ready") {
      inputRef.current.focus();
    }
  }, [scanState]);

  const handleScan = async (trackingNo: string) => {
    if (!trackingNo.trim()) return;

    try {
      const response = await scanParcel(trackingNo.trim());
      
      setLastScanned(trackingNo);
      setScanInput("");

      if (response.success) {
        setScanState("success");
        setScanResult({
          driverName: response.driver_name || "Unassigned",
          position: response.bag_position || 0,
          trackingNo: response.tracking_no,
        });
        setScanError(null);
        setTodayCount(prev => prev + 1);
        
        // Vibration feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      } else {
        setScanState("error");
        setScanResult(null);
        setScanError({
          type: response.already_sorted ? "already_sorted" : "not_found",
          message: response.already_sorted ? "ALREADY SORTED" : "NOT FOUND",
          details: response.message,
        });
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (err) {
      setScanState("error");
      setScanResult(null);
      setScanError({
        type: "not_found",
        message: "ERROR",
        details: err instanceof Error ? err.message : "Scan failed",
      });
    }
  };

  const resetToReady = () => {
    setScanState("ready");
    setScanResult(null);
    setScanError(null);
    setScanInput("");
    inputRef.current?.focus();
  };

  const handleUndoScan = async () => {
    if (!scanResult) return;
    
    try {
      setUndoing(true);
      const response = await unscanParcel(scanResult.trackingNo);
      
      if (response.success) {
        setTodayCount(prev => Math.max(0, prev - 1));
        // Vibration feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        resetToReady();
      } else {
        setScanState("error");
        setScanResult(null);
        setScanError({
          type: "not_found",
          message: "UNDO FAILED",
          details: response.message,
        });
      }
    } catch (err) {
      setScanState("error");
      setScanResult(null);
      setScanError({
        type: "not_found",
        message: "UNDO ERROR",
        details: err instanceof Error ? err.message : "Could not undo scan",
      });
    } finally {
      setUndoing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-400 uppercase tracking-wider">STATION 04</p>
            <p className="text-sm font-medium">PARCEL SORTING HUB</p>
          </div>
        </div>
        <button className="p-2 hover:bg-neutral-800 rounded-lg">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {scanState === "ready" && (
          <>
            <h1 className="text-4xl font-black mb-2">
              <span className="text-white italic">READY TO </span>
              <span className="text-accent-400 italic">SCAN</span>
            </h1>
            <p className="text-neutral-400 mb-8">Position barcode within the frame or use Bluetooth.</p>

            {/* Scanner Frame */}
            <div className="relative w-full max-w-sm aspect-[4/3] border-2 border-accent-500 rounded-xl mb-6 flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent-400 rounded-br-lg"></div>
              
              {/* Barcode icon */}
              <div className="text-center">
                <svg className="w-20 h-20 text-neutral-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h3v16h-3V4zm5 0h1v16h-1V4z"/>
                </svg>
                <div className="w-24 h-0.5 bg-accent-500 mx-auto animate-pulse"></div>
              </div>

              {/* Last scanned indicator */}
              {lastScanned && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-neutral-800/80 rounded-lg px-3 py-2">
                  <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase">LAST SCANNED</p>
                    <p className="text-sm font-medium">{lastScanned}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Input */}
            <p className="text-xs text-accent-400 uppercase tracking-wider mb-2">INPUT FOCUS ACTIVE</p>
            <div className="relative w-full max-w-sm mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h3v18H3V3zm5 0h2v18H8V3zm4 0h2v18h-2V3zm5 0h3v18h-3V3z"/>
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleScan(scanInput)}
                placeholder="Scan Parcel or Type ID..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>

            <button className="px-6 py-2.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm flex items-center gap-2 hover:bg-neutral-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              Manual Entry Mode
            </button>
          </>
        )}

        {scanState === "success" && scanResult && (
          <>
            {/* Success Card */}
            <div className="w-full max-w-sm bg-brand-500 rounded-3xl p-8 text-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-white/80 uppercase tracking-wider mb-2">SCANNED SUCCESSFULLY</p>
              <p className="text-6xl font-black text-white mb-2">POSITION</p>
              <p className="text-8xl font-black text-white mb-4">{scanResult.position}</p>
              <div className="border-t border-white/20 pt-4">
                <p className="text-sm text-white/60 uppercase tracking-wider">ASSIGN TO DRIVER</p>
                <p className="text-2xl font-bold text-white">{scanResult.driverName}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-sm mb-6">
              <button className="flex-1 py-3 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-neutral-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                UNDO SCAN
              </button>
              <button className="flex-1 py-3 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-neutral-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                ISSUE
              </button>
            </div>

            {/* Stats */}
            <div className="w-full max-w-sm bg-neutral-800 rounded-xl p-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h3v18H3V3zm5 0h2v18H8V3zm4 0h2v18h-2V3zm5 0h3v18h-3V3z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase">TODAY&apos;S COUNT</p>
                  <p className="text-2xl font-bold">{todayCount}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 uppercase">SHIFT GOAL</p>
                <p className="text-2xl font-bold">{shiftGoal}</p>
              </div>
            </div>

            {/* Ready for next */}
            <button
              onClick={resetToReady}
              className="w-full max-w-sm py-4 bg-accent-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h3v18H3V3zm5 0h2v18H8V3zm4 0h2v18h-2V3zm5 0h3v18h-3V3z"/>
              </svg>
              READY FOR NEXT SCAN
            </button>
          </>
        )}

        {scanState === "error" && scanError && (
          <>
            {/* Error Card */}
            <div className="w-full max-w-sm bg-danger-500 rounded-3xl p-8 text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <svg className="w-full h-full text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                  <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth={2}/>
                </svg>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-white/80 uppercase tracking-wider mb-2">SCAN ERROR</p>
              <p className="text-3xl font-black text-white mb-4">{scanError.message}</p>
              <div className="w-12 h-0.5 bg-white/30 mx-auto mb-4"></div>
              {scanError.details && (
                <p className="text-sm text-white/80">{scanError.details}</p>
              )}
            </div>

            {/* Try Again */}
            <button
              onClick={resetToReady}
              className="w-full max-w-sm py-4 bg-white text-danger-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              TRY AGAIN
            </button>

            {/* Stats */}
            <div className="w-full max-w-sm bg-neutral-800 rounded-xl p-4 flex items-center justify-between mt-6">
              <div>
                <p className="text-xs text-neutral-400 uppercase">TOTAL SCANNED</p>
                <p className="text-3xl font-bold">{todayCount}</p>
              </div>
              <button className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-neutral-800 bg-neutral-900">
        <div className="flex justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-accent-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h3v18H3V3zm5 0h2v18H8V3zm4 0h2v18h-2V3zm5 0h3v18h-3V3z"/>
            </svg>
            <span className="text-xs font-medium">SCAN</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">HISTORY</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">MANIFEST</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">SETTINGS</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
