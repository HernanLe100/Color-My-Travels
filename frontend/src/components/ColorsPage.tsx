import { useState, useEffect } from "react";
import type { Color } from "@/types";


const BACKEND_URL = "https://127.0.0.1:5001" //import.meta.env.BACKEND_URL

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  // TODO: grab the user from db
  const testUser = "0000";

  useEffect(() => {
    fetch(`${BACKEND_URL}/get_colors?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setColors(data.db_response);
      });
  }, []);

  const handleColorChange = (region_code: string, color: string, region_type: string) => {
    fetch(`${BACKEND_URL}/update_color`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: testUser, region_code: region_code, color: color, region_type: region_type }),
    });
    setColors((prev) =>
      prev.map((row) => row.region_code === region_code && row.region_type === region_type && row.user_id === testUser ? { ...row, color } : row)
    );
  };

  return (
    <div>
      <h1 className="text-lg font-bold px-4 pt-4">
        Edit Colors
      </h1>
      <div className="px-4 pt-4">
        {colors?.map((row, i) => {
          return (
            <div key={i}>
              {row.region_code}:
              <input
                type="color"
                value={row.color}
                onChange={(e) => handleColorChange(row.region_code, e.target.value, row.region_type)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
