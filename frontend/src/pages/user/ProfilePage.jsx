import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, Calendar, Activity, Star } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [ratingsRes, statsRes] = await Promise.all([
          api.get('/ratings/my').catch(() => ({ data: [] })),
          api.get('/dashboard/user-stats').catch(() => ({ data: null }))
        ]);
        setRatings(ratingsRes.data || []);
        setUserStats(statsRes.data);
      } catch (error) {
        showToast('Failed to load profile stats', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [showToast]);

  // Derived Stats
  const { totalRatings, avgRating, timelineData, genreData } = useMemo(() => {
    const total = userStats?.total_ratings ?? ratings.length;
    const avg = userStats?.avg_rating ?? (
      ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        : 0
    );

    // Timeline data (group by Month-Year)
    const timeMap = {};
    ratings.forEach(r => {
      const ts = r.timestamp ? (r.timestamp > 1e11 ? r.timestamp : r.timestamp * 1000) : Date.now();
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!timeMap[key]) timeMap[key] = { name: key, count: 0 };
      timeMap[key].count++;
    });
    const timeline = Object.values(timeMap).sort((a, b) => a.name.localeCompare(b.name));

    // Real genre preferences from user stats, or extract from ratings
    let genreData = [];
    if (userStats?.genre_preferences && userStats.genre_preferences.length > 0) {
      genreData = userStats.genre_preferences.map(g => ({
        name: g.genre,
        value: g.count
      }));
    } else {
      const genreCounts = {};
      ratings.forEach(r => {
        if (r.genres) {
          r.genres.split('|').forEach(g => {
            const trimmed = g.trim();
            if (trimmed && trimmed !== '(no genres listed)') {
              genreCounts[trimmed] = (genreCounts[trimmed] || 0) + 1;
            }
          });
        }
      });
      genreData = Object.entries(genreCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);
    }

    return { 
      totalRatings: total, 
      avgRating: Number(avg).toFixed(1),
      timelineData: timeline,
      genreData
    };
  }, [ratings, userStats]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-surface-800 mb-6">User Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1 card p-8 flex flex-col items-center text-center bg-white shadow-md border-t-4 border-primary-500">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4 text-primary-600">
            <User className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-1">{user?.username}</h2>
          <div className="flex items-center justify-center text-surface-500 mb-6 bg-surface-100 px-3 py-1 rounded-full text-sm">
            <Shield className="w-4 h-4 mr-1 text-primary-500" /> {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
          </div>
          
          <div className="w-full space-y-4 border-t border-surface-200 pt-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500 flex items-center"><Activity className="w-4 h-4 mr-2" /> Ratings</span>
              <span className="font-bold text-surface-800">{totalRatings}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500 flex items-center"><Star className="w-4 h-4 mr-2" /> Avg Rating</span>
              <span className="font-bold text-surface-800">{avgRating} / 5.0</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Member Since</span>
              <span className="font-bold text-surface-800">2026</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          <div className="card p-6 bg-white shadow-sm">
            <h3 className="font-bold text-surface-800 mb-4 border-b border-surface-100 pb-2">Genre Preferences</h3>
            <div className="h-64">
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-surface-400 text-sm">
                  Rate movies with genres to see your preference breakdown.
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 bg-white shadow-sm">
            <h3 className="font-bold text-surface-800 mb-4 border-b border-surface-100 pb-2">Rating Activity Over Time</h3>
            <div className="h-64">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-surface-400 text-sm">Not enough data to display timeline.</div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
