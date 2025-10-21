export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">Election Comment Analyzer</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
