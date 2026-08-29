import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Drop the three court photos in your public/ folder at these paths
// (public/images/carousel/bb.jpg, bm.jpg, cricket.jpg), or update the
// src values below to wherever you keep them.
const slides = [
  { src: '/images/carousel/bb.jpg', alt: 'Basketball court at sunset' },
  { src: '/images/carousel/bm.jpg', alt: 'Indoor badminton courts' },
  { src: '/images/carousel/cricket.jpg', alt: 'Aerial view of the sports complex' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.code === 'ERR_NETWORK' || !error.response
            ? 'Cannot reach the API. Start the backend with npm run dev in iit-arena-hub/backend.'
            : 'Login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-950 font-sans text-neutral-200 antialiased selection:bg-primary-500/30 selection:text-white lg:flex-row">
      {/* Left visual panel */}
      <div className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-screen lg:w-1/2">
        <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl bg-gray-950">
          {slides.map((slide, index) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                index === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

          {/* Darken the photo so the headline stays readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-black/20" />

          {/* Fade towards the side of the login credentials/form panel */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-gray-950 md:w-40" />

          <div className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-12 text-center px-8">
            <h1 className="text-3xl font-medium tracking-tight text-white md:text-4xl lg:text-5xl font-display">
              Book courts faster.
              <br />
              Play more.
            </h1>
            <div className="mt-8 flex items-center justify-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slide ${index + 1}`}
                  className={`h-1 rounded-full transition-all ${
                    index === activeSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-600/30 lg:hidden">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl leading-tight font-medium tracking-tight text-white md:text-[40px] font-display">
              Welcome back to
              <br />
              <span className="font-serif font-light italic">Arena Hub.</span>
            </h2>
            <p className="text-neutral-400 mt-3 text-sm">Sign in to your IITG Arena Hub account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-200">
                IITG Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@iitg.ac.in"
                  className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] pl-11 pr-4 py-3.5 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-primary-500 focus:bg-[#111] focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500">Only @iitg.ac.in emails allowed</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-200">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] pl-11 pr-4 py-3.5 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-primary-500 focus:bg-[#111] focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-transform hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-neutral-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-white hover:underline">
              Register here
            </Link>
          </div>

          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-xs font-medium text-neutral-300 mb-2 uppercase tracking-wide">Demo Credentials</p>
            <p className="text-xs text-neutral-500">Student: r.sharma@iitg.ac.in / student123</p>
            <p className="text-xs text-neutral-500">Admin: admin@iitg.ac.in / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;