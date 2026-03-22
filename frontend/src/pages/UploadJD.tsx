import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { generateTest, sendTestBulk } from '../api/client';
import { GenerateTestResponse, Question } from '../types';

const UploadJD: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateTestResponse | null>(null);

  // Bulk send state
  const [jdId, setJdId] = useState<string | null>(null);
  const [candidateEmails, setCandidateEmails] = useState<string[]>(['']);
  const [candidateNames, setCandidateNames] = useState<string[]>(['']);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const [bulkError, setBulkError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
    const hasAllowedType = allowedTypes.includes(file.type);
    const hasAllowedExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasAllowedType && !hasAllowedExtension) {
      setError('Please upload a .txt, .pdf, .doc, or .docx file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setJobDescription(ev.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setJobDescription(ev.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!jobDescription.trim()) {
      setError('Please provide a job description (paste text or upload a file).');
      return;
    }

    const fullDescription = jobTitle
      ? `Job Title: ${jobTitle}\nDepartment: ${department}\n\n${jobDescription}`
      : jobDescription;

    setLoading(true);
    try {
      const data = await generateTest({ job_description: fullDescription });
      setResult(data);
      setJdId(data.jd_id ?? null);
      setBulkResults(null);
      setBulkError('');
      setCandidateEmails(['']);
      setCandidateNames(['']);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to generate test. Please check your backend connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    if (result) {
      navigate('/candidate-form', { state: { testData: result } });
    }
  };

  const handleAddCandidate = () => {
    setCandidateEmails((prev) => [...prev, '']);
    setCandidateNames((prev) => [...prev, '']);
  };

  const handleRemoveCandidate = (idx: number) => {
    setCandidateEmails((prev) => prev.filter((_, i) => i !== idx));
    setCandidateNames((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEmailChange = (idx: number, val: string) => {
    setCandidateEmails((prev) => prev.map((e, i) => (i === idx ? val : e)));
  };

  const handleNameChange = (idx: number, val: string) => {
    setCandidateNames((prev) => prev.map((n, i) => (i === idx ? val : n)));
  };

  const handleBulkSend = async () => {
    if (!result) return;
    const emails = candidateEmails.filter((e) => e.trim() !== '');
    if (emails.length === 0) {
      setBulkError('Please enter at least one email address.');
      return;
    }
    setBulkError('');
    setBulkSending(true);
    setBulkResults(null);
    try {
      const resp = await sendTestBulk({
        emails,
        names: candidateNames.slice(0, emails.length).map((n) => n.trim() || null),
        questions: result.questions,
        role: result.role,
        skills: result.skills,
        weights: result.weights,
        jd_id: jdId ?? undefined,
      });
      setBulkResults(resp.results);
    } catch (err: any) {
      setBulkError(err?.response?.data?.detail || err?.message || 'Bulk send failed.');
    } finally {
      setBulkSending(false);
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      single_choice: 'bg-blue-100 text-blue-700',
      multiple_choice: 'bg-purple-100 text-purple-700',
      code_fill: 'bg-green-100 text-green-700',
      short_answer: 'bg-orange-100 text-orange-700',
    };
    const labels: Record<string, string> = {
      single_choice: 'Single Choice',
      multiple_choice: 'Multiple Choice',
      code_fill: 'Code Fill',
      short_answer: 'Short Answer',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <Layout title="Upload Job Description" subtitle="Generate a tailored interview test from your JD.">
      <div className="max-w-4xl mx-auto">
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Job Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Job Description</h2>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-4"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{fileName}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFileName(''); setJobDescription(''); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                      Drop your JD file here, or{' '}
                      <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Supports .txt, .pdf, .doc, .docx</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              {/* Text area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or paste the Job Description here <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  placeholder="Paste the full job description here, including responsibilities, requirements, and qualifications..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Test...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Test
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Results View */
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Test Generated Successfully!
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Role: <span className="font-medium text-gray-700">{result.role}</span>
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  {result.questions.length} Questions
                </span>
              </div>

              {/* Skills */}
              {result.skills && result.skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Skills Assessed:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.skills.map((skill, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weights */}
              {result.weights && Object.keys(result.weights).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Category Weights:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(result.weights).map(([cat, weight]) => (
                      <div key={cat} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">{cat}</p>
                        <p className="text-sm font-semibold text-gray-800">{weight}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Questions Preview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Generated Questions Preview
              </h2>
              <div className="space-y-4">
                {result.questions.map((q: Question, idx: number) => (
                  <div key={q.id || idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="text-gray-400 mr-2">Q{idx + 1}.</span>
                          {q.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {q.difficulty && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                        {getQuestionTypeBadge(q.type)}
                      </div>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1 ml-4">
                        {q.options.map((opt, oi) => (
                          <li key={opt.id ?? oi} className="text-xs text-gray-600 flex gap-2">
                            <span className="font-medium text-gray-500 min-w-[1.25rem]">{opt.id}.</span>
                            <span>{opt.text || <em className="text-gray-400">(no text)</em>}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.time_limit && (
                      <p className="text-xs text-gray-400 mt-2">
                        ⏱ {q.time_limit}s time limit
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Email Send */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Send Test to Candidates</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter candidate email addresses to send the test link via email.
              </p>

              <div className="space-y-3 mb-4">
                {candidateEmails.map((email, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={candidateNames[idx] ?? ''}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      placeholder="Name (optional)"
                      className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      placeholder="candidate@example.com"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(idx)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Candidate
                </button>
              </div>

              {bulkError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 mb-3">
                  {bulkError}
                </div>
              )}

              {bulkResults && (
                <div className="mb-4 space-y-2">
                  {bulkResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                        r.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {r.status === 'success' ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span>
                        <strong>{r.email}</strong>:{' '}
                        {r.status === 'success'
                          ? r.email_sent
                            ? 'Test link sent via email.'
                            : 'Session created (email not configured).'
                          : r.detail || 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleBulkSend}
                disabled={bulkSending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {bulkSending ? (
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
                    Send Test to All Candidates
                  </>
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResult(null)}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Upload New JD
              </button>
              <button
                onClick={handleStartTest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Test Manually
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadJD;
