import React, { useState } from 'react';
import { ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Boxes, Play, TrendingUp, HelpCircle, Layers, Award } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#4f46e5'];

const formatMetricKey = (k) => {
  if (k === 'avg_rating') return 'Avg Rating';
  if (k === 'rating_count') return 'Rating Count';
  if (k === 'rating_std') return 'Rating Std Dev';
  if (k === 'rating_range') return 'Rating Range';
  if (k.startsWith('genre_')) return `Genre (${k.replace('genre_', '')})`;
  return k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function ClusteringPage() {
  const [clusterType, setClusterType] = useState('user');
  const [k, setK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [elbowLoading, setElbowLoading] = useState(false);
  const [clusterData, setClusterData] = useState(null);
  const [elbowData, setElbowData] = useState(null);
  const { showToast } = useToast();

  const runClustering = async () => {
    setLoading(true);
    try {
      const response = await api.post('/clustering/kmeans', {
        type: clusterType,
        k: parseInt(k)
      });
      setClusterData(response.data);
      showToast('K-Means clustering completed successfully', 'success');
    } catch (error) {
      showToast('Clustering failed: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const runElbow = async () => {
    setElbowLoading(true);
    try {
      const response = await api.post('/clustering/elbow', {
        type: clusterType,
        max_k: 8
      });
      setElbowData(response.data);
      showToast('Elbow evaluation completed', 'success');
    } catch (error) {
      showToast('Elbow evaluation failed', 'error');
    } finally {
      setElbowLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">K-Means Clustering Analysis</h1>
        <p className="text-sm text-surface-500 mt-1">
          Cluster users by rating behavior (volume, consistency, variance) or cluster movies by genre profiles and ratings
        </p>
      </div>

      {/* Control Panel */}
      <div className="card p-6 shadow-sm border border-surface-200 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Cluster Entity</label>
            <select
              className="select-field"
              value={clusterType}
              onChange={(e) => {
                setClusterType(e.target.value);
                setClusterData(null);
                setElbowData(null);
              }}
            >
              <option value="user">Users (Behavioral Segments)</option>
              <option value="movie">Movies (Genre & Rating Profiles)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Number of Clusters (K)</label>
            <input
              type="number"
              min="2"
              max="8"
              className="input-field"
              value={k}
              onChange={(e) => setK(e.target.value)}
            />
          </div>

          <div>
            <button
              onClick={runClustering}
              disabled={loading}
              className="btn-primary w-full py-2.5 font-bold shadow-sm"
            >
              {loading ? <LoadingSpinner size="small" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
              {loading ? 'Clustering...' : 'RUN CLUSTERING'}
            </button>
          </div>

          <div>
            <button
              onClick={runElbow}
              disabled={elbowLoading}
              className="btn-secondary w-full py-2.5 font-semibold"
            >
              {elbowLoading ? <LoadingSpinner size="small" /> : <TrendingUp className="w-4 h-4 mr-2 text-primary-600" />}
              {elbowLoading ? 'Evaluating...' : 'RUN ELBOW METHOD'}
            </button>
          </div>
        </div>
      </div>

      {/* Elbow Method Chart */}
      {elbowData && (
        <div className="card p-6 shadow-sm border border-surface-200 bg-white">
          <div className="flex items-center justify-between mb-3 border-b border-surface-100 pb-3">
            <h3 className="text-lg font-bold text-surface-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-600" /> Elbow Method Optimization Curve
            </h3>
            {elbowData.suggested_k && (
              <span className="text-xs font-bold px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                Suggested K: {elbowData.suggested_k}
              </span>
            )}
          </div>
          <p className="text-xs text-surface-600 mb-4">
            The Elbow Method analyzes cluster inertia (sum of squared distances from centroids). Look for the point of diminishing returns ("elbow") to choose optimal K.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={elbowData.k_values.map((val, i) => ({ k: val, inertia: elbowData.inertias[i] }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="k" label={{ value: 'Number of Clusters (K)', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 12 }} />
                <YAxis label={{ value: 'Inertia', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    color: '#0f172a' 
                  }} 
                />
                <Line type="monotone" dataKey="inertia" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cluster Results */}
      {clusterData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scatter Plot */}
          <div className="card p-6 shadow-sm border border-surface-200 bg-white min-h-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-surface-900">Cluster Scatter Plot Visualization</h3>
                <p className="text-xs text-surface-500">
                  X: {formatMetricKey(clusterData.feature_names?.[0] || 'X')} vs Y: {formatMetricKey(clusterData.feature_names?.[1] || 'Y')}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-surface-100 text-surface-700 rounded-full">
                {clusterData.scatter_data?.length || 0} sample points
              </span>
            </div>

            <div className="flex-1 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="x" 
                    name={formatMetricKey(clusterData.feature_names?.[0] || 'X')} 
                    type="number"
                    tick={{ fontSize: 11, fill: '#475569' }} 
                    label={{ value: formatMetricKey(clusterData.feature_names?.[0] || 'X'), position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 11 }}
                  />
                  <YAxis 
                    dataKey="y" 
                    name={formatMetricKey(clusterData.feature_names?.[1] || 'Y')} 
                    type="number"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{ value: formatMetricKey(clusterData.feature_names?.[1] || 'Y'), angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a' }} 
                  />
                  <Scatter data={clusterData.scatter_data} name="Data Points">
                    {clusterData.scatter_data?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cluster Characteristics Cards with Bold Dark Text */}
          <div className="card p-6 shadow-sm border border-surface-200 bg-white min-h-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-surface-900">Cluster Characteristics & Profiles</h3>
                <p className="text-xs text-surface-500">Summary centroid metrics for each partitioned cluster segment</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full">
                K = {clusterData.clusters?.length || 0}
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              {clusterData.clusters?.map((c) => {
                const clusterColor = COLORS[c.cluster_id % COLORS.length];
                const statsEntries = c.stats ? Object.entries(c.stats) : [];
                return (
                  <div 
                    key={c.cluster_id} 
                    className="p-4 rounded-xl border bg-surface-50/70 hover:bg-surface-50 transition-colors shadow-sm"
                    style={{ borderLeftWidth: '5px', borderLeftColor: clusterColor }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base" style={{ color: clusterColor }}>
                          Cluster {c.cluster_id}
                        </span>
                        <span className="text-xs text-surface-500 font-medium">({c.size} items)</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-surface-200 text-surface-800 shadow-xs">
                        {((c.size / (clusterData.total_items || 1)) * 100).toFixed(1)}% of total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      {statsEntries.map(([k, v]) => {
                        const formattedLabel = formatMetricKey(k);
                        let displayVal = '-';
                        if (typeof v === 'number') {
                          displayVal = Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
                          if (k === 'avg_rating') displayVal += ' ★';
                        } else if (typeof v === 'object' && v !== null) {
                          displayVal = v.mean !== undefined ? `${v.mean.toFixed(2)} ★` : JSON.stringify(v);
                        } else if (v !== undefined && v !== null) {
                          displayVal = String(v);
                        }

                        return (
                          <div key={k} className="p-2 bg-white rounded-lg border border-surface-200 shadow-2xs flex justify-between items-center">
                            <span className="text-surface-600 font-medium truncate mr-2" title={formattedLabel}>
                              {formattedLabel}:
                            </span>
                            <span className="font-extrabold text-surface-900 font-mono text-xs shrink-0">
                              {displayVal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
