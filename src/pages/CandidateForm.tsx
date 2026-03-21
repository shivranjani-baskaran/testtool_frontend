import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenerateTestResponse, CandidateInfo } from '../types';
import { generateTestLink } from '../api/client';

interface LocationState {
  testData?: GenerateTestResponse;
}

const generateCandidateId = () => {
  const uuid = (crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 10)).replace(/-/g, '');
  return `CAND_${uuid.substring(0, 8).toUpperCase()}`;
};

const CandidateForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const testData = state?.testData;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ testLink: string; sessionId: string } | null>(null);

  useEffect(() => {
    setCandidateId(generateCandidateId());
  }, []);

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">No test data found. Please generate a test first.</p>
          <button
            onClick={() => navigate('/upload-jd')}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm"
          >
            Go to Upload JD
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await generateTestLink({
        candidate_id: candidateId,
        email: email.trim(),
        name: name.trim() || undefined,
        questions: testData.questions,
      });
      setSuccess({ testLink: result.test_link, sessionId: result.session_id });
    } catch (err: any) {
      // If backend is not available, fall through to local test mode
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Could not send email. You can still start the test directly.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTestDirectly = () => {
    const candidateInfo: CandidateInfo = {
      candidate_id: candidateId,
      email: email.trim() || 'guest@example.com',
      name: name.trim() || undefined,
      session_id: success?.sessionId,
    };
    navigate('/test', { state: { testData, candidateInfo } });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Candidate Details</h1>
            <p className="text-sm text-gray-500">
              Test: <span className="font-medium text-gray-700">{testData.role}</span>
              {' · '}
              <span className="text-blue-600">{testData.questions.length} Questions</span>
            </p>
          </div>
        </div>

        {success ? (
          /* Success state */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-green-700">Email Sent Successfully!</p>
              </div>
              <p className="text-sm text-green-700">
                A test link has been sent to <strong>{email}</strong>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Test Link</p>
              <p className="text-sm text-blue-600 break-all font-mono">{success.testLink}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/upload-jd')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Upload Another JD
              </button>
              <button
                onClick={handleStartTestDirectly}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Start Test Now
              </button>
            </div>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setCandidateId(generateCandidateId())}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Regenerate ID"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                A test link and temporary password will be sent to this email.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/upload-jd', { state: { testData } })}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Test Link
                  </>
                )}
              </button>
            </div>

            {/* Skip email option */}
            <div className="text-center border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={handleStartTestDirectly}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                disabled={!email.trim()}
              >
                Skip email — start test directly
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CandidateForm;
