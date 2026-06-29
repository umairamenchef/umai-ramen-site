import '../globals.css';

export const metadata = {
  title: 'Umaï IG Studio',
  robots: { index: false, follow: false },
};

export default function IgStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
