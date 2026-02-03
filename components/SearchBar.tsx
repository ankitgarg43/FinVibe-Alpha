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
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto mb-12 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-neon-pink rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex items-center bg-black rounded-2xl border border-white/10 overflow-hidden">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ticker, coin, or vibes (e.g. BTC, NVDA, USD to CAD)..."
          className="w-full bg-transparent text-white px-6 py-4 text-lg font-mono focus:outline-none placeholder-gray-600"
          disabled={isLoading}
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="px-8 py-4 bg-white text-black font-bold hover:bg-neon-green transition-colors disabled:bg-gray-700 disabled:text-gray-400"
        >
          {isLoading ? 'COOKING...' : 'ADD'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;