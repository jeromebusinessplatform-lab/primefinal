import { useEffect, useState } from "react";
import PrimeLogo from "@/components/PrimeLogo.tsx";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function ShopHeader() {
  const now = useLiveClock();
  const day = String(now.getDate()).padStart(2, "0");
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  let rawHours = now.getHours();
  const ampm = rawHours >= 12 ? "PM" : "AM";
  rawHours = rawHours % 12;
  rawHours = rawHours ? rawHours : 12;
  const hours = String(rawHours).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const dateStr = `${day}-${month}-${year}`;
  const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;

  return (
    <header className="bg-white px-3.5 py-2.5 flex items-center justify-between border-b border-neutral-100">
      <div className="flex items-center">
        <PrimeLogo className="h-7" />
      </div>
      <div className="text-right">
        <div
          className="text-black font-normal leading-none tracking-tight text-center"
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: "12px",
            letterSpacing: "0.2px",
          }}
        >
          {dateStr} | {timeStr}
        </div>
        <div
          className="font-normal leading-none mt-1 uppercase"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "13px",
            letterSpacing: "0.5px",
            color: "#052103",
          }}
        >
          SECURED CUSTOMER ACCESS
        </div>
      </div>
    </header>
  );
}
