import { Shell } from "@/components/Shell";

export default function ControlLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <Shell>{children}</Shell>;
}
