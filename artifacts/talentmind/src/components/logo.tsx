interface LogoProps {
  size?: number;
  className?: string;
}

export function TalentMindLogo({ size = 32, className = "" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="TalentMind AI"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
