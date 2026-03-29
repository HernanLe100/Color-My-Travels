import { useState, useEffect } from "react";

export default function CitySearch({ onSelect }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.length < 3) return;

    const timeout = setTimeout(async () => {
      const res = await fetch(
        `http://localhost:5001/search?q=${query}`
      );
      const data = await res.json();
      setResults(data);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="w-80">
      <input
        className="w-full border p-2 rounded"
        placeholder="Search city..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.length > 0 && (
        <div className="bg-white border mt-1 rounded shadow max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(r);
                setResults([]);
                setQuery("");
              }}
            >
              {r.city}, {r.state}, {r.country}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}