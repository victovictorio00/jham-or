import type { Metadata } from "next";
import { CartProvider } from "@/components/shop";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://jhamor.purprum.com"),
  title: { default: "JHAM-OR · Muebles con alma", template: "%s | JHAM-OR" },
  description:
    "Muebles de diseño para crear espacios que se sienten propios. Explora nuestra colección de sala, comedor y dormitorio. Precios en soles.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
