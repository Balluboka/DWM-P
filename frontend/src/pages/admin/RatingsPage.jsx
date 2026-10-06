import React, { useState, useEffect } from 'react';
import { Star, Filter, Search, RotateCcw, Award, Users, Film, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import KPICard from '../../components/common/KPICard';
import { useToast } from '../../contexts/ToastContext';

export default function RatingsPage() {
  const [ratings, setRatings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [movieId, setMovieId] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState('');
  const [ratingStats, setRatingStats] = useState({ total_ratings: 100836, average_rating: 3.50 });
  const { showToast } = useToast();

  // Fetch warehouse rating summary stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/ratings/stats');
        setRatingStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (movieId && String(movieId).trim()) params.movie_id = String(movieId).trim();
      if (userId && String(userId).trim()) params.user_id = String(userId).trim();
      if (search && search.trim()) params.search = search.trim();
      if (minRating) params.min_rating = parseFloat(minRating);

      const response = await api.get('/ratings', { params });
      setRatings(response.data.ratings || []);
      setTotal(response.data.total || 0);
      setPages(response.data.pages || 1);
    } catch (error) {
      showToast('Failed to load ratings table', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [page, movieId, userId, minRating]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRatings();
  };

  const handleReset = () => {
    setMovieId('');
    setUserId('');
    setSearch('');
    setMinRating('');
    setPage(1);
  };

  const columns = [
    { header: 'Rating ID', accessor: 'rating_id' },
    { header: 'User ID', accessor: (row) => (
      <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-xs">
        User #{row.user_id}
      </span>
    )},
    { header: 'Movie ID', accessor: 'movie_id' },
    { 
      header: 'Movie Title', 
      accessor: (row) => (
        <div>
          <span className="font-bold text-surface-900 block">{row.movie_title || `Movie #${row.movie_id}`}</span>
          {row.genres && <span className="text-[11px] text-surface-500">{row.genres.replace(/\|/g, ', ')}</span>}
        </div>
      )
    },
    { 
      header: 'Score', 
      accessor: (row) => (
        <div className="flex items-center text-amber-500 font-extrabold text-sm">
          <Star className="w-4 h-4 mr-1 fill-current" />
          <span>{Number(row.rating).toFixed(1)}</span>
        </div>
      )
    },
    { 
      header: 'Timestamp / Date', 
      accessor: (row) => {
        if (!row.timestamp) return '-';
        const ts = row.timestamp > 1e11 ? row.timestamp : row.timestamp * 1000;
        return (
          <span className="text-surface-600 text-xs font-medium">
            {new Date(ts).toLocaleDateString()}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Ratings Fact Table Overview</h1>
        <p className="text-sm text-surface-500 mt-1">
          Inspect, filter, and audit individual rating records in the warehouse fact table (fact_rating)
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Warehouse Ratings" 
          value={ratingStats.total_ratings} 
          icon={Star} 
          color="purple" 
          subtitle="Star schema fact rows"
        />
        <KPICard 
          title="Overall Average Rating" 
          value={ratingStats.average_rating ? `${ratingStats.average_rating.toFixed(2)} ★` : '3.50 ★'} 
          icon={Award} 
          color="amber" 
          subtitle="Mean score across all movies"
        />
        <KPICard 
          title="Total Distinct Users" 
          value={610} 
          icon={Users} 
          color="blue" 
          subtitle="Unique evaluators"
        />
        <KPICard 
          title="Filtered Records Matching" 
          value={total} 
          icon={Filter} 
          color="green" 
          subtitle={`Page ${page} of ${pages}`}
        />
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="card p-5 shadow-sm border border-surface-200 bg-white">
        <div className="flex items-center justify-between mb-3 border-b border-surface-100 pb-2">
          <div className="flex items-center text-xs font-bold text-surface-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 mr-1.5 text-primary-600" /> Filter Fact Table
          </div>
          {(movieId || userId || search || minRating) && (
            <button
              onClick={handleReset}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <RotateCcw size={12} /> Clear all filters
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">Search Movie Title</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="e.g. Toy Story..." 
                className="input-field text-sm pl-8 py-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-4 h-4 text-surface-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">Filter by User ID</label>
            <input 
              type="number" 
              placeholder="e.g. 1, 2, 610" 
              className="input-field text-sm py-2"
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1); }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">Filter by Movie ID</label>
            <input 
              type="number" 
              placeholder="e.g. 1, 260, 296" 
              className="input-field text-sm py-2"
              value={movieId}
              onChange={(e) => { setMovieId(e.target.value); setPage(1); }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">Minimum Rating</label>
            <select 
              className="select-field text-sm py-2"
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
            >
              <option value="">All Ratings (0.5 - 5.0)</option>
              <option value="4.5">4.5★ and above</option>
              <option value="4.0">4.0★ and above</option>
              <option value="3.0">3.0★ and above</option>
              <option value="2.0">2.0★ and above</option>
            </select>
          </div>

          <div>
            <button 
              type="submit" 
              className="btn-primary w-full py-2 text-sm font-bold shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Ratings Table */}
      <div className="card p-0 shadow-sm border border-surface-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-surface-200 bg-surface-50/70 flex justify-between items-center">
          <div className="text-sm font-bold text-surface-900">
            Ratings Records ({total.toLocaleString()} found)
          </div>
          <div className="text-xs text-surface-500 font-medium">
            Page {page} of {pages}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Querying ratings fact table..." />
          </div>
        ) : ratings.length > 0 ? (
          <>
            <DataTable columns={columns} data={ratings} />
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 border-t border-surface-200 bg-surface-50/50">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                className="btn-secondary text-xs px-4 py-2 font-semibold disabled:opacity-40"
              >
                ← Previous
              </button>

              <div className="text-xs font-semibold text-surface-600">
                Page <span className="text-surface-900 font-bold">{page}</span> of <span className="text-surface-900 font-bold">{pages}</span>
              </div>

              <button 
                disabled={page >= pages || ratings.length < 15} 
                onClick={() => setPage(p => p + 1)} 
                className="btn-secondary text-xs px-4 py-2 font-semibold disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-surface-500 text-sm">
            No rating records found matching your filter criteria. Try clicking "Clear all filters" above.
          </div>
        )}
      </div>
    </div>
  );
}
