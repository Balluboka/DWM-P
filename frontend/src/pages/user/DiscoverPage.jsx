import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Filter, X } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';

const getGenreColor = (genre) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500'];
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function DiscoverPage() {
  const { showToast } = useToast();
  
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Genres
  useEffect(() => {
    api.get('/movies/genres')
      .then(res => setGenres(res.data || []))
      .catch(err => showToast('Failed to load genres', 'error'));
  }, [showToast]);

  // Fetch Movies
  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(search && { search }),
        ...(genre && { genre }),
        ...(minRating && { min_rating: minRating }),
        ...(maxRating && { max_rating: maxRating }),
        ...(sortBy && { sort_by: sortBy }),
      });
      
      const res = await api.get(`/movies?${params}`);
      setMovies(res.data.movies || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (error) {
      showToast('Failed to fetch movies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
    // eslint-disable-next-line
  }, [page, genre, sortBy]); // Trigger fetch on pagination, genre or sort change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMovies();
  };

  const clearFilters = () => {
    setSearch('');
    setGenre('');
    setMinRating('');
    setMaxRating('');
    setSortBy('');
    setPage(1);
    setTimeout(fetchMovies, 0); // Need a better way to ensure state updates first, but this is a quick fix
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-surface-800">Discover Movies</h1>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-surface-600 mb-1">Search</label>
            <div className="relative">
              <input 
                type="text" 
                className="input-field pl-10 w-full" 
                placeholder="Search movies by title..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-surface-400" />
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-surface-600 mb-1">Genre</label>
            <select className="select-field w-full md:w-40" value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }}>
              <option value="">All Genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="w-full md:w-auto flex gap-2">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Min Rating</label>
              <input type="number" min="0" max="5" step="0.1" className="input-field w-20" value={minRating} onChange={e => setMinRating(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Max Rating</label>
              <input type="number" min="0" max="5" step="0.1" className="input-field w-20" value={maxRating} onChange={e => setMaxRating(e.target.value)} />
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-surface-600 mb-1">Sort By</label>
            <select className="select-field w-full md:w-40" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
              <option value="">Relevance</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="rating_asc">Lowest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button type="submit" className="btn-primary flex-1 md:flex-none flex items-center justify-center">
              <Filter className="w-4 h-4 mr-2" /> Apply
            </button>
            <button type="button" onClick={clearFilters} className="btn-secondary px-3" title="Clear Filters">
              <X className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : movies.length > 0 ? (
        <>
          <div className="text-sm text-surface-500 font-medium">Found {total} movies</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map(movie => {
              const genresList = movie.genres_list || (Array.isArray(movie.genres) ? movie.genres : (typeof movie.genres === 'string' && movie.genres ? movie.genres.split('|').filter(Boolean) : []));
              return (
              <div key={movie.movie_id} className="card flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className={`h-24 ${genresList.length ? getGenreColor(genresList[0]) : 'bg-surface-300'} opacity-80`} />
                <div className="p-4 flex flex-col flex-1 -mt-10 bg-white rounded-t-xl z-10 relative">
                  <h3 className="font-bold text-lg text-surface-900 mb-1 line-clamp-2">{movie.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {genresList.slice(0, 3).map(g => (
                      <span key={g} className={`text-[10px] px-2 py-0.5 rounded-full text-white ${getGenreColor(g)}`}>
                        {g}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-surface-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        {movie.avg_rating?.toFixed(1) || 'N/A'}
                      </div>
                      <span className="text-[10px] text-surface-400">{movie.rating_count} reviews</span>
                    </div>
                    <Link to={`/user/movie/${movie.movie_id}`} className="btn-primary py-1 px-3 text-xs">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="btn-secondary py-1 px-3 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-surface-600 font-medium text-sm">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary py-1 px-3 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState 
          title="No movies found" 
          message="Try adjusting your search or filters to find what you're looking for." 
        />
      )}
    </div>
  );
}
