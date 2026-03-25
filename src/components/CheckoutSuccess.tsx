import { useState, useEffect } from 'react';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { SkinPack } from '../types';

interface CheckoutSuccessProps {
  skinPack?: SkinPack;
  sessionId?: string;
  onNavigate: (page: string) => void;
}

export function CheckoutSuccess({ skinPack, sessionId, onNavigate }: CheckoutSuccessProps) {
  const [isVerifying, setIsVerifying] = useState(!!sessionId);

  useEffect(() => {
    if (sessionId) {
      // In a real app, you'd verify the session with your backend
      // For now, just mark as verified after a brief delay
      const timer = setTimeout(() => {
        setIsVerifying(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionId]);

  const downloadUrl = skinPack?.downloadUrl || '/';

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle Texture Background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10">
        {/* Back Button */}
        <div className="max-w-2xl mx-auto px-6 py-6">
          <button
            onClick={() => onNavigate('shop')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Mods</span>
          </button>
        </div>

        {/* Success Card */}
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 opacity-20 rounded-full blur-xl" />
                <CheckCircle className="w-24 h-24 text-green-400 relative" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Thank You for Your Purchase!
            </h1>

            {/* Verification Status */}
            {isVerifying && (
              <div className="mb-6">
                <p className="text-gray-400">Verifying your payment...</p>
                <div className="mt-2 flex justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border border-orange-500 border-t-transparent" />
                </div>
              </div>
            )}

            {!isVerifying && (
              <>
                {/* Order Details */}
                {skinPack && (
                  <div className="mb-8 p-6 bg-slate-800 rounded-xl border border-slate-700">
                    <h2 className="text-xl mb-4 text-white">{skinPack.name}</h2>
                    <div className="space-y-2 text-gray-400 mb-4">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="text-orange-400">${skinPack.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Game:</span>
                        <span className="text-gray-300">{skinPack.gameName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span className="text-gray-300">{skinPack.fileSize}</span>
                      </div>
                    </div>
                    {sessionId && (
                      <div className="pt-4 border-t border-slate-700 text-xs text-gray-500">
                        Session ID: {sessionId.slice(0, 20)}...
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Your purchase has been confirmed. Your download is ready below. Check your email
                  for a receipt and setup instructions.
                </p>

                {/* Download Button */}
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold mb-6"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Now</span>
                </a>

                {/* Additional Info */}
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl">
                  <h3 className="text-sm font-semibold text-blue-400 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-400">
                    If you experience any issues with your download or have questions about installation,
                    please check our{' '}
                    <button
                      onClick={() => onNavigate('about')}
                      className="text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      support resources
                    </button>
                    {' '}or contact us.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
