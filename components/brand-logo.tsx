import Image, { type StaticImageData } from "next/image";
import blackLarge from "@/components/icons/Website logo — Large — 360 × 240@2x.png";
import blackMedium from "@/components/icons/Website logo — Medium — 240 × 160@2x.png";
import blackSmall from "@/components/icons/Website logo — Small — 120 × 80@2x.png";
import whiteLarge from "@/components/icons/Website logo — White — Large — 360 × 241@2x.png";
import whiteMedium from "@/components/icons/Website logo — White — Medium — 240 × 161@2x.png";
import whiteSmall from "@/components/icons/Website logo — White — Small — 120 × 81@2x.png";

type LogoSize = "small" | "medium" | "large";

const dimensions: Record<LogoSize, { width: number; height: number }> = {
  small: { width: 60, height: 40 },
  medium: { width: 120, height: 80 },
  large: { width: 180, height: 120 },
};

const themeSources: Record<LogoSize, { light: StaticImageData; dark: StaticImageData }> = {
  small: { light: blackSmall, dark: whiteSmall },
  medium: { light: blackMedium, dark: whiteMedium },
  large: { light: blackLarge, dark: whiteLarge },
};

export function BrandLogo({
  size = "medium",
  className = "",
}: {
  size?: LogoSize;
  className?: string;
}) {
  const { width, height } = dimensions[size];

  return (
    <span className={`brand-logo ${className}`} aria-label="Miha Plemenitas logo">
      <Image
        src={themeSources[size].light}
        alt="Miha Plemenitas logo"
        width={width}
        height={height}
        className="brand-logo-image brand-logo-light"
        unoptimized
        priority={size === "large"}
      />
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
    </span>
  );
}
