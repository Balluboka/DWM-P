import React, { useState, useEffect } from 'react';
import { Film, Users, Star, Tag, TrendingUp, Layers } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/client';
import KPICard from '../../components/common/KPICard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        showToast('Failed to load dashboard stats', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <EmptyState title="No Data Available" message="Please run the ETL pipeline first." />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard title="Total Movies" value={stats.total_movies} icon={Film} color="blue" />
        <KPICard title="Total Users" value={stats.total_users} icon={Users} color="green" />
        <KPICard title="Total Ratings" value={stats.total_ratings} icon={Star} color="purple" />
        <KPICard title="Total Tags" value={stats.total_tags} icon={Tag} color="amber" />
        <KPICard title="Average Rating" value={stats.avg_rating?.toFixed(2)} icon={TrendingUp} color="red" />
        <KPICard title="Number of Genres" value={stats.num_genres} icon={Layers} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="card bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-surface-800">Rating Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rating_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Movies by Genre */}
        <div className="card bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-surface-800">Movies by Genre</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.movies_by_genre} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="genre" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6">
                  {stats.movies_by_genre?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Rating by Genre */}
        <div className="card bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-surface-800">Average Rating by Genre</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.avg_rating_by_genre}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="genre" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="avg_rating" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratings Over Time */}
        <div className="card bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-surface-800">Ratings Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.ratings_over_time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Rated Movies */}
        <div className="card bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-surface-800">Most Rated Movies (Top 10)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.most_rated_movies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="rating_count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Rated Movies */}
        <div className="card bg-white p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-surface-800">Highest Rated Movies (Top 10)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.highest_rated_movies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="title" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="avg_rating" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
