import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock recharts to avoid ResizeObserver issues in jsdom
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Pie: () => null,
    Cell: () => null,
    Legend: () => null,
    RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    Radar: () => null,
  };
});

test('renders the application without crashing', () => {
  render(<App />);
  // The Dashboard is the default route - sidebar should be present
  expect(screen.getByText(/AI Interview/i)).toBeInTheDocument();
});

test('renders navigation links', () => {
  render(<App />);
  expect(screen.getByText(/Upload JD/i)).toBeInTheDocument();
  expect(screen.getByText(/Reports/i)).toBeInTheDocument();
});
