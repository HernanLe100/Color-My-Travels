import { useState, useEffect } from "react";
import type { Color } from "@/types";
import toast from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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

    toast.success("Color updated successfully");
  };

  return (
    <div>
      <h1 className="text-lg font-bold px-4 pt-4">Edit Colors</h1>
      <div className="px-4 pt-4 flex flex-col gap-2 max-w-lg">
        {colors.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg border 
                     hover:bg-slate-50 transition cursor-pointer group"
          >
            <span className="text-sm font-medium">{row.region_code}</span>

            <div className="flex items-center gap-3 group">
              <div className="relative">
                <input
                  type="color"
                  value={row.color}
                  onBlur={(e) =>
                    handleColorChange(
                      row.region_code,
                      e.target.value,
                      row.region_type,
                    )
                  }
                  className="w-10 h-10 rounded-md border shadow cursor-pointer"
                />

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center
             rounded-md bg-black/10 text-white text-xs font-medium
             opacity-0 group-hover:opacity-100 transition
             pointer-events-none"
                >
                  Edit
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
