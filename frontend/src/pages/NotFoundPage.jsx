import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block text-blue-600 hover:text-blue-500"
        >
          Go back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

