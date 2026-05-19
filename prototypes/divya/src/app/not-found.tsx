import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <p className="text-5xl mb-2">🛒</p>
      <h1 className="text-2xl font-bold text-green-700">Page not found</h1>
      <p className="text-gray-600 mt-2 text-center max-w-md text-sm">
        This URL is not part of the SmartShop prototype. If you are running <code className="font-mono">npm run dev</code>, open
        the exact <strong>Local:</strong> URL from your terminal (port <code className="font-mono">3030</code> by default).
      </p>
      <Link href="/" className="mt-6 text-green-600 font-semibold hover:underline">
        Go to home →
      </Link>
    </main>
  );
}
