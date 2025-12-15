import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const stats = [
  { label: 'Total Jobs', value: '24' },
  { label: 'Interviews', value: '6' },
  { label: 'Offers', value: '2' },
  { label: 'Rejected', value: '5' },
];

const recentApplications = [
  { company: 'Google', role: 'Software Engineer', status: 'Applied' },
  { company: 'Amazon', role: 'Frontend Developer', status: 'Interview' },
  { company: 'Stripe', role: 'Full-Stack Engineer', status: 'Offer' },
];

function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
        <Link to="/" className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          💼 Job Tracker
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-blue-200 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition"
              >
                Get Started
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition"
            >
              Go to Dashboard
            </Link>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-widest text-blue-300 font-bold">
                ✨ Smart job management
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Track all your job applications in one powerful dashboard
              </h1>
              <p className="text-lg text-blue-100">
                Stay organized with a clear view of every application, upload resumes to
                Cloudinary, and keep tabs on interviews, offers, and rejections at a glance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    🚀 Create free account
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold text-white bg-white/10 border border-white/20 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all duration-300"
                  >
                    🔐 Login
                  </Link>
                </>
              ) : (
                <Link
                  to="/jobs"
                  className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1"
                >
                  📊 View My Jobs
                </Link>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="p-5 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                <p className="font-bold text-white">📋 Job tracking</p>
                <p className="mt-2 text-blue-100">Stay on top of every application.</p>
              </div>
              <div className="p-5 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                <p className="font-bold text-white">📤 Resume uploads</p>
                <p className="mt-2 text-blue-100">Store resumes securely with Cloudinary.</p>
              </div>
              <div className="p-5 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                <p className="font-bold text-white">📈 Simple stats</p>
                <p className="mt-2 text-blue-100">Know your pipeline at a glance.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Overview</p>
                  <h3 className="text-2xl font-bold text-white">Your pipeline</h3>
                </div>
                <span className="px-3 py-1 text-xs font-bold bg-purple-500/30 text-purple-200 rounded-full border border-purple-400/50">
                  Demo preview
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="p-4 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/30 rounded-xl text-center hover:from-blue-500/50 hover:to-purple-500/50 transition"
                  >
                    <p className="text-xs text-blue-200 font-bold">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">Recent applications</h4>
                  <span className="text-xs text-blue-200">Last 7 days</span>
                </div>
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div
                      key={`${app.company}-${app.role}`}
                      className="flex items-center justify-between p-4 bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{app.company}</p>
                        <p className="text-xs text-blue-200">{app.role}</p>
                      </div>
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/30 px-3 py-1 rounded-full border border-purple-400/50">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 sm:mt-24">
          <div className="text-center space-y-4">
            <p className="text-sm uppercase tracking-widest text-blue-300 font-bold">
              🎯 Built for your search
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Everything you need to stay organized
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto text-lg">
              From first application to final offer, Job Tracker keeps your pipeline tidy and your
              documents ready with a clean, focused dashboard.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-md rounded-2xl hover:from-white/20 hover:to-white/10 transition space-y-3">
              <h3 className="text-lg font-bold text-white">📋 Job tracking</h3>
              <p className="text-blue-100">
                Add roles, set statuses, and never lose track of where you are in the process.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-md rounded-2xl hover:from-white/20 hover:to-white/10 transition space-y-3">
              <h3 className="text-lg font-bold text-white">📤 Resume uploads</h3>
              <p className="text-blue-100">
                Keep your resumes in one place with secure Cloudinary-backed uploads.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-md rounded-2xl hover:from-white/20 hover:to-white/10 transition space-y-3">
              <h3 className="text-lg font-bold text-white">📈 Simple stats & progress</h3>
              <p className="text-blue-100">
                See totals, interviews, offers, and rejections instantly so you know what to do next.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-blue-200">
          💼 Job Tracker · Your personal placement companion · Built with ❤️
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

