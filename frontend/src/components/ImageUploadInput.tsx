import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type Props = {
  onFilesAdded: (files: File[]) => void;
  onError?: (msg: string | null) => void;
  multiple?: boolean;
  className?: string;
  label?: string;
  sublabel?: string;
};

export default function ImageUploadInput({
  onFilesAdded,
  onError,
  multiple = true,
  className = "",
  label = "Click to upload or drag and drop image(s) here",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_SIZE = 10 * 1024 * 1024;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const all = Array.from(files);
    const hasNonImage = all.some((f) => !f.type.startsWith("image/"));
    if (hasNonImage) { onError?.("Files must be images"); return; }
    const valid = all.filter((f) => f.size <= MAX_SIZE);
    const skipped = all.length - valid.length;
    if (skipped > 0) {
      onError?.(`Image${skipped > 1 ? "s" : ""} exceeding 10 MB ${skipped > 1 ? "were" : "was"} not uploaded`);
    } else {
      onError?.(null);
    }
    if (valid.length) onFilesAdded(valid);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center
        w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${className}
        ${isDragging ? "bg-[#F3E9DC]" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <ImagePlus className="w-6 h-6 text-neutral-400 mb-1" />
      <span className="text-sm font-serif text-neutral-500">{label}</span>
      <span className="text-xs font-serif text-neutral-400 mt-0.5">Max 10 MB per image</span>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}