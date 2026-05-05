import './globals.css';

export const metadata = {
  title: 'TruthLayer — AI Fact Checker',
  description: 'Upload a PDF and verify every claim against live web data. Powered by Claude AI.',
  keywords: 'fact checker, AI, PDF, verification, truth',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
