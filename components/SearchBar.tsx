import React, { useState } from 'react';

interface SearchBarProps {
  onAdd: (symbol: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onAdd, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAdd(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto mb-12">
      <div className="relative flex items-center bg-zen-card/50 backdrop-blur-xl rounded-full border border-white/10 focus-within:border-zen-green/50 focus-within:shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all duration-300 overflow-hidden">
        <span className="pl-6 text-gray-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search asset..."
          className="w-full bg-transparent text-white px-4 py-3 text-sm font-light focus:outline-none placeholder-gray-600"
          disabled={isLoading}
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 text-xs font-medium text-gray-400 hover:text-white transition-colors border-l border-white/5"
        >
          {isLoading ? '...' : 'ADD'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;