export default function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#FEF9F1]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F3E9DC] border-t-[#2A81CB]" />
        <p className="text-sm font-serif text-[#5E3023]">{message}</p>
      </div>
    </div>
  );
}
