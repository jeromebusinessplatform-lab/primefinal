import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-4">
      <div className="text-center space-y-4 max-w-sm bg-white p-8 rounded-2xl border border-neutral-200 shadow-xs">
        <h1 className="text-6xl font-bold text-neutral-400">404</h1>
        <h2
          className="text-xl font-normal text-black uppercase"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          Page Not Found
        </h2>
        <p className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          The path <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">{location.pathname}</code> does not exist in PRIME.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link to="/shop">Return to Shop</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
