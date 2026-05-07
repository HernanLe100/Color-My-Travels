import { useRef } from "react";
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
  className = "",
  label = "Click to upload or drag and drop image(s) here",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const all = Array.from(files);
    const hasNonImage = all.some((f) => !f.type.startsWith("image/"));
    onError?.(hasNonImage ? "Files must be images" : null);
    const imageFiles = all.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length) onFilesAdded(imageFiles);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center
        w-full h-32 border-2 border-dashed border-neutral-200
        rounded-xl cursor-pointer
        hover:border-neutral-400 hover:bg-white bg-white
        transition ${className}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <ImagePlus className="w-6 h-6 text-neutral-400 mb-1" />
      <span className="text-sm font-serif text-neutral-500">{label}</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}