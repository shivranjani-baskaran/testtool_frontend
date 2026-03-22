import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Layout from '../components/Layout';
import { DashboardMetrics, CandidateReportSummary, ScoreDistribution, CategoryPerformance, SkillBreakdown } from '../types';
import { getDashboardMetrics, getAllReports } from '../api/client';

const categoryPerformance: CategoryPerformance[] = [
  { name: 'Technical', value: 64, color: '#3b82f6' },
  { name: 'Communication', value: 20, color: '#10b981' },
  { name: 'Leadership', value: 16, color: '#f59e0b' },
];

const skillBreakdown: SkillBreakdown[] = [
  { skill: 'Data Structures', score: 82, maxScore: 100 },
  { skill: 'System Design', score: 74, maxScore: 100 },
  { skill: 'Problem Solving', score: 88, maxScore: 100 },
  { skill: 'Communication', score: 71, maxScore: 100 },
  { skill: 'Team Collaboration', score: 79, maxScore: 100 },
  { skill: 'Leadership', score: 65, maxScore: 100 },
];

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  changePositive?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  color,
  change,
  changePositive,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 truncate">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {change && (
        <p className={`text-xs mt-0.5 ${changePositive ? 'text-green-600' : 'text-red-500'}`}>
          {changePositive ? '↑' : '↓'} {change} from last month
        </p>
      )}
    </div>
  </div>
);

const decisionColor = (decision?: string) => {
  if (!decision) return 'text-gray-500 bg-gray-100';
  if (decision === 'Hire') return 'text-green-700 bg-green-100';
  if (decision === 'Review') return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_candidates: 0,
    tests_sent: 0,
    tests_completed: 0,
    average_score: 0,
    score_distribution: [],
  });
  const [recentReports, setRecentReports] = useState<CandidateReportSummary[]>([]);
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(() => setMetricsError('Could not load live metrics.'));

    getAllReports()
      .then((r) => setRecentReports(r.slice(0, 10)))
      .catch(() => {});
  }, []);

  const scoreDistribution: ScoreDistribution[] =
    metrics.score_distribution.length > 0
      ? metrics.score_distribution
      : [
          { range: '0-20', count: 0 },
          { range: '21-40', count: 0 },
          { range: '41-60', count: 0 },
          { range: '61-80', count: 0 },
          { range: '81-100', count: 0 },
        ];

  return (
    <Layout title="Dashboard" subtitle="Welcome back! Here's an overview of your hiring activity.">
      {metricsError && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-700">
          {metricsError}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Candidates"
          value={metrics.total_candidates.toLocaleString()}
          color="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Tests Sent"
          value={metrics.tests_sent.toLocaleString()}
          color="bg-green-100"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
        <MetricCard
          label="Tests Completed"
          value={metrics.tests_completed.toLocaleString()}
          color="bg-purple-100"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Average Score"
          value={`${metrics.average_score}%`}
          color="bg-orange-100"
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Score Distribution */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scoreDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Candidates" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Category Performance</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={categoryPerformance}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Reports</h2>
        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No completed tests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Role</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Score</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Decision</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r) => (
                  <tr key={r.session_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{r.name || '—'}</td>
                    <td className="py-2 px-3 text-gray-600">{r.email}</td>
                    <td className="py-2 px-3 text-gray-600">{r.role || '—'}</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-800">
                      {r.final_score != null ? `${r.final_score.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {r.hire_decision ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${decisionColor(r.hire_decision)}`}>
                          {r.hire_decision}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500">
                      {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Skill Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Skill Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skillBreakdown.map((skill) => {
            const pct = Math.round((skill.score / skill.maxScore) * 100);
            let barColor = 'bg-green-500';
            if (pct < 60) barColor = 'bg-red-500';
            else if (pct < 75) barColor = 'bg-yellow-500';

            return (
              <div key={skill.skill}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                  <span className="text-sm font-semibold text-gray-800">{pct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
