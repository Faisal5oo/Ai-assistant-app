"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * @param {{
 *   name?: string;
 *   avatar?: string;
 *   fill?: boolean;
 *   sizes?: string;
 *   width?: number;
 *   height?: number;
 *   className?: string;
 *   fallbackClassName?: string;
 * }} props
 */
export function UserAvatar({
  name,
  avatar,
  fill = false,
  sizes,
  width = 44,
  height = 44,
  className = "h-11 w-11 rounded-full object-cover",
  fallbackClassName,
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();
  const showImage = Boolean(avatar) && !failed;

  if (showImage) {
    return (
      <Image
        src={avatar}
        alt={name ? `${name}'s profile` : "Profile"}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        className={className}
        unoptimized
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  const fallbackClasses =
    fallbackClassName ??
    "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold text-sm font-semibold text-charcoal";

  return (
    <div className={fallbackClasses} aria-hidden="true">
      {initial}
    </div>
  );
}
