import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const LOGOS = [
  { src: "/payments/visa.svg", alt: "Visa", ratio: 2501 / 1384, key: "visa" },
  { src: "/payments/mastercard.svg", alt: "Mastercard", ratio: 2501 / 1384, key: "mastercard" },
  { src: "/payments/pci-dss.svg", alt: "PCI DSS compliant", ratio: 2501 / 1384, key: "pci" },
] as const;

export interface PaymentLogosProps {
  height?: 20 | 24 | 28;
  withPci?: boolean;
  strip?: boolean;
  className?: string;
}

export function PaymentLogos({ height = 28, withPci = true, strip = false, className }: PaymentLogosProps) {
  const logos = withPci ? LOGOS : LOGOS.filter((l) => l.key !== "pci");
  return (
    <ul aria-label="Accepted payments" data-logo-strip={strip ? "" : undefined} className={cn("m-0 flex list-none flex-wrap items-center gap-3 p-0", strip && "w-fit shrink-0 flex-nowrap bg-logo-strip px-3 py-2", className)}>
      {logos.map((logo) => (
        <li key={logo.key} className="flex">
          <Image src={logo.src} alt={logo.alt} width={Math.round(height * logo.ratio)} height={height} unoptimized className="block w-auto" style={{ height }} />
        </li>
      ))}
    </ul>
  );
}
