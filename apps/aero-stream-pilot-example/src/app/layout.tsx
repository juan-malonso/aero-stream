export const metadata = {
  title: 'AeroStream Pilot Frontend',
  description: 'Conectando con Aero-Stream Tower vía WebSocket',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}