import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiMail, HiLockClosed, HiUser, HiEye, HiEyeOff } from 'react-icons/hi';
import * as api from '../api';

/**
 * Sign up.
 *
 * No college-email requirement - spec A.1 is email + password plus a
 * Student / Professional choice. That choice is asked here because it decides
 * whether the profile form later asks for College Name or Organization Name,
 * and that single field is what the whole eligibility system runs on (A.8).
 */
function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    // Matches the server rule, so the user hears about it before a round trip.
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        userType: form.userType,
      });
      toast.success('Account created');
      navigate('/profile');
    } catch (err) {
      toast.error(api.readError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-3xl">H</span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have one?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <form className="space-y-5" onSubmit={submit}>
            <Field label="Full name" icon={<HiUser />}>
              <input
                name="name"
                type="text"
                required
                className="input-field pl-10"
                placeholder="Aisha Khan"
                value={form.name}
                onChange={change}
              />
            </Field>

            <Field label="Email" icon={<HiMail />}>
              <input
                name="email"
                type="email"
                required
                className="input-field pl-10"
                placeholder="you@example.com"
                value={form.email}
                onChange={change}
              />
            </Field>

            {/* Asked once, at signup - it drives the profile form and eligibility. */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">I am a</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['student', 'Student'],
                  ['professional', 'Professional / Other'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, userType: value })}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                      form.userType === value
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Password" icon={<HiLockClosed />}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pl-10 pr-10"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={change}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </Field>

            <Field label="Confirm password" icon={<HiLockClosed />}>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pl-10"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={change}
              />
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default Register;
