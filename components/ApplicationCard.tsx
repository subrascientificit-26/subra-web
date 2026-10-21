import Link from "next/link";
import Image from "next/image";
import { LucideIcon } from "lucide-react";

interface ApplicationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  link: string;
}

export default function ApplicationCard({
  icon: Icon,
  title,
  description,
  image,
  link,
}: ApplicationCardProps) {
  return (
    <Link
      href={link}
      className="group block relative overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative h-40 overflow-hidden bg-surface-elevated sm:h-30">
        <Image
          src={image || "/noimage.jpg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/30" />

        <div className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/80 backdrop-blur-sm sm:h-7 sm:w-7">
          <Icon size={16} className="text-white" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {title}
        </h3>

        {/* <p className="mb-1 line-clamp-2 h-10 text-xs leading-5 text-muted sm:text-sm">
          {description}
        </p> */}

        <div className="inline-flex items-center text-sm font-medium text-primary">
          View Products
          <span className="ml-2 text-lg transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}