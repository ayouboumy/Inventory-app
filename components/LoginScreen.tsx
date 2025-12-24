import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple demo authentication - In a real app, this would check against a backend
    // Default PIN: 7860
    if (pin === '7860') {
      onLogin();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">منصة ضبط التوزيع</h1>
          <p className="text-emerald-100 text-sm mt-1">نظام إدارة الأصول الآمن</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Lock size={12} /> رمز الدخول (PIN)
              </label>
              <input 
                type="password" 
                inputMode="numeric"
                autoFocus
                className={`w-full border-2 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none transition-colors
                  ${error 
                    ? 'border-red-200 bg-red-50 text-red-600 focus:border-red-400' 
                    : 'border-slate-100 bg-slate-50 text-slate-800 focus:border-emerald-500 focus:bg-white'}`}
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
              />
              {error && (
                <p className="text-xs text-red-500 text-center font-medium animate-pulse">
                  رمز خاطئ. يرجى المحاولة مرة أخرى.
                </p>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-200"
            >
              دخول إلى المنصة <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            <div className="text-center">
              <p className="text-xs text-slate-400">الرمز الافتراضي: 7860</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};