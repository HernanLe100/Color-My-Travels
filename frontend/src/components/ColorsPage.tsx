import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { Color } from "@/types";
import toast from "react-hot-toast";
import Loading from "./Loading";
import { apiFetch } from "@/lib/api";

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/get_colors")
      .then((res) => res.json())
      .then((data) => {
        console.log(data.db_response);
        setColors(data.db_response);
        setIsLoading(false);
      });
  }, []);

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

  const handleColorSave = async (
    region_code: string,
    newColor: string,
    region_type: string,
    prevColor: string,
  ) => {
    if (prevColor.toLowerCase() === newColor.toLowerCase()) return;

    try {
      const res = await apiFetch("/update_color", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ region_code, color: newColor, region_type }),
      });

      if (!res.ok) throw new Error();

      toast.success("Color updated successfully");
    } catch {
      setColors((prev) =>
        prev.map((row) =>
          row.region_code === region_code && row.region_type === region_type
            ? { ...row, color: prevColor }
            : row,
        ),
      );
      toast.error("Failed to update color");
    }
  };

  if (isLoading) return <Loading />;

  console.log(colors);

  return (
    <div className="min-h-screen w-full bg-[#FEF9F1]">
      <div className="mx-auto w-full max-w-lg md:mx-0 md:max-w-none px-6 py-6">
        <h1 className="text-lg font-bold mb-4 font-serif text-[#5E3023]">
          Edit Colors
        </h1>
        <div className="flex flex-col gap-2">
          {colors.map((row, i) => (
            <label
              key={i}
              htmlFor={`color-${i}`}
              className="flex items-center font-serif justify-between p-3 rounded-lg border bg-white
                     hover:bg-[#F3E9DC] text-[#5E3023] transition cursor-pointer group hover:border-[#895737]"
            >
              <span className="text-sm font-semibold">
                {row.display_name || row.region_code}
                {row.display_name && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({row.region_code})
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#895737] opacity-0 group-hover:opacity-100 transition" />
                <input
                  id={`color-${i}`}
                  type="color"
                  value={row.color}
                  onFocus={(e) => {
                    e.currentTarget.dataset.prev = row.color;
                  }}
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
                      e.currentTarget.dataset.prev ?? row.color,
                    )
                  }
                  className="w-10 h-10 cursor-pointer mr-0.5"
                />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
