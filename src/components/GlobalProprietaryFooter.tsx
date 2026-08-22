import { useLocation } from "react-router-dom";

export default function GlobalProprietaryFooter() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <footer
      id="global-proprietary-footer"
      className={`fixed bottom-0 left-0 right-0 z-[9999] bg-neutral-100 text-neutral-700 text-center py-3 px-2 border-t border-neutral-300 pointer-events-none select-none overflow-hidden w-full ${isAdmin ? "max-w-[900px]" : "max-w-[412px]"} mx-auto`}
    >
      <div
        className="w-full text-center text-[10px] sm:text-[11px] tracking-[0.16em] uppercase whitespace-nowrap overflow-hidden text-ellipsis leading-tight font-normal"
        style={{ fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 400 }}
      >
        USAGE OF THIS SYSTEM IS PROPRIETARY. DO NOT DISTRIBUTE OR COPY.
      </div>
    </footer>
  );
}
