export const metadata = {
  title: 'AeroStream Pilot Frontend',
  description: 'Connecting to Aero-Stream Tower via WebSocket',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}