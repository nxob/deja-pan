import "./globals.css";

export const metadata = {
  title: "Deja Pan, use what you own",
  description: "A small project pan app for using makeup you already own before buying more.",
  applicationName: "Deja Pan",
  appleWebApp: {
    capable: true,
    title: "Deja Pan",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
