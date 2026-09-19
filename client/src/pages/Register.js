import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { AuthShell, Field, Spinner } from './Login';

export default function Register() {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    collegeName: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const { register } = useAuth();
  const navigate      = useNavigate();

  const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const body = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType,
        ...(userType === 'student'
          ? { collegeName: formData.collegeName }
          : { organizationName: formData.organizationName }),
      };
      await register(body);
      toast.success('Account created!');
      navigate('/profile');
    } catch (error) {
      toast.error(api.readError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading="Create your account"
      sub={<>Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* User type toggle */}
        <Field label="I am a…">
          <div className="grid grid-cols-2 gap-2">
            {['student', 'professional'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={`py-2 text-sm font-medium rounded-md border transition-colors duration-150 capitalize ${
                  userType === type
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Field>

        {/* Name */}
        <Field label="Full name">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={set('name')}
            className="input-field"
            placeholder="Your full name"
            autoComplete="name"
            required
          />
        </Field>

        {/* Email */}
        <Field
          label={userType === 'student' ? 'College email' : 'Email'}
          hint={userType === 'student' ? 'Use your .edu or .ac.in address' : undefined}
        >
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={set('email')}
            className="input-field"
            placeholder={userType === 'student' ? 'you@college.edu' : 'you@example.com'}
            autoComplete="email"
            required
          />
        </Field>

        {/* Institution */}
        {userType === 'student' ? (
          <Field label="College / University">
            <input
              type="text"
              name="collegeName"
              value={formData.collegeName}
              onChange={set('collegeName')}
              className="input-field"
              placeholder="e.g. BTKIT, IIT Delhi"
              required
            />
          </Field>
        ) : (
          <Field label="Organisation">
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={set('organizationName')}
              className="input-field"
              placeholder="e.g. Google, Startup Inc."
              required
            />
          </Field>
        )}

        {/* Password */}
        <Field label="Password" hint="Minimum 8 characters">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={set('password')}
              className="input-field pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <HiEyeOff className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {/* Confirm password */}
        <Field label="Confirm password">
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={set('confirmPassword')}
            className="input-field"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center mt-2"
        >
          {loading ? <><Spinner /> Creating account…</> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
