import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

export default function MyRatingsPage() {
  const { showToast } = useToast();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ratings/my');
      setRatings(res.data || []);
    } catch (err) {
      showToast('Failed to load ratings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!ratings.length) return { total: 0, avg: 0, dist: [] };
    const total = ratings.length;
    const avg = ratings.reduce((acc, curr) => acc + curr.rating, 0) / total;
    
    // Distribution
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      const rounded = Math.round(r.rating);
      if (counts[rounded] !== undefined) counts[rounded]++;
    });
    
    const dist = Object.keys(counts).map(key => ({
      rating: `${key} Star`,
      count: counts[key]
    }));

    return { total, avg: avg.toFixed(1), dist };
  }, [ratings]);

  const columns = [
    { 
      header: 'Movie Title', 
      accessor: 'movie_title',
      cell: (row) => (
        <Link to={`/user/movie/${row.movie_id}`} className="font-bold text-surface-800 hover:text-primary-600 hover:underline">
          {row.movie_title || `Movie #${row.movie_id}`}
        </Link>
      )
    },
    { 
      header: 'Your Rating', 
      accessor: 'rating',
      cell: (row) => (
        <div className="flex items-center text-amber-500 font-bold">
          <Star className="w-4 h-4 mr-1 fill-current" /> {row.rating.toFixed(1)}
        </div>
      )
    },
    { 
      header: 'Date Rated', 
      accessor: 'timestamp',
      cell: (row) => (
        <div className="flex items-center text-surface-500 text-sm">
          <Clock className="w-3 h-3 mr-1" />
          {row.timestamp ? new Date(row.timestamp > 1e11 ? row.timestamp : row.timestamp * 1000).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'actions',
      cell: (row) => (
        <Link to={`/user/movie/${row.movie_id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Edit
        </Link>
      )
    }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-surface-800 mb-6">My Rating History</h1>

      {ratings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Overview */}
          <div className="col-span-1 flex flex-col gap-4">
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 flex-1">
              <h3 className="text-sm font-bold text-primary-800 uppercase tracking-wider mb-2">Total Ratings</h3>
              <div className="text-4xl font-black text-primary-600">{stats.total}</div>
            </div>
            <div className="card p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 flex-1">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2">Average Given</h3>
              <div className="text-4xl font-black text-amber-600 flex items-center">
                {stats.avg} <Star className="w-6 h-6 ml-2 fill-current" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="col-span-1 lg:col-span-2 card p-6">
            <h3 className="text-sm font-bold text-surface-700 uppercase tracking-wider mb-4">Rating Distribution</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="rating" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.dist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="col-span-1 lg:col-span-3 card overflow-hidden">
            <div className="p-4 border-b border-surface-200 bg-surface-50 flex justify-between items-center">
              <h2 className="font-bold text-surface-800">All Ratings</h2>
            </div>
            <DataTable columns={columns} data={ratings} />
          </div>
        </div>
      ) : (
        <EmptyState 
          title="No ratings found" 
          message="You haven't rated any movies yet. Start exploring and rating movies to build your profile!" 
          action={<Link to="/user/discover" className="btn-primary mt-4 inline-block">Discover Movies</Link>}
        />
      )}
    </div>
  );
}
