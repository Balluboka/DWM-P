import React, { useState, useEffect } from 'react';
import { Tag as TagIcon, Filter } from 'lucide-react';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [movieId, setMovieId] = useState('');

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const response = await api.get('/tags/popular');
        setPopularTags(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPopular();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const response = await api.get('/tags', {
          params: { page, limit: 15, movie_id: movieId }
        });
        setTags(response.data.tags || []);
        setTotal(response.data.total || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [page, movieId]);

  const columns = [
    { header: 'ID', accessor: 'tag_id' },
    { header: 'User ID', accessor: 'user_id' },
    { header: 'Movie ID', accessor: 'movie_id' },
    { header: 'Tag', accessor: (row) => <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">{row.tag}</span> },
    { header: 'Date', accessor: (row) => row.timestamp ? new Date(row.timestamp * 1000).toLocaleDateString() : '-' }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Tags Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center text-amber-700">
          <TagIcon className="w-5 h-5 mr-2" /> Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 20).map((pt, i) => (
            <span key={i} className="px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-sm border border-surface-200">
              {pt.tag} <span className="text-surface-400 ml-1">({pt.count})</span>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center text-surface-500"><Filter className="w-5 h-5 mr-2" /> Filter:</div>
        <input 
          type="number" 
          placeholder="Filter by Movie ID" 
          className="input-field"
          value={movieId}
          onChange={(e) => { setMovieId(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <DataTable columns={columns} data={tags} />
          
          <div className="flex justify-between items-center p-4 border-t">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-surface-100 rounded disabled:opacity-50">Previous</button>
            <span className="text-sm text-surface-600">Page {page} (Total: {total})</span>
            <button disabled={tags.length < 15} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-surface-100 rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
