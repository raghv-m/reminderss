import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setUserId } from '../lib/api';
import { Flame, Loader2 } from 'lucide-react';

export function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setUserId(userId);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-primary-500" />
        <p className="text-dark-400">Logging you in...</p>
      </div>
    </div>
  );
}

export function AuthError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Something went wrong';

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center card max-w-md mx-4">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">😔</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
        <p className="text-dark-400 mb-6">{message}</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Try Again
        </button>
      </div>
    </div>
  );
}

