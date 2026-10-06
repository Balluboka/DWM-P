import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, Search, Plus, X } from 'lucide-react';
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

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' | 'manual'
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  
  // Manual Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);

  useEffect(() => {
    if (activeTab === 'auto' && user?.id) {
      fetchAutoRecommendations();
    }
    // eslint-disable-next-line
  }, [activeTab, user]);

  const fetchAutoRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.post('/recommendations', { user_id: user.id, n: 12 });
      setRecommendations(res.data || []);
    } catch (err) {
      showToast('Failed to fetch recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(`/movies?search=${searchQuery}&limit=5`);
      setSearchResults(res.data.movies || []);
    } catch (err) {
      showToast('Search failed', 'error');
    }
  };

  const addMovieToSelection = (movie) => {
    if (!selectedMovies.find(m => m.movie_id === movie.movie_id)) {
      if (selectedMovies.length >= 5) {
        showToast('You can select up to 5 movies max', 'error');
        return;
      }
      setSelectedMovies([...selectedMovies, movie]);
    }
  };

  const removeMovieFromSelection = (id) => {
    setSelectedMovies(selectedMovies.filter(m => m.movie_id !== id));
  };

  const getManualRecommendations = async () => {
    if (selectedMovies.length === 0) return;
    try {
      setLoading(true);
      const ids = selectedMovies.map(m => m.movie_id);
      const res = await api.post('/recommendations', { movie_ids: ids, n: 12 });
      setRecommendations(res.data || []);
    } catch (err) {
      showToast('Failed to fetch recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-surface-800 flex items-center">
          <Sparkles className="w-8 h-8 mr-3 text-purple-500" />
          Personalized Recommendations
        </h1>
      </div>

      <div className="flex border-b border-surface-200 mb-6">
        <button 
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'auto' ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          onClick={() => setActiveTab('auto')}
        >
          For You (Auto)
        </button>
        <button 
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'manual' ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          onClick={() => setActiveTab('manual')}
        >
          Custom Selection
        </button>
      </div>

      {activeTab === 'manual' && (
        <div className="card p-6 bg-surface-50 border border-surface-200 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-surface-800 mb-4">Select Reference Movies</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    className="input-field pl-10 w-full" 
                    placeholder="Search a movie..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-surface-400" />
                </div>
                <button type="submit" className="btn-secondary">Search</button>
              </form>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map(movie => (
                  <div key={movie.movie_id} className="flex items-center justify-between p-2 hover:bg-surface-100 rounded-lg border border-transparent hover:border-surface-200">
                    <div>
                      <div className="font-medium text-sm">{movie.title}</div>
                      <div className="text-xs text-surface-500 flex items-center">
                        <Star className="w-3 h-3 mr-1 text-amber-500 fill-current" /> {movie.avg_rating?.toFixed(1)}
                      </div>
                    </div>
                    <button onClick={() => addMovieToSelection(movie)} className="text-primary-600 p-1 hover:bg-primary-50 rounded">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-surface-700 mb-3">Selected ({selectedMovies.length}/5)</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedMovies.length === 0 && <span className="text-sm text-surface-400 italic">No movies selected yet.</span>}
                {selectedMovies.map(movie => (
                  <div key={movie.movie_id} className="bg-white border border-surface-200 rounded-full px-3 py-1 flex items-center text-sm shadow-sm">
                    <span className="truncate max-w-[150px] mr-2 font-medium">{movie.title}</span>
                    <button onClick={() => removeMovieFromSelection(movie.movie_id)} className="text-surface-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={getManualRecommendations} 
                disabled={selectedMovies.length === 0 || loading}
                className="btn-primary w-full disabled:opacity-50 flex justify-center items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Generate Recommendations
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((movie, idx) => (
            <Link to={`/user/movie/${movie.movie_id}`} key={`${movie.movie_id}-${idx}`} className="card group overflow-hidden flex flex-col hover:shadow-xl transition-shadow border border-surface-200">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-surface-900 group-hover:text-primary-600 line-clamp-2 pr-2">{movie.title}</h3>
                  <div className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap border border-primary-100">
                    {(movie.score * 100).toFixed(0)}% Match
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {(movie.genres_list || (Array.isArray(movie.genres) ? movie.genres : (typeof movie.genres === 'string' && movie.genres ? movie.genres.split('|').filter(Boolean) : []))).slice(0, 3).map(g => (
                    <span key={g} className={`text-[10px] px-2 py-0.5 rounded-full text-white ${getGenreColor(g)}`}>
                      {g}
                    </span>
                  ))}
                </div>

                {movie.reason && (
                  <p className="text-xs text-surface-500 mt-2 italic bg-surface-50 p-2 rounded border border-surface-100">
                    "{movie.reason}"
                  </p>
                )}
              </div>
              
              <div className="bg-surface-50 p-3 border-t border-surface-100 flex items-center justify-between">
                <div className="flex items-center text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  {movie.avg_rating?.toFixed(1) || 'N/A'}
                </div>
                <span className="text-primary-600 text-sm font-medium flex items-center group-hover:underline">
                  View Details
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No recommendations found" 
          message={activeTab === 'auto' ? "Try rating more movies to get personalized suggestions." : "Select some movies and click Generate to see results."}
          action={activeTab === 'auto' && <Link to="/user/discover" className="btn-primary mt-4 inline-block">Discover Movies</Link>}
        />
      )}
    </div>
  );
}
