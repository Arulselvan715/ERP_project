import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, User as UserIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const Login = () => {
  const { login, registerUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Redirect target after login
  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isRegistering) {
        await registerUser({
          username: data.username,
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
        });
        addToast('Registration successful! Please sign in with your new account.', 'success');
        setIsRegistering(false);
        reset();
      } else {
        await login(data.email, data.password);
        addToast('Login successful! Welcome to Shiv ERP.', 'success');
        navigate(from, { replace: true });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Invalid email or password. Please try again.';
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none"></div>

      {/* Glassmorphic Login Container */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 font-extrabold text-2xl text-white shadow-lg shadow-violet-500/30">
            S
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            {isRegistering ? 'Create an Account' : 'Shiv Furniture Works'}
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            {isRegistering ? 'Register a new Sales or Purchase account' : 'Mini ERP — Sign in to manage your system'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {isRegistering && (
              <>
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <UserIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      className={`block w-full rounded-2xl border ${errors.username ? 'border-rose-500' : 'border-white/10'} bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all`}
                      placeholder="johndoe"
                      {...register('username', {
                        required: 'Username is required',
                        minLength: { value: 3, message: 'Username must be at least 3 characters' },
                      })}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1.5 text-xs text-rose-400 font-semibold">{errors.username.message}</p>
                  )}
                </div>

                {/* First & Last Name Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      className={`block w-full rounded-2xl border ${errors.first_name ? 'border-rose-500' : 'border-white/10'} bg-white/5 py-3 px-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all`}
                      placeholder="John"
                      {...register('first_name', { required: 'Required' })}
                    />
                    {errors.first_name && (
                      <p className="mt-1.5 text-xs text-rose-400 font-semibold">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      className={`block w-full rounded-2xl border ${errors.last_name ? 'border-rose-500' : 'border-white/10'} bg-white/5 py-3 px-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all`}
                      placeholder="Doe"
                      {...register('last_name', { required: 'Required' })}
                    />
                    {errors.last_name && (
                      <p className="mt-1.5 text-xs text-rose-400 font-semibold">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full rounded-2xl border ${errors.email ? 'border-rose-500' : 'border-white/10'} bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all`}
                  placeholder="name@company.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-400 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  className={`block w-full rounded-2xl border ${errors.password ? 'border-rose-500' : 'border-white/10'} bg-white/5 py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 4, message: 'Password must be at least 4 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400 font-semibold">{errors.password.message}</p>
              )}
            </div>

            {isRegistering && (
              /* Role Field */
              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <ShieldAlert className="h-5 w-5 text-slate-500" />
                  </div>
                  <select
                    id="role"
                    className="block w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer appearance-none"
                    {...register('role', { required: 'Role is required' })}
                  >
                    <option value="Sales User">Sales User</option>
                    <option value="Purchase User">Purchase User</option>
                  </select>
                </div>
                {errors.role && (
                  <p className="mt-1.5 text-xs text-rose-400 font-semibold">{errors.role.message}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center items-center gap-2 rounded-2xl bg-violet-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg hover:bg-violet-750 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-violet-500/25"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isRegistering ? 'Registering...' : 'Signing in...'}
                </>
              ) : (
                isRegistering ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  reset();
                }}
                className="font-semibold text-violet-400 hover:text-violet-300 transition-colors hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  reset();
                }}
                className="font-semibold text-violet-400 hover:text-violet-300 transition-colors hover:underline cursor-pointer"
              >
                Sign Up for Sales/Purchase
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
