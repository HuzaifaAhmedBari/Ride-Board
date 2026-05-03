import { useState, useRef, useEffect } from 'react';

// Props:
//   onSelect    — called with { lat, lng, address } when user picks a suggestion
//   placeholder — input placeholder text
//   value       — external value to sync with
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
    <div className="address-search-box">
      <div className="address-search-input-wrap">
        <span className="address-search-icon">🔍</span>
        <input
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="address-search-input"
          autoComplete="off"
        />
        {searching && <span className="address-search-spinner">⏳</span>}
      </div>
      {suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s)}
              className="address-suggestion-item"
            >
              📍 {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
