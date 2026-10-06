import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const DataTable = ({ columns, data = [], pagination, loading, emptyMessage = 'No data available' }) => {
  // Support both API conventions:
  //   { label, key, render }  (original DataTable convention)
  //   { header, accessor }    (used by most page components)
  const getHeader = (col) => col.label || col.header || '';
  const getCellValue = (col, row) => {
    let val = '';
    // If a render function is provided, use it
    if (col.render) val = col.render(row);
    // If a cell function is provided (MyRatingsPage convention), use it
    else if (col.cell) val = col.cell(row);
    // If accessor is a function (MoviesPage/RatingsPage convention), call it
    else if (typeof col.accessor === 'function') val = col.accessor(row);
    // If accessor is a string, use it as key
    else if (typeof col.accessor === 'string') val = row[col.accessor];
    // If key is provided, use it
    else if (col.key) val = row[col.key];

    if (Array.isArray(val)) {
      return val.join(', ');
    }
    return val ?? '';
  };

  return (
    <div className="overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-100 text-surface-600 uppercase text-xs font-semibold border-b border-surface-200">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3">{getHeader(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <LoadingSpinner message="Loading data..." size="md" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-surface-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-surface-50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-3 text-surface-700">
                      {getCellValue(col, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.pages > 1 && (
        <div className="border-t border-surface-200 px-6 py-4 flex items-center justify-between bg-surface-50">
          <span className="text-sm text-surface-500">
            Showing page <span className="font-medium text-surface-800">{pagination.page}</span> of <span className="font-medium text-surface-800">{pagination.pages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-surface-200 text-surface-600 hover:text-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 rounded-lg bg-surface-200 text-surface-600 hover:text-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
