import { useState, useEffect } from "react";
import type { SearchLocation } from "@/types";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function CitySearch({
  onSelect,
  isRequired,
  onQueryChange,
}: {
  onSelect: (location: SearchLocation) => void;
  isRequired: boolean;
  onQueryChange?: (q: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchLocation[]>([]);

  useEffect(() => {
    if (query.length < 3) return;

    const timeout = setTimeout(async () => {
      const res = await fetch(`${BACKEND_URL}/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city-search" className="flex gap-0 text-black">
          City<span className="text-xs text-red-600">*</span>
        </Label>
        <Input
          className="bg-white"
          required={isRequired}
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onQueryChange?.(e.target.value);
          }}
        />
      </div>

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
