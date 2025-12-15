import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    const result = await login(data);

    if (result.success) {
      navigate('/dashboard');
    } else {
      const errorData = result.error;
      
      // Show general error message
      if (errorData.message) {
        setError(errorData.message);
      }

      // Set field-level errors
      if (errorData.errors) {
        Object.keys(errorData.errors).forEach((field) => {
          setFormError(field, {
            type: 'server',
            message: errorData.errors[field],
          });
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4">💼</div>
            <h1 className="text-3xl font-bold text-white">JobTracker</h1>
            <p className="text-blue-200">Sign in to track your applications</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && <ErrorAlert message={error} />}
            
            <div className="space-y-5">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
              {...register('password')}
            />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-lg">
              {isSubmitting ? '🔄 Signing in...' : '🔐 Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
            <div className="relative text-center p-4">
              <p className="text-sm text-blue-200">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-white hover:text-blue-100 underline transition">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

