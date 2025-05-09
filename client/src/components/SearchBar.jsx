import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative w-full max-w-xl mb-6 mx-auto group">
      <Search
        className="absolute top-2.5 left-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
        size={18}
      />
      <Input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search posts by content or author..."
        className="pl-10 pr-10 py-2 text-sm rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500 transition-all duration-200"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
