import Image from "next/image";

type LogoSize = "small" | "medium" | "large";

const dimensions: Record<LogoSize, { width: number; height: number }> = {
  small: { width: 60, height: 40 },
  medium: { width: 120, height: 80 },
  large: { width: 180, height: 120 },
};

const themeSources: Record<LogoSize, { light: string; dark: string }> = {
  small: { light: "/brand/miha-logo-light-small.png", dark: "/brand/miha-logo-dark-small.png" },
  medium: { light: "/brand/miha-logo-light-medium.png", dark: "/brand/miha-logo-dark-medium.png" },
  large: { light: "/brand/miha-logo-light-large.png", dark: "/brand/miha-logo-dark-large.png" },
};

export function BrandLogo({
  size = "medium",
  className = "",
  theme = "auto",
}: {
  size?: LogoSize;
  className?: string;
  theme?: "auto" | "light";
}) {
  const { width, height } = dimensions[size];

  return (
    <span className={`brand-logo ${className}`} aria-label="Miha Plemenitas logo">
      <Image
        src={themeSources[size].light}
        alt="Miha Plemenitas logo"
        width={width}
        height={height}
        className={`brand-logo-image${theme === "auto" ? " brand-logo-light" : ""}`}
        unoptimized
        priority={size === "large"}
      />
      {theme === "auto" && (
        <Image
          src={themeSources[size].dark}
          alt=""
          width={width}
          height={height}
          className="brand-logo-image brand-logo-dark"
          aria-hidden="true"
          unoptimized
          priority={size === "large"}
        />
      )}
    </span>
  );
}
