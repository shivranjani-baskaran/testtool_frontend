import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { submitTest } from '../api/client';
import {
  Question,
  Response,
  ProctorEvent,
  ProctorSummary,
  SubmitTestResponse,
  GenerateTestResponse,
  EvaluatedResponse,
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

interface LocationState {
  questions?: Question[];
  responses?: Response[];
  events?: ProctorEvent[];
  summary?: ProctorSummary;
  testData?: GenerateTestResponse;
}

// Demo report for when there is no backend
const DEMO_REPORT: SubmitTestResponse = {
  report: {
    total_score: 78,
    max_score: 100,
    percentage: 78,
    grade: 'B+',
    category_scores: { Technical: 82, Communication: 70, Leadership: 75 },
    evaluated_responses: [
      {
        question_id: 'q1',
        question_text: 'Which hook is used to manage side effects in React?',
        answer: 'B',
        score: 10,
        max_score: 10,
        feedback: 'Correct! useEffect is the right hook for managing side effects.',
        category: 'Technical',
      },
      {
        question_id: 'q2',
        question_text: 'What does Big-O notation measure?',
        answer: 'C',
        score: 10,
        max_score: 10,
        feedback: 'Correct! Big-O notation describes algorithm efficiency relative to input size.',
        category: 'Technical',
      },
      {
        question_id: 'q3',
        question_text: 'Explain the difference between REST and GraphQL APIs.',
        answer: 'REST uses fixed endpoints while GraphQL uses a single endpoint with flexible queries.',
        score: 8,
        max_score: 10,
        feedback: 'Good answer. Could mention specific advantages like over-fetching/under-fetching prevention in GraphQL.',
        category: 'Technical',
      },
    ],
    metacognitive_analysis: {
      confidence_accuracy: 0.82,
      overconfidence_count: 1,
      underconfidence_count: 2,
      calibration_score: 0.78,
    },
    proctoring_summary: {
      tab_switches: 0,
      no_face_count: 0,
      total_events: 0,
    },
    recommendations: [
      'Deepen knowledge in system design patterns',
      'Practice more complex coding challenges',
      'Work on communication clarity in technical explanations',
    ],
    strengths: ['Strong React knowledge', 'Good algorithmic thinking', 'Clear problem-solving approach'],
    weaknesses: ['System design depth could be improved', 'Some communication answers lacked structure'],
  },
};

const gradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
  if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
  if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const Reports: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<SubmitTestResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'proctoring'>('overview');

  useEffect(() => {
    if (state?.questions && state?.responses) {
      submitTestData();
    } else {
      // Show demo data
      setReport(DEMO_REPORT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitTestData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await submitTest({
        questions: state!.questions!,
        responses: state!.responses!,
        events: state!.events ?? [],
        summary: state!.summary ?? { tab_switches: 0, no_face_count: 0, total_events: 0 },
      });
      setReport(result);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to submit test. Showing demo report instead.';
      setError(msg);
      setReport(DEMO_REPORT);
    } finally {
      setLoading(false);
    }
  };

  const radarData = report
    ? Object.entries(report.report.category_scores).map(([subject, score]) => ({
        subject,
        score,
        fullMark: 100,
      }))
    : [];

  return (
    <Layout title="Candidate Report" subtitle="Evaluation results and analysis">
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin w-10 h-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 text-sm">Evaluating your responses…</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-start gap-2 mb-4">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {!loading && report && (
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Score Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Big score circle */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-blue-200 bg-blue-50 mx-auto sm:mx-0">
                <span className="text-3xl font-bold text-blue-700">{report.report.percentage}%</span>
                <span className="text-xs text-blue-500 mt-1">Overall</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    {report.report.total_score} / {report.report.max_score}
                  </h2>
                  <span className={`px-3 py-0.5 rounded-full text-sm font-bold ${gradeColor(report.report.grade)}`}>
                    Grade: {report.report.grade}
                  </span>
                </div>

                {/* Category scores */}
                <div className="flex flex-wrap gap-3">
                  {Object.entries(report.report.category_scores).map(([cat, score]) => (
                    <div key={cat} className="text-center bg-gray-50 rounded-lg px-4 py-2">
                      <p className="text-lg font-bold text-gray-800">{score}%</p>
                      <p className="text-xs text-gray-500">{cat}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/upload-jd')}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  New Test
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white rounded-t-xl shadow-sm px-4">
            {(['overview', 'responses', 'proctoring'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'responses' ? 'Responses' : 'Proctoring'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-b-xl shadow-sm p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Radar chart */}
                {radarData.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Performance Radar</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Category bar chart */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Category Scores</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={radarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Score (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Metacognitive analysis */}
                {report.report.metacognitive_analysis && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Metacognitive Analysis</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: 'Confidence Accuracy',
                          value: `${Math.round(report.report.metacognitive_analysis.confidence_accuracy * 100)}%`,
                        },
                        {
                          label: 'Calibration Score',
                          value: `${Math.round(report.report.metacognitive_analysis.calibration_score * 100)}%`,
                        },
                        {
                          label: 'Overconfident',
                          value: report.report.metacognitive_analysis.overconfidence_count,
                        },
                        {
                          label: 'Underconfident',
                          value: report.report.metacognitive_analysis.underconfidence_count,
                        },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-gray-800">{item.value}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.report.strengths?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <span className="text-green-500">✓</span> Strengths
                      </h3>
                      <ul className="space-y-1.5">
                        {report.report.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.report.weaknesses?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <span className="text-red-500">✗</span> Areas to Improve
                      </h3>
                      <ul className="space-y-1.5">
                        {report.report.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {report.report.recommendations?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
                    <ul className="space-y-1.5">
                      {report.report.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <span className="text-blue-400 mt-0.5">→</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'responses' && (
              <div className="space-y-4">
                {report.report.evaluated_responses.map((er: EvaluatedResponse, i: number) => {
                  const pct = Math.round((er.score / er.max_score) * 100);
                  const scoreColor =
                    pct >= 80 ? 'text-green-600 bg-green-100' :
                    pct >= 60 ? 'text-yellow-600 bg-yellow-100' :
                    'text-red-600 bg-red-100';

                  return (
                    <div key={er.question_id || i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="text-gray-400 mr-1">Q{i + 1}.</span>
                          {er.question_text}
                        </p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${scoreColor}`}>
                          {er.score}/{er.max_score}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded px-3 py-2 mb-2">
                        <p className="text-xs text-gray-500 mb-0.5">Your answer:</p>
                        <p className="text-sm text-gray-700">{er.answer || <em className="text-gray-400">Not answered</em>}</p>
                      </div>

                      {er.feedback && (
                        <div className="flex items-start gap-1.5">
                          <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-gray-600">{er.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {report.report.evaluated_responses.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No evaluated responses available.</p>
                )}
              </div>
            )}

            {activeTab === 'proctoring' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Tab Switches',
                      value: report.report.proctoring_summary.tab_switches,
                      ok: report.report.proctoring_summary.tab_switches === 0,
                    },
                    {
                      label: 'No Face Detected',
                      value: report.report.proctoring_summary.no_face_count,
                      ok: report.report.proctoring_summary.no_face_count === 0,
                    },
                    {
                      label: 'Total Events',
                      value: report.report.proctoring_summary.total_events,
                      ok: report.report.proctoring_summary.total_events === 0,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-lg p-4 text-center border ${
                        item.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <p className={`text-3xl font-bold ${item.ok ? 'text-green-700' : 'text-red-700'}`}>
                        {item.value}
                      </p>
                      <p className={`text-xs mt-1 ${item.ok ? 'text-green-600' : 'text-red-600'}`}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                {(state?.events?.length ?? 0) > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Event Log</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Time</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Event</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(state?.events ?? []).map((ev, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-2 text-gray-500">
                                {new Date(ev.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="px-4 py-2">
                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded capitalize">
                                  {ev.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-gray-600">{ev.details || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">No proctoring events detected</p>
                    <p className="text-xs text-gray-400 mt-1">The candidate completed the test without any flags.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Reports;
