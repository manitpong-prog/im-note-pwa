/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        if (data?.session) {
          onAuthSuccess();
        } else {
          setSuccessMsg('Registration successful! Please check your email inbox to verify your account.');
          setDisplayName('');
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 selection:bg-amber-100 selection:text-amber-900 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-white mb-3 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" id="sparkle-logo" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-sans">
            iM Notes <span className="font-light text-zinc-500">Minimal</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Beautifully light, ultra-minimal notes app powered by Supabase.
          </p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8"
        >
          <div className="flex border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
            <button
              id="tab-signin"
              className={`flex-1 text-center font-bold text-sm pb-2 border-b-2 transition-all ${
                !isSignUp
                  ? 'border-amber-500 text-zinc-800 dark:text-white font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              className={`flex-1 text-center font-bold text-sm pb-2 border-b-2 transition-all ${
                isSignUp
                  ? 'border-amber-500 text-zinc-800 dark:text-white font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs flex items-start gap-2 border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs flex items-start gap-2 border border-emerald-100 dark:border-emerald-900/30">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    id="input-displayname"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-white font-sans text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-white font-sans text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                <label>Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-white font-sans text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white dark:text-zinc-950 border-0 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-zinc-900/10 dark:shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div id="auth-spinner" className="w-5 h-5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Get Started' : 'Sign In Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info */}
          <div className="mt-6 text-center text-xs text-zinc-400 font-sans">
            By continuing, you receive secure access controlled by Row Level Security (RLS) rules.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
