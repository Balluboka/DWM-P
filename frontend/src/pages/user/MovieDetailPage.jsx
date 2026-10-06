import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Users, Tag as TagIcon, BarChart2, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/client';
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

const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

export default function MovieDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const [movieRes, similarRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/recommendations/similar/${id}`).catch(() => ({ data: [] }))
        ]);
        
        const movieData = movieRes.data;
        setMovie(movieData);
        setSimilarMovies(similarRes.data || []);
        
        // Find if current user already rated this
        if (movieData.ratings && user?.id) {
          const myRating = movieData.ratings.find(r => String(r.user_id) === String(user.id));
          if (myRating) setUserRating(myRating.rating);
        }
      } catch (err) {
        showToast('Failed to load movie details', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovieData();
    window.scrollTo(0, 0);
  }, [id, user, showToast]);

  const handleRate = async (ratingVal) => {
    if (!user) {
      showToast('You must be logged in to rate', 'error');
      return;
    }
    
    try {
      setSubmittingRating(true);
      await api.post('/ratings', { movie_id: parseInt(id), rating: ratingVal });
      setUserRating(ratingVal);
      showToast('Rating submitted successfully!', 'success');
      
      // Update local avg slightly (mock update)
      if (movie) {
        const newCount = movie.rating_count + (userRating === 0 ? 1 : 0);
        setMovie({...movie, rating_count: newCount});
      }
    } catch (err) {
      showToast('Failed to submit rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!movie) return <EmptyState title="Movie not found" message="The movie you are looking for does not exist." />;

  // Prepare Chart Data
  const distCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (movie.ratings || []).forEach(r => {
    const rounded = Math.round(r.rating);
    if (distCounts[rounded] !== undefined) distCounts[rounded]++;
  });
  const chartData = Object.keys(distCounts).map(k => ({ rating: `${k}★`, count: distCounts[k] }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Movie Header */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg bg-surface-900 text-white min-h-[300px] flex flex-col justify-end p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-900 via-surface-800 to-transparent z-10" />
        <div className="absolute top-0 right-0 w-2/3 h-full opacity-30" 
             style={{ backgroundColor: movie.genres?.length ? getGenreColor(movie.genres[0]).replace('bg-', '') : '#333' }} />
        
        <div className="relative z-20 max-w-4xl">
          <div className="flex flex-wrap gap-2 mb-4">
            {(movie.genres || movie.genre_list || []).map(g => (
              <span key={g} className={`text-xs px-3 py-1 rounded-full font-bold ${getGenreColor(g)} text-white shadow-sm`}>
                {g}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{movie.title}</h1>
          
          <div className="flex items-center flex-wrap gap-6 text-sm">
            <div className="flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">
              <Star className="w-6 h-6 mr-2 text-amber-400 fill-current" />
              <span className="text-2xl font-bold">{movie.avg_rating?.toFixed(1) || 'N/A'}</span>
              <span className="text-white/70 ml-2">/ 5</span>
            </div>
            <div className="flex items-center text-white/80">
              <Users className="w-5 h-5 mr-2" />
              <span>{movie.rating_count} Ratings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Rate Section */}
          <div className="card p-6 border border-surface-200">
            <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center">
              {userRating > 0 ? <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" /> : <Star className="w-5 h-5 text-amber-500 mr-2" />}
              {userRating > 0 ? 'Your Rating' : 'Rate this movie'}
            </h3>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  onClick={() => handleRate(val)}
                  disabled={submittingRating}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-16 h-16
                    ${userRating === val 
                      ? 'border-amber-500 bg-amber-50 text-amber-600' 
                      : 'border-surface-200 hover:border-amber-300 hover:bg-amber-50/50 text-surface-400 hover:text-amber-500'
                    } disabled:opacity-50`}
                >
                  <Star className={`w-6 h-6 ${userRating >= val ? 'fill-current text-amber-500' : ''}`} />
                  <span className="text-xs font-bold mt-1">{val}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {movie.tags && movie.tags.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center">
                <TagIcon className="w-5 h-5 text-primary-500 mr-2" />
                Community Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {movie.tags.slice(0, 20).map((tag, idx) => (
                  <span key={idx} className="bg-surface-100 text-surface-700 border border-surface-200 px-3 py-1 rounded-full text-sm hover:bg-surface-200 transition-colors cursor-default">
                    {tag.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Distribution Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-surface-800 mb-4 flex items-center">
              <BarChart2 className="w-5 h-5 text-indigo-500 mr-2" />
              Rating Distribution
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="rating" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={30} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-surface-800 mb-6">Similar Movies You Might Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {similarMovies.slice(0, 5).map(m => (
              <Link to={`/user/movie/${m.movie_id}`} key={m.movie_id} className="card group overflow-hidden flex flex-col hover:shadow-lg transition-all border border-surface-200">
                <div className={`h-20 ${m.genres?.length ? getGenreColor(m.genres[0]) : 'bg-surface-300'} opacity-80`} />
                <div className="p-4 flex-1 -mt-6 bg-white rounded-t-xl z-10">
                  <h4 className="font-bold text-sm text-surface-900 group-hover:text-primary-600 line-clamp-2 mb-2">{m.title}</h4>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {m.avg_rating?.toFixed(1) || 'N/A'}
                    </div>
                    {m.score && (
                      <span className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-bold">
                        {(m.score * 100).toFixed(0)}% Match
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
