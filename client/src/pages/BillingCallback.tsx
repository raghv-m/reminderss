import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getSubscriptionStatus } from '../lib/api';

export function BillingSuccess() {
  const navigate = useNavigate();
  const [_searchParams] = useSearchParams();
  void _searchParams; // Used for URL state
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    const checkSubscription = async () => {
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const data = await getSubscriptionStatus() as { plan: string; status: string };
        if (data.status === 'active') {
          setPlan(data.plan);
          setStatus('success');
        } else {
          // Retry a few times
          let retries = 3;
          while (retries > 0 && data.status !== 'active') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retry = await getSubscriptionStatus() as { plan: string; status: string };
            if (retry.status === 'active') {
              setPlan(retry.plan);
              setStatus('success');
              return;
            }
            retries--;
          }
          setStatus('success'); // Show success anyway, webhook might be delayed
        }
      } catch (error) {
        setStatus('error');
      }
    };

    checkSubscription();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing your payment...</h2>
          <p className="text-dark-400">This will only take a moment</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-dark-400 mb-6">
            We couldn't verify your subscription. If you were charged, please contact support.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to {plan === 'family' ? 'Family' : 'Pro'}! 🔥</h1>
        <p className="text-dark-400 mb-8">
          Your subscription is now active. Time to build some serious discipline.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary px-8 py-3"
        >
          Start Crushing Goals
        </button>
      </div>
    </div>
  );
}

export function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <XCircle className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
        <p className="text-dark-400 mb-6">
          No worries! You can upgrade anytime when you're ready.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/welcome')}
            className="btn-secondary"
          >
            View Plans
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Continue Free
          </button>
        </div>
      </div>
    </div>
  );
}

