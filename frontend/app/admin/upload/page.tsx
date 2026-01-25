"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { uploadParcelFile, getUploadStats, clearAllParcels, UploadResult, UploadStats } from "@/lib/api";

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [gofoFile, setGofoFile] = useState<File | null>(null);
  const [cainiaoFile, setCainiaoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load stats on mount
  const loadStats = useCallback(async () => {
    try {
      const data = await getUploadStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  // Initial load
  useState(() => {
    if (user?.role === "admin") {
      loadStats();
    }
  });

  // Auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    router.push("/login");
    return null;
  }

  const handleUpload = async () => {
    if (!gofoFile && !cainiaoFile) {
      setError("Veuillez sélectionner au moins un fichier");
      return;
    }

    setUploading(true);
    setError(null);
    const newResults: UploadResult[] = [];

    try {
      if (gofoFile) {
        const result = await uploadParcelFile(gofoFile, "gofo");
        newResults.push(result);
      }
      
      if (cainiaoFile) {
        const result = await uploadParcelFile(cainiaoFile, "cainiao");
        newResults.push(result);
      }

      setResults(newResults);
      setGofoFile(null);
      setCainiaoFile(null);
      
      // Reset file inputs
      const gofoInput = document.getElementById("gofo-file") as HTMLInputElement;
      const cainiaoInput = document.getElementById("cainiao-file") as HTMLInputElement;
      if (gofoInput) gofoInput.value = "";
      if (cainiaoInput) cainiaoInput.value = "";
      
      // Refresh stats
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer TOUS les colis ? Cette action est irréversible.")) {
      return;
    }
    
    try {
      const result = await clearAllParcels();
      alert(`${result.deleted_count} colis supprimés`);
      await loadStats();
      setResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📦 Upload des Colis</h1>
          <p className="text-gray-600 mt-2">
            Importez vos fichiers GOFO et CAINIAO pour créer les colis
          </p>
        </div>

        {/* Stats Card */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">📊 Statistiques actuelles</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total_parcels}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.gofo_count}</div>
                <div className="text-sm text-gray-600">GOFO</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.cainiao_count}</div>
                <div className="text-sm text-gray-600">CAINIAO</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
                <div className="text-sm text-gray-600">Assignés</div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📤 Uploader des fichiers</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* GOFO Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
              <div className="text-center">
                <div className="text-4xl mb-2">🟣</div>
                <h3 className="font-semibold text-lg mb-2">Fichier GOFO</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Format: Name, Street, City, Postal, Note (tracking), Lat/Long
                </p>
                <input
                  id="gofo-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setGofoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {gofoFile && (
                  <p className="mt-2 text-sm text-purple-600">✓ {gofoFile.name}</p>
                )}
              </div>
            </div>

            {/* CAINIAO Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-400 transition-colors">
              <div className="text-center">
                <div className="text-4xl mb-2">🟠</div>
                <h3 className="font-semibold text-lg mb-2">Fichier CAINIAO</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Format: Tracking No., Sort Code, City, Address, Coordinates
                </p>
                <input
                  id="cainiao-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setCainiaoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {cainiaoFile && (
                  <p className="mt-2 text-sm text-orange-600">✓ {cainiaoFile.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleUpload}
              disabled={uploading || (!gofoFile && !cainiaoFile)}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Upload en cours...
                </span>
              ) : (
                "📤 Uploader les fichiers"
              )}
            </button>
            
            <button
              onClick={handleClearAll}
              className="bg-red-100 text-red-700 py-3 px-6 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              🗑️ Tout supprimer
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">✅ Résultats de l&apos;upload</h2>
            {results.map((result, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={result.file_type === 'gofo' ? 'text-purple-600' : 'text-orange-600'}>
                    {result.file_type === 'gofo' ? '🟣' : '🟠'}
                  </span>
                  <span className="font-semibold">{result.filename}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total lignes:</span>{" "}
                    <span className="font-semibold">{result.total_rows}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Insérés:</span>{" "}
                    <span className="font-semibold text-green-600">{result.inserted}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Doublons:</span>{" "}
                    <span className="font-semibold text-yellow-600">{result.duplicates}</span>
                  </div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    ⚠️ Erreurs: {result.errors.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/admin")}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
