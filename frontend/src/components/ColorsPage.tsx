import { useState, useEffect } from "react";
import type { Color } from "@/types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch(`${BACKEND_URL}/get_colors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setColors(data.db_response);
      });
  }, [token]);

  const handleColorChange = (
    region_code: string,
    color: string,
    region_type: string,
  ) => {
    if (!token) return;

    fetch(`${BACKEND_URL}/update_color`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        region_code,
        color,
        region_type,
      }),
    });

    setColors((prev) =>
      prev.map((row) =>
        row.region_code === region_code && row.region_type === region_type
          ? { ...row, color }
          : row,
      ),
    );
  };

  return (
    <div>
      <h1 className="text-lg font-bold px-4 pt-4">Edit Colors</h1>
      <div className="px-4 pt-4">
        {colors.map((row, i) => (
          <div key={i}>
            {row.region_code}:
            <input
              type="color"
              value={row.color}
              onChange={(e) =>
                handleColorChange(
                  row.region_code,
                  e.target.value,
                  row.region_type,
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
