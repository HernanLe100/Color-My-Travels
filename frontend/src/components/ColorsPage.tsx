import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { Color } from "@/types";
import toast from "react-hot-toast";
import Loading from "./Loading";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
      });
  }, [token]);

  const handleColorPreview = (
    region_code: string,
    color: string,
    region_type: string,
  ) => {
    setColors((prev) =>
      prev.map((row) =>
        row.region_code === region_code && row.region_type === region_type
          ? { ...row, color }
          : row,
      ),
    );
  };

  const handleColorSave = (
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
      body: JSON.stringify({ region_code, color, region_type }),
    });

    toast.success("Color updated successfully");
  };

  if (isLoading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-lg md:mx-0 md:max-w-none px-6 py-6">
      <h1 className="text-lg font-bold mb-4">Edit Colors</h1>
      <div className="flex flex-col gap-2">
        {colors.map((row, i) => (
          <label
            key={i}
            htmlFor={`color-${i}`}
            className="flex items-center justify-between p-3 rounded-lg border
                     hover:bg-slate-50 transition cursor-pointer group"
          >
            <span className="text-sm font-medium">{row.region_code}</span>

            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              <input
                id={`color-${i}`}
                type="color"
                value={row.color}
                onChange={(e) =>
                  handleColorPreview(
                    row.region_code,
                    e.target.value,
                    row.region_type,
                  )
                }
                onBlur={(e) =>
                  handleColorSave(
                    row.region_code,
                    e.target.value,
                    row.region_type,
                  )
                }
                className="w-10 h-10 rounded-md border shadow cursor-pointer"
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
