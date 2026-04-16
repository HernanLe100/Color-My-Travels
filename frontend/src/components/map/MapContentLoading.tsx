export default function MapContentLoading() {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        <p className="text-sm text-gray-600">Loading your travels...</p>
      </div>
    </div>
  );
}
