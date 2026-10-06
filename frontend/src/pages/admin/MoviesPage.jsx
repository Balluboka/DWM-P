import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', genres: '', imdb_id: '', tmdb_id: '' });

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [page, search, genreFilter, sortBy]);

  const fetchGenres = async () => {
    try {
      const response = await api.get('/movies/genres');
      setGenres(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/movies', {
        params: { page, limit: 10, search, genre: genreFilter, sort_by: sortBy }
      });
      setMovies(response.data.movies || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      showToast('Failed to fetch movies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/movies/${editingId}`, formData);
        showToast('Movie updated', 'success');
      } else {
        await api.post('/movies', formData);
        showToast('Movie added', 'success');
      }
      setIsModalOpen(false);
      fetchMovies();
    } catch (error) {
      showToast('Error saving movie', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    try {
      await api.delete(`/movies/${id}`);
      showToast('Movie deleted', 'success');
      fetchMovies();
    } catch (error) {
      showToast('Error deleting movie', 'error');
    }
  };

  const openModal = (movie = null) => {
    if (movie) {
      setEditingId(movie.movie_id);
      setFormData({ title: movie.title, genres: movie.genres, imdb_id: movie.imdb_id || '', tmdb_id: movie.tmdb_id || '' });
    } else {
      setEditingId(null);
      setFormData({ title: '', genres: '', imdb_id: '', tmdb_id: '' });
    }
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'ID', accessor: 'movie_id' },
    { header: 'Title', accessor: 'title' },
    { header: 'Genres', accessor: 'genres' },
    { header: 'Avg Rating', accessor: (row) => row.avg_rating?.toFixed(2) || '-' },
    { header: 'Rating Count', accessor: 'rating_count' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => openModal(row)} className="p-1 text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4"/></button>
          <button onClick={() => handleDelete(row.movie_id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-surface-900">Movies Management</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Movie
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-surface-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search movies..." 
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select-field" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">All Genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="select-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="title">Sort by Title</option>
          <option value="avg_rating">Sort by Rating</option>
          <option value="rating_count">Sort by Popularity</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <DataTable columns={columns} data={movies} />
          
          {/* Pagination controls (simplified) */}
          <div className="flex justify-between items-center p-4 border-t">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-surface-100 rounded disabled:opacity-50">Previous</button>
            <span className="text-sm text-surface-600">Page {page} (Total: {total})</span>
            <button disabled={movies.length < 10} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-surface-100 rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Movie' : 'Add Movie'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input required type="text" className="input-field w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Genres (|-separated)</label>
            <input required type="text" className="input-field w-full" value={formData.genres} onChange={e => setFormData({...formData, genres: e.target.value})} placeholder="Action|Adventure" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">IMDb ID</label>
              <input type="text" className="input-field w-full" value={formData.imdb_id} onChange={e => setFormData({...formData, imdb_id: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TMDb ID</label>
              <input type="text" className="input-field w-full" value={formData.tmdb_id} onChange={e => setFormData({...formData, tmdb_id: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
