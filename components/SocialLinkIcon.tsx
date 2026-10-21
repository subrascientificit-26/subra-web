import Image from "next/image";
import { Link2 } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

const BRAND_ICONS: Record<string, typeof FaLinkedin> = {
  linkedin: FaLinkedin,
  facebook: FaFacebook,
  twitter: FaTwitter,
  youtube: FaYoutube,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
};

function isImageIcon(icon: string): boolean {
  const value = icon.trim();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  );
}

type SocialLinkIconProps = {
  icon: string;
  label: string;
  size?: number;
  className?: string;
};

export default function SocialLinkIcon({
  icon,
  label,
  size = 15,
  className = "",
}: SocialLinkIconProps) {
  const iconValue = icon.trim();

  if (isImageIcon(iconValue)) {
    return (
      <Image
        src={iconValue}
        alt=""
        width={size}
        height={size}
        className={`object-contain ${className}`}
        unoptimized
      />
    );
  }

  const brandKey = (iconValue || label).trim().toLowerCase();
  const BrandIcon = BRAND_ICONS[brandKey];
  if (BrandIcon) {
    return <BrandIcon size={size} className={className} aria-hidden />;
  }

  return <Link2 size={size} className={className} aria-hidden />;
}
