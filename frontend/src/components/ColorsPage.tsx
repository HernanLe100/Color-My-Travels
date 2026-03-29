import { useState, useMemo, useEffect } from "react";

// TODO: create seperate file to store types
type Color = {
  color: string;
  user_id: string;
  location_id: string;
  adm: string;
};

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const testUser = "0000";
  // TODO: extract from database instead of hardcoding
  const points = useMemo(
    () => [
      { id: 1, lat: 40.343, lng: -74.651, country: "USA", adm1: "US-NJ" },
      { id: 2, lat: 48.8566, lng: 2.3522, country: "FRA", adm1: "FR-IDF" },
    ],
    [],
  );
  useEffect(() => {
    fetch(`http://localhost:5001/get_colors?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setColors(data.db_response);
      });
  }, []);

  const handleColorChange = (location_id: number, color: string, adm: string) => {
    fetch("http://localhost:5001/update_color", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: testUser, location_id: location_id, color: color, adm: adm }),
    });
    setColors((prev) =>
      prev.map((row) => Number(row.location_id) === location_id && row.adm === adm && row.user_id === testUser ? { ...row, color } : row)
    );
  };


  return (
    <div>
      <h1 className="text-lg font-bold px-4 pt-4">
        Colors
      </h1>
      <div className="px-4 pt-4">
        {colors?.map((row, i) => (
          <div key={i}>{(() => { const p = points.find((p) => p.id === Number(row.location_id)); 
          return row.adm === "country" ? p?.country : p?.adm1; })()}: 
          <input
            type="color"
            value={row.color}
            onChange={(e) => handleColorChange(row.location_id, e.target.value, row.adm)}
          />
          </div>
        ))}
      </div>
    </div>
  );
}
