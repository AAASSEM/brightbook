export default function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12", xl: "h-16 w-16" };
  return (
    <div className={`animate-spin rounded-full border-2 border-[#becab9] border-t-[#4caf50] ${sizes[size]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen soft-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-[#3f4a3c] text-sm font-bold animate-pulse" style={{ fontFamily: "Lexend, sans-serif" }}>
          Loading BrightBook…
        </p>
      </div>
    </div>
  );
}
