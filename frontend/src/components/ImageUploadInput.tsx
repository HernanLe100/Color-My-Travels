import { useRef } from "react";

type Props = {
  onFilesAdded: (files: File[]) => void;
  multiple?: boolean;
  className?: string;
  label?: string;
  sublabel?: string;
};

export default function ImageUploadInput({
  onFilesAdded,
  multiple = true,
  className = "",
  label = "Click to upload or drag & drop",
  sublabel = "PNG, JPG, GIF",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    onFilesAdded(fileArray);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center
        w-full h-32 border-2 border-dashed border-gray-300
        rounded-xl cursor-pointer
        hover:border-gray-400 hover:bg-gray-50
        transition ${className}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-xs text-gray-400 mt-1">{sublabel}</span>

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