import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';

export default function AddressSearchBox({ onSelect, placeholder = 'Search a location...', value = '' }) {
  const [query, setQuery]             = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]     = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&countrycodes=pk`,
          { headers: { 'User-Agent': 'RideBoard/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function handleSelect(item) {
    setQuery(item.display_name);
    setSuggestions([]);
    onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: item.display_name });
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-10 bg-card border-border text-white placeholder:text-muted-foreground focus:ring-primary"
          autoComplete="off"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-[1000] mt-2 bg-card border border-border rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => handleSelect(s)}
                className="flex items-start gap-3 p-3 cursor-pointer text-sm text-foreground hover:bg-muted hover:text-white transition-colors border-b border-border last:border-0"
              >
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span className="line-clamp-2">{s.display_name}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
