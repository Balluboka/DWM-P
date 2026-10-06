import React, { useEffect, useState } from 'react';
import { Server, Database, Code, Globe, Shield, Activity, Clock } from 'lucide-react';
import api from '../../api/client';

export default function SystemPage() {
  const [etlStatus, setEtlStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/etl/status');
        setEtlStatus(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-surface-900">System Information</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-700">Database Engine</h3>
            <Database className="text-blue-500 w-6 h-6" />
          </div>
          <p className="text-2xl font-semibold">SQLite (SQLAlchemy)</p>
          <p className="text-sm text-surface-500 mt-2">Data Warehouse backend</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-700">API Server</h3>
            <Server className="text-green-500 w-6 h-6" />
          </div>
          <p className="text-2xl font-semibold">FastAPI</p>
          <p className="text-sm text-surface-500 mt-2">Python backend framework</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-700">Last ETL Run</h3>
            <Clock className="text-purple-500 w-6 h-6" />
          </div>
          <p className="text-lg font-semibold truncate">
            {etlStatus?.last_run ? new Date(etlStatus.last_run).toLocaleString() : 'Never'}
          </p>
          <p className="text-sm text-surface-500 mt-2">Status: {etlStatus?.status || 'Unknown'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center border-b pb-2">
          <Code className="w-5 h-5 mr-2 text-surface-600" /> Technology Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-surface-800 mb-2">Frontend</h4>
            <ul className="list-disc pl-5 text-surface-600 space-y-1">
              <li>React 18</li>
              <li>Vite</li>
              <li>Tailwind CSS</li>
              <li>Recharts (Data Visualization)</li>
              <li>Lucide React (Icons)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-surface-800 mb-2">Backend (DWM Concepts)</h4>
            <ul className="list-disc pl-5 text-surface-600 space-y-1">
              <li>Pandas (ETL & Preprocessing)</li>
              <li>Scikit-Learn (K-Means Clustering)</li>
              <li>SQLAlchemy (ORM & Star Schema)</li>
              <li>FastAPI (RESTful APIs)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center border-b pb-2">
          <Globe className="w-5 h-5 mr-2 text-surface-600" /> API Endpoints Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-700">
              <tr>
                <th className="p-2 border-b">Method</th>
                <th className="p-2 border-b">Endpoint</th>
                <th className="p-2 border-b">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-2 font-bold text-blue-600">GET</td><td className="p-2">/api/dashboard/stats</td><td className="p-2">High-level KPI metrics</td></tr>
              <tr><td className="p-2 font-bold text-blue-600">GET</td><td className="p-2">/api/etl/dataset-info</td><td className="p-2">Raw dataset analysis</td></tr>
              <tr><td className="p-2 font-bold text-green-600">POST</td><td className="p-2">/api/etl/run</td><td className="p-2">Execute ETL pipeline</td></tr>
              <tr><td className="p-2 font-bold text-green-600">POST</td><td className="p-2">/api/olap/*</td><td className="p-2">Rollup, Drilldown, Slice, Dice, Pivot</td></tr>
              <tr><td className="p-2 font-bold text-green-600">POST</td><td className="p-2">/api/clustering/kmeans</td><td className="p-2">Run K-Means clustering</td></tr>
              <tr><td className="p-2 font-bold text-green-600">POST</td><td className="p-2">/api/visualizations/data</td><td className="p-2">Generate chart data</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface-50 p-6 rounded-lg text-center">
        <h3 className="font-bold text-surface-800 text-lg">Movie Recommendation & Data Warehouse Analytics System</h3>
        <p className="text-surface-600 mt-2">DWM Project built with React & FastAPI</p>
      </div>
    </div>
  );
}
