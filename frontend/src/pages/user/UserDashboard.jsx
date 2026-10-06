import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Clock, Award, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import KPICard from '../../components/common/KPICard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const getGenreColor = (genre) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500'];
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function UserDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [recentRatings, setRecentRatings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({ totalRated: 0, avgRating: 0, favoriteGenre: 'N/A' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch user stats (includes recent ratings + genre preferences)
        const [statsRes, ratingsRes] = await Promise.all([
          api.get('/dashboard/user-stats').catch(() => ({ data: null })),
          api.get('/ratings/my').catch(() => ({ data: [] }))
        ]);
        const ratings = ratingsRes.data || [];
        const userStats = statsRes.data;

        const totalRated = userStats?.total_ratings ?? ratings.length;
        const avgRating = userStats?.avg_rating ?? (
          ratings.length > 0
            ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
            : 0
        );
        const topGenre = userStats?.genre_preferences?.[0]?.genre || 'N/A';

        setStats({ totalRated, avgRating, favoriteGenre: topGenre });
        setRecentRatings((userStats?.recent_ratings || ratings.slice(0, 5)));

        // Fetch Recommendations
        if (user?.id) {
          const recsRes = await api.post('/recommendations/', { user_id: user.id, n: 4 }).catch(() => ({ data: [] }));
          setRecommendations(recsRes.data || []);
        }
      } catch (error) {
        showToast(error.message || 'Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, showToast]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h1>
        <p className="text-primary-100 opacity-90">Ready to discover your next favorite movie?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Movies Rated" 
          value={stats.totalRated} 
          icon={<Star className="text-amber-500 w-8 h-8" />} 
        />
        <KPICard 
          title="Average Rating Given" 
          value={stats.avgRating} 
          icon={<TrendingUp className="text-emerald-500 w-8 h-8" />} 
        />
        <KPICard 
          title="Favorite Genre" 
          value={stats.favoriteGenre} 
          icon={<Award className="text-purple-500 w-8 h-8" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Movies */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100 flex items-center">
              <Star className="w-5 h-5 mr-2 text-amber-500" />
              Top Recommendations For You
            </h2>
            <Link to="/user/recommendations" className="text-primary-600 hover:text-primary-700 font-medium flex items-center text-sm">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map(movie => (
                <Link to={`/user/movie/${movie.movie_id}`} key={movie.movie_id} className="block group">
                  <div className="card p-4 h-full flex flex-col hover:shadow-md transition-shadow border-t-4 border-primary-500">
                    <h3 className="font-bold text-lg text-surface-900 group-hover:text-primary-600 line-clamp-1">{movie.title}</h3>
                    <div className="flex flex-wrap gap-1 my-2">
                      {(movie.genres || []).slice(0, 3).map(g => (
                        <span key={g} className={`text-xs px-2 py-1 rounded-full text-white ${getGenreColor(g)}`}>
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between text-sm text-surface-500">
                      <div className="flex items-center text-amber-500 font-medium">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        {movie.avg_rating?.toFixed(1) || 'N/A'}
                      </div>
                      <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-semibold">
                        {(movie.score * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8">
              <EmptyState 
                title="No recommendations yet" 
                message="Rate a few movies to get personalized recommendations."
                action={<Link to="/user/discover" className="btn-primary mt-4 inline-block">Discover Movies</Link>}
              />
            </div>
          )}
        </div>

        {/* Recent Ratings */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary-500" />
              Recently Rated
            </h2>
          </div>
          
          <div className="card divide-y divide-surface-200">
            {recentRatings.length > 0 ? (
              recentRatings.map(rating => (
                <div key={rating.id || rating.movie_id} className="p-4 hover:bg-surface-50 transition-colors">
                  <Link to={`/user/movie/${rating.movie_id}`} className="flex justify-between items-start">
                    <div className="pr-4">
                      <h4 className="font-medium text-surface-800 line-clamp-1">{rating.movie_title || 'Unknown Title'}</h4>
                      <p className="text-xs text-surface-500 mt-1">
                        {rating.timestamp ? new Date(rating.timestamp > 1e11 ? rating.timestamp : rating.timestamp * 1000).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center bg-amber-50 px-2 py-1 rounded text-amber-700 font-bold shrink-0">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {rating.rating?.toFixed(1)}
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-surface-500 text-sm">
                You haven't rated any movies yet.
              </div>
            )}
            <div className="p-3 text-center bg-surface-50 rounded-b-lg">
              <Link to="/user/my-ratings" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View rating history
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
