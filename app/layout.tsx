import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Payment Simulator",
  description: "Payment Simulator App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}