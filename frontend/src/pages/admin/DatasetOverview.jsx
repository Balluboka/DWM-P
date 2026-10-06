import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import { useToast } from '../../contexts/ToastContext';
import { FileText, Database, AlertCircle, Hash, Type, Binary } from 'lucide-react';

export default function DatasetOverview() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await api.get('/etl/dataset-info');
        setDatasets(response.data || []);
      } catch (error) {
        showToast('Failed to load dataset info', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, [showToast]);

  if (loading) return <LoadingSpinner />;
  if (!datasets || datasets.length === 0) return <EmptyState title="No Datasets" message="No dataset information could be retrieved." />;

  const currentDataset = datasets[activeTab];

  // Derive column type counts dynamically if not directly provided by backend
  const typeCounts = currentDataset?.column_type_counts || (() => {
    if (!currentDataset?.dtypes) return { int: 0, float: 0, object: 0, other: 0 };
    const values = Object.values(currentDataset.dtypes);
    return {
      int: values.filter(v => String(v).includes('int')).length,
      float: values.filter(v => String(v).includes('float')).length,
      object: values.filter(v => String(v).includes('object') || String(v).includes('str')).length,
      other: values.filter(v => !String(v).includes('int') && !String(v).includes('float') && !String(v).includes('object') && !String(v).includes('str')).length,
    };
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dataset Overview</h1>
        <p className="text-sm text-surface-500 mt-1">Examine raw MovieLens CSV files, schema metadata, data types, and statistics</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-surface-200">
        {datasets.map((ds, index) => (
          <button
            key={ds.name}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === index
                ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-lg'
                : 'border-transparent text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-t-lg'
            }`}
            onClick={() => setActiveTab(index)}
          >
            <FileText size={16} />
            {ds.name}
          </button>
        ))}
      </div>

      {currentDataset && (
        <div className="space-y-6">
          {!currentDataset.exists ? (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              File not found in the designated data directory.
            </div>
          ) : (
            <>
              {/* Primary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="card p-4 flex items-center shadow-sm border border-surface-200">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-3 border border-blue-100">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-surface-500">Total Rows</div>
                    <div className="text-2xl font-extrabold text-surface-900">{currentDataset.rows?.toLocaleString() ?? 0}</div>
                  </div>
                </div>

                <div className="card p-4 flex items-center shadow-sm border border-surface-200">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mr-3 border border-purple-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-surface-500">Columns</div>
                    <div className="text-2xl font-extrabold text-surface-900">{currentDataset.columns ?? 0}</div>
                  </div>
                </div>

                <div className="card p-4 flex items-center shadow-sm border border-surface-200">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mr-3 border border-amber-100">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-surface-500">Duplicates</div>
                    <div className="text-2xl font-extrabold text-surface-900">{currentDataset.duplicates?.toLocaleString() ?? 0}</div>
                  </div>
                </div>

                <div className="card p-4 flex items-center shadow-sm border border-surface-200">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-3 border border-emerald-100">
                    <Binary className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-surface-500">Integer (int)</div>
                    <div className="text-2xl font-extrabold text-surface-900">{typeCounts.int}</div>
                  </div>
                </div>

                <div className="card p-4 flex items-center shadow-sm border border-surface-200">
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl mr-3 border border-cyan-100">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-surface-500">Float (float)</div>
                    <div className="text-2xl font-extrabold text-surface-900">{typeCounts.float}</div>
                  </div>
                </div>

                <div className="card p-4 flex items-center shadow-sm border border-surface-200">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mr-3 border border-indigo-100">
                    <Type className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-surface-500">Text (object)</div>
                    <div className="text-2xl font-extrabold text-surface-900">{typeCounts.object}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column Types Table */}
                <div className="card p-6 shadow-sm border border-surface-200 bg-white">
                  <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
                    <h3 className="text-lg font-bold text-surface-900">Column Information & Data Types</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-surface-100 text-surface-700 rounded-full">
                      {currentDataset.column_names?.length || 0} fields
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-50 text-surface-700 font-semibold border-b border-surface-200">
                        <tr>
                          <th className="p-3">Column Name</th>
                          <th className="p-3">Data Type</th>
                          <th className="p-3 text-right">Missing Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {currentDataset.column_names?.map(col => {
                          const dtype = currentDataset.dtypes?.[col] || 'unknown';
                          const missing = currentDataset.missing_values?.[col] || 0;
                          return (
                            <tr key={col} className="hover:bg-surface-50 transition-colors">
                              <td className="p-3 font-semibold text-surface-800">{col}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                                  dtype.includes('int') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  dtype.includes('float') ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                                  'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {dtype}
                                </span>
                              </td>
                              <td className={`p-3 text-right font-medium ${missing > 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                                {missing}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Statistics Table */}
                <div className="card p-6 shadow-sm border border-surface-200 bg-white">
                  <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
                    <h3 className="text-lg font-bold text-surface-900">Summary Statistics</h3>
                    <span className="text-xs text-surface-500 font-medium">Numeric features</span>
                  </div>
                  <div className="overflow-x-auto">
                    {Object.keys(currentDataset.statistics || {}).length > 0 ? (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-50 text-surface-700 font-semibold border-b border-surface-200">
                          <tr>
                            <th className="p-3">Metric</th>
                            {Object.keys(currentDataset.statistics || {}).map(col => (
                              <th key={col} className="p-3 text-right">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                          {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map(metric => {
                            const hasData = Object.keys(currentDataset.statistics || {}).some(
                              col => currentDataset.statistics[col] && currentDataset.statistics[col][metric] !== undefined
                            );
                            if (!hasData) return null;
                            return (
                              <tr key={metric} className="hover:bg-surface-50 transition-colors">
                                <td className="p-3 font-semibold text-surface-700 capitalize">{metric}</td>
                                {Object.keys(currentDataset.statistics || {}).map(col => {
                                  const val = currentDataset.statistics[col]?.[metric];
                                  return (
                                    <td key={col} className="p-3 text-right font-mono text-xs text-surface-800">
                                      {typeof val === 'number' ? (Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2)) : val ?? '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-surface-500 text-sm">
                        No numeric columns with statistics for this dataset.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample Rows Table */}
              <div className="card p-6 shadow-sm border border-surface-200 bg-white">
                <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-surface-900">Sample Records Preview</h3>
                    <p className="text-xs text-surface-500 mt-0.5">Showing top {currentDataset.sample?.length || 0} sample rows from {currentDataset.name}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                    Sample size: {currentDataset.sample?.length || 0} rows
                  </span>
                </div>
                {currentDataset.sample && currentDataset.sample.length > 0 ? (
                  <div className="overflow-x-auto border border-surface-200 rounded-lg">
                    <DataTable
                      columns={currentDataset.column_names.map(col => ({ header: col, accessor: col }))}
                      data={currentDataset.sample}
                    />
                  </div>
                ) : (
                  <p className="text-surface-500 py-4 text-center">No sample data available.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
