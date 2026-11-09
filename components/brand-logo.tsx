import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";

function isOptimizedImage(src: string) {
  return src.startsWith("/") || src.includes("images.unsplash.com");
}

export function BrandLogo({
  onDark = false,
  className = "",
  priority = false,
  src = "/tncnc-logo.png",
  alt = "TNCNC",
}: {
  onDark?: boolean;
  className?: string;
  priority?: boolean;
  src?: string;
  alt?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${
        onDark ? "rounded-md bg-white px-2 py-1" : ""
      } ${className}`}
    >
      <Image
        src={mediaUrl(src)}
        alt={alt}
        width={220}
        height={56}
        priority={priority}
        unoptimized={!isOptimizedImage(mediaUrl(src))}
        className="h-8 w-auto sm:h-9"
      />
    </span>
  );
}
