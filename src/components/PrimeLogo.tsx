import { cn } from "@/lib/utils.ts";

export default function PrimeLogo({
  className,
  alt = "PRIME",
}: {
  className?: string;
  alt?: string;
  src?: string;
}) {
  return (
    <div
      className={cn("inline-flex items-center select-none", className)}
      role="img"
      aria-label={alt}
    >
      <svg
        viewBox="0 0 360 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto max-h-full"
      >
        {/* P - Futuristic Geometric */}
        <path
          d="M5 55V5H42C53 5 60 12 60 23C60 34 53 41 42 41H20V55H5ZM20 28H40C44 28 46 26 46 23C46 20 44 18 40 18H20V28Z"
          fill="currentColor"
          className="text-black"
        />
        {/* R - Futuristic Geometric */}
        <path
          d="M75 55V5H112C123 5 130 12 130 23C130 31 125 37 116 39L132 55H114L100 41H90V55H75ZM90 28H110C114 28 116 26 116 23C116 20 114 18 110 18H90V28Z"
          fill="currentColor"
          className="text-black"
        />
        {/* I - Pillar */}
        <path
          d="M148 55V5H163V55H148Z"
          fill="currentColor"
          className="text-black"
        />
        {/* M - Geometric Wide Apex */}
        <path
          d="M180 55V5H196L214 36L232 5H248V55H233V22L217 50H211L195 22V55H180Z"
          fill="currentColor"
          className="text-black"
        />
        {/* E - Three Clean Parallel Horizontal Bars */}
        <g fill="currentColor" className="text-black">
          <rect x="268" y="5" width="58" height="12" rx="1.5" />
          <rect x="268" y="24" width="58" height="12" rx="1.5" />
          <rect x="268" y="43" width="58" height="12" rx="1.5" />
        </g>
      </svg>
    </div>
  );
}
