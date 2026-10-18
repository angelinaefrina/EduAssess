import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface ArahInBrandProps {
  /**
   * "full": Icon mark + two-tone text
   * "text-only": Two-tone text without icon
   * "icon-only": Icon mark only
   * "horizontal-img": Direct crisp PNG of mark + text
   */
  variant?: "full" | "text-only" | "icon-only" | "horizontal-img";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  badge?: string;
  slogan?: string;
  school?: string;
  className?: string;
  textClassName?: string;
  priority?: boolean;
}

export function ArahInText({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeStyles = {
    sm: { fontSize: "16px", lineHeight: "20px" },
    md: { fontSize: "20px", lineHeight: "24px" },
    lg: { fontSize: "26px", lineHeight: "32px" },
    xl: { fontSize: "34px", lineHeight: "40px" },
  }[size];

  return (
    <span
      className={`brand-arahin ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        ...sizeStyles,
      }}
    >
      <span style={{ color: "#06124D" }}>Arah</span>
      <span style={{ color: "#1386E8" }}>In</span>
    </span>
  );
}

export default function ArahInBrand({
  variant = "full",
  size = "md",
  href,
  badge,
  slogan,
  school,
  className = "",
  textClassName = "",
  priority = false,
}: ArahInBrandProps) {
  const iconSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 42, height: 42 },
    xl: { width: 52, height: 52 },
  }[size];

  const content = (
    <div
      className={`arahin-brand-container ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: slogan || school ? "column" : "row",
        alignItems: slogan || school ? "flex-start" : "center",
        gap: slogan || school ? "3px" : "10px",
        textDecoration: "none",
      }}
    >
      {variant === "horizontal-img" ? (
        <div style={{ display: "inline-flex", alignItems: "center" }}>
          <Image
            src="/images/logo-brand-horizontal.png"
            alt="ArahIn"
            width={iconSizes.width * 3.7}
            height={iconSizes.height}
            style={{ objectFit: "contain", height: iconSizes.height, width: "auto" }}
            priority={priority}
          />
          {badge && (
            <span
              style={{
                marginLeft: "8px",
                padding: "2px 7px",
                borderRadius: "9999px",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                background: "#DCE9FF",
                color: "#006190",
              }}
            >
              {badge}
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            gap: size === "sm" ? "8px" : "10px",
          }}
        >
          {variant !== "text-only" && (
            <div
              style={{
                width: iconSizes.width,
                height: iconSizes.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Image
                src="/images/logo-tight.png"
                alt="ArahIn Logo"
                width={iconSizes.width}
                height={iconSizes.height}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                priority={priority}
              />
            </div>
          )}

          {variant !== "icon-only" && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArahInText size={size} className={textClassName} />
              {badge && (
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: "9999px",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    background: "#DCE9FF",
                    color: "#006190",
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {slogan && (
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            lineHeight: "14px",
            letterSpacing: "0.3px",
            color: "#64748B",
            marginTop: "1px",
          }}
        >
          {slogan}
        </span>
      )}

      {school && (
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            lineHeight: "14px",
            letterSpacing: "0.2px",
            color: "#6F7881",
            marginTop: "1px",
          }}
        >
          {school}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return content;
}
