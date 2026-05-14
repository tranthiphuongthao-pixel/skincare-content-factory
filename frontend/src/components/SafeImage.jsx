import { useState } from "react";

/**
 * Image with graceful fallback when src is missing or 404s.
 * Used for product images that may have been wiped on Railway redeploy
 * (ephemeral container filesystem) — instead of broken alt text, show fallback.
 */
export default function SafeImage({ src, alt = "", className = "", fallback, fallbackClassName = "" }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={`${className} ${fallbackClassName} flex items-center justify-center`}>
        {fallback ?? <span className="text-3xl opacity-60">✨</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}
