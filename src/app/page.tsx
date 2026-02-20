import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-4xl font-bold text-gray-900">Track & Field Tryouts</h1>
        <p className="text-lg text-gray-600">Welcome to the tryouts management system</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Register as Athlete
          </Link>
          <Link
            href="/results"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            View Live Results
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
