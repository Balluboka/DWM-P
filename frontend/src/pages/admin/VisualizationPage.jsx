import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { BarChart2, LineChart as LineChartIcon, ScatterChart as ScatterIcon, Play, Sparkles } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#4f46e5'];

export default function VisualizationPage() {
  const [dataset, setDataset] = useState('movies');
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('genre');
  const [yAxis, setYAxis] = useState('count');
  const [limit, setLimit] = useState(15);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const datasetColumnPresets = {
    movies: [
      { name: 'genre', type: 'categorical' },
      { name: 'year', type: 'numeric' },
      { name: 'rating_count', type: 'numeric' },
      { name: 'avg_rating', type: 'numeric' },
      { name: 'title', type: 'categorical' },
      { name: 'count', type: 'numeric' },
    ],
    ratings: [
      { name: 'rating', type: 'numeric' },
      { name: 'year', type: 'numeric' },
      { name: 'month', type: 'numeric' },
      { name: 'date', type: 'categorical' },
      { name: 'user_id', type: 'categorical' },
      { name: 'count', type: 'numeric' },
    ],
    tags: [
      { name: 'tag', type: 'categorical' },
      { name: 'user_id', type: 'categorical' },
      { name: 'movie_id', type: 'categorical' },
      { name: 'count', type: 'numeric' },
    ]
  };

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const response = await api.get(`/visualizations/columns/${dataset}`);
        const cols = response.data.columns || datasetColumnPresets[dataset] || [];
        setColumns(cols);
        if (cols.length > 0) {
          if (dataset === 'movies') {
            setXAxis('genre');
            setYAxis('count');
          } else if (dataset === 'ratings') {
            setXAxis('rating');
            setYAxis('count');
          } else {
            setXAxis(cols[0].name);
            setYAxis('count');
          }
        }
      } catch (error) {
        setColumns(datasetColumnPresets[dataset] || []);
      }
    };
    fetchColumns();
  }, [dataset]);

  const generateChart = async (overrideParams = null) => {
    setLoading(true);
    try {
      const pChartType = overrideParams?.type || chartType;
      const pDataset   = overrideParams?.dataset || dataset;
      const pXAxis     = overrideParams?.x || xAxis;
      const pYAxis     = overrideParams?.y || yAxis;
      const pLimit     = Number(overrideParams?.limit || limit);

      const response = await api.post('/visualizations/data', {
        chart_type: pChartType, dataset: pDataset,
        x_axis: pXAxis, y_axis: pYAxis, limit: pLimit
      });

      let resData = response.data;
      // Scatter: filter to only rows where both x and y are valid numbers
      if (pChartType === 'scatter' && resData?.data) {
        const valid = resData.data.filter(
          d => d != null &&
               typeof d.x === 'number' && isFinite(d.x) &&
               typeof d.y === 'number' && isFinite(d.y)
        );
        if (valid.length === 0) {
          showToast('Scatter needs two numeric columns — try "rating_count" (X) + "avg_rating" (Y).', 'warning');
          setLoading(false);
          return;
        }
        resData = { ...resData, data: valid };
      }

      setData(resData);
      showToast('Visualization generated successfully', 'success');
    } catch (error) {
      showToast('Failed to generate visualization: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for scatter
  const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-surface-200 rounded-lg shadow-lg p-3 text-xs">
        <div className="font-bold text-surface-700 mb-1">Data Point</div>
        <div>{data?.x_label}: <span className="font-semibold text-surface-900">{typeof d?.x === 'number' ? d.x.toLocaleString() : d?.x}</span></div>
        <div>{data?.y_label}: <span className="font-semibold text-surface-900">{typeof d?.y === 'number' ? d.y.toFixed(3) : d?.y}</span></div>
      </div>
    );
  };

  // Generate initial sample chart on load
  useEffect(() => {
    generateChart({ dataset: 'movies', type: 'bar', x: 'genre', y: 'count', limit: 12 });
  }, []);

  const applyPreset = (preset) => {
    setDataset(preset.dataset);
    setChartType(preset.type);
    setXAxis(preset.x);
    setYAxis(preset.y);
    setLimit(preset.limit || 15);
    generateChart(preset);
  };

  const presets = [
    { name: '🎬 Movies by Genre', dataset: 'movies', type: 'bar', x: 'genre', y: 'count', limit: 12 },
    { name: '⭐ Rating Distribution', dataset: 'ratings', type: 'bar', x: 'rating', y: 'count', limit: 10 },
    { name: '📈 Ratings Over Time', dataset: 'ratings', type: 'line', x: 'date', y: 'count', limit: 30 },
    { name: '🎯 Rating vs Popularity', dataset: 'movies', type: 'scatter', x: 'rating_count', y: 'avg_rating', limit: 80 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Data Visualization Lab</h1>
        <p className="text-sm text-surface-500 mt-1">Explore multidimensional distributions using preset analytics or custom dimension builders</p>
      </div>

      {/* Preset Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {presets.map((p, i) => (
          <button 
            key={i} 
            onClick={() => applyPreset(p)} 
            className="px-4 py-2 bg-white hover:bg-primary-50 text-surface-700 hover:text-primary-700 rounded-full text-xs font-bold border border-surface-200 shadow-2xs transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 bg-white p-5 shadow-sm rounded-xl border border-surface-200 space-y-4">
          <div className="border-b border-surface-100 pb-3">
            <h3 className="font-bold text-base text-surface-900">Custom Chart Builder</h3>
            <p className="text-xs text-surface-500">Configure parameters to plot any dimensional relation</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">1. Dataset</label>
            <select 
              className="select-field text-sm" 
              value={dataset} 
              onChange={(e) => setDataset(e.target.value)}
            >
              <option value="movies">Movies Dimension</option>
              <option value="ratings">Ratings Fact Table</option>
              <option value="tags">Tags Dimension</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">2. Chart Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => setChartType('bar')} 
                className={`p-2.5 rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition-all ${
                  chartType === 'bar' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-xs' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                }`}
              >
                <BarChart2 className="w-5 h-5 mb-1" />
                Bar
              </button>
              <button 
                type="button"
                onClick={() => setChartType('line')} 
                className={`p-2.5 rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition-all ${
                  chartType === 'line' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-xs' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                }`}
              >
                <LineChartIcon className="w-5 h-5 mb-1" />
                Line
              </button>
              <button 
                type="button"
                onClick={() => setChartType('scatter')} 
                className={`p-2.5 rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition-all ${
                  chartType === 'scatter' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-xs' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                }`}
              >
                <ScatterIcon className="w-5 h-5 mb-1" />
                Scatter
              </button>
            </div>
            {chartType === 'scatter' && (
              <p className="text-[10px] text-amber-700 mt-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                ⚠ Both axes must be <strong>numeric</strong>. Best: X=rating_count, Y=avg_rating.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">3. X-Axis (Dimension)</label>
            <select 
              className="select-field text-sm" 
              value={xAxis} 
              onChange={(e) => setXAxis(e.target.value)}
            >
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">4. Y-Axis (Measure / Metric)</label>
            <select 
              className="select-field text-sm" 
              value={yAxis} 
              onChange={(e) => setYAxis(e.target.value)}
            >
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1">5. Record Limit</label>
            <input 
              type="number" 
              min="5" 
              max="200" 
              className="input-field text-sm" 
              value={limit} 
              onChange={(e) => setLimit(e.target.value)} 
            />
          </div>

          <button 
            type="button"
            onClick={() => generateChart()} 
            disabled={loading} 
            className="btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all mt-2"
          >
            {loading ? <LoadingSpinner size="small" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
            {loading ? 'Generating Chart...' : 'GENERATE VISUALIZATION'}
          </button>
        </div>

        {/* Chart Display Panel */}
        <div className="lg:col-span-3 bg-white p-6 shadow-sm rounded-xl border border-surface-200 min-h-[480px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner message="Rendering visual aggregation..." />
            </div>
          ) : data && data.data && data.data.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-surface-100 pb-3 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-surface-900">{data.title}</h2>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Dataset: <span className="font-semibold capitalize text-surface-800">{dataset}</span> • Plotting <span className="font-semibold text-primary-700">{data.y_label}</span> across <span className="font-semibold text-primary-700">{data.x_label}</span>
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-surface-100 text-surface-700 rounded-full border border-surface-200 mt-2 sm:mt-0">
                  {data.data.length} data points
                </span>
              </div>

              <div className="flex-1 min-h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  {data.chart_type === 'bar' ? (
                    <BarChart data={data.data} margin={{ top: 15, right: 15, left: 10, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="x" 
                        angle={-30} 
                        textAnchor="end" 
                        tick={{ fontSize: 11, fill: '#475569' }} 
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a' }} 
                      />
                      <Bar dataKey="y" name={data.y_label} radius={[4, 4, 0, 0]}>
                        {data.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : data.chart_type === 'line' ? (
                    <LineChart data={data.data} margin={{ top: 15, right: 15, left: 10, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="x" 
                        angle={-30} 
                        textAnchor="end" 
                        tick={{ fontSize: 11, fill: '#475569' }} 
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#2563eb' }} 
                        activeDot={{ r: 7 }} 
                        name={data.y_label} 
                      />
                    </LineChart>
                  ) : (
                    <ScatterChart margin={{ top: 20, right: 20, left: 40, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="x"
                        name={data.x_label}
                        type="number"
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        label={{ value: data.x_label, position: 'insideBottom', offset: -20, fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        dataKey="y"
                        name={data.y_label}
                        type="number"
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        label={{ value: data.y_label, angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      />
                      <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name={data.title} data={data.data} fillOpacity={0.75}>
                        {data.data.map((_, i) => (
                          <Cell key={`sc-${i}`} fill={COLORS[i % COLORS.length]} fillOpacity={0.75} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-surface-100 text-surface-400 rounded-2xl flex items-center justify-center mb-3">
                <BarChart2 size={32} />
              </div>
              <h3 className="font-bold text-surface-800 text-base">No Data for this Dimension Selection</h3>
              <p className="text-xs text-surface-500 max-w-sm mt-1">
                Try selecting a different metric or click one of the preset pills on top to preview sample charts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
