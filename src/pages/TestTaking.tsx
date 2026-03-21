import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Question, Response, ProctorEvent, GenerateTestResponse } from '../types';

// Demo questions for testing without a backend
const DEMO_TEST: GenerateTestResponse = {
  role: 'Software Engineer (Demo)',
  skills: ['JavaScript', 'React', 'System Design'],
  weights: { Technical: 60, Communication: 25, Leadership: 15 },
  questions: [
    {
      id: 'q1',
      type: 'single_choice',
      text: 'Which hook is used to manage side effects in React?',
      options: [
        { id: 'A', text: 'useState' },
        { id: 'B', text: 'useEffect' },
        { id: 'C', text: 'useContext' },
        { id: 'D', text: 'useRef' },
      ],
      time_limit: 60,
      category: 'Technical',
    },
    {
      id: 'q2',
      type: 'single_choice',
      text: 'What does Big-O notation measure?',
      options: [
        { id: 'A', text: 'Memory usage only' },
        { id: 'B', text: 'Code readability' },
        { id: 'C', text: 'Algorithm efficiency relative to input size' },
        { id: 'D', text: 'Number of lines of code' },
      ],
      time_limit: 60,
      category: 'Technical',
    },
    {
      id: 'q3',
      type: 'short_answer',
      text: 'Explain the difference between REST and GraphQL APIs.',
      time_limit: 120,
      category: 'Technical',
    },
    {
      id: 'q4',
      type: 'code_fill',
      text: 'Fill in the blank: Complete the JavaScript function to reverse a string.',
      code_snippet: 'function reverseString(str) {\n  return _______________;\n}',
      placeholder: 'str.split("").reverse().join("")',
      time_limit: 90,
      category: 'Technical',
    },
    {
      id: 'q5',
      type: 'single_choice',
      text: 'Which data structure uses LIFO (Last In First Out)?',
      options: [
        { id: 'A', text: 'Queue' },
        { id: 'B', text: 'Stack' },
        { id: 'C', text: 'Linked List' },
        { id: 'D', text: 'Tree' },
      ],
      time_limit: 60,
      category: 'Technical',
    },
  ],
};

interface LocationState {
  testData?: GenerateTestResponse;
}

const TestTaking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const testData: GenerateTestResponse = state?.testData || DEMO_TEST;
  const questions: Question[] = testData.questions;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.time_limit ?? 60
  );
  const [proctorEvents, setProctorEvents] = useState<ProctorEvent[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const [textAnswer, setTextAnswer] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const currentQuestion = questions[currentIdx];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Proctoring: track tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const event: ProctorEvent = {
          type: 'tab_switch',
          timestamp: new Date().toISOString(),
          details: 'Candidate switched/minimized tab',
        };
        setProctorEvents((prev) => [...prev, event]);
      }
    };

    const handleBlur = () => {
      const event: ProctorEvent = {
        type: 'window_blur',
        timestamp: new Date().toISOString(),
        details: 'Window lost focus',
      };
      setProctorEvents((prev) => [...prev, event]);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (submitted) return;
    setTimeLeft(currentQuestion?.time_limit ?? 60);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAutoAdvance();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, submitted]);

  // Reset text answer on question change
  useEffect(() => {
    const existing = responses[currentQuestion?.id];
    if (existing) {
      setTextAnswer(existing.answer);
      setConfidence(existing.confidence ?? 3);
    } else {
      setTextAnswer('');
      setConfidence(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  const handleAutoAdvance = useCallback(() => {
    // Save blank answer if not yet answered
    setResponses((prev) => {
      if (!prev[currentQuestion.id]) {
        return {
          ...prev,
          [currentQuestion.id]: {
            question_id: currentQuestion.id,
            answer: '',
            time_taken: currentQuestion.time_limit,
            confidence,
          },
        };
      }
      return prev;
    });

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, currentQuestion, confidence, questions.length]);

  const saveCurrentAnswer = (answer: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        question_id: currentQuestion.id,
        answer,
        time_taken: (currentQuestion.time_limit ?? 60) - timeLeft,
        confidence,
      },
    }));
  };

  const handleOptionSelect = (optionId: string) => {
    saveCurrentAnswer(optionId);
  };

  const handleTextChange = (val: string) => {
    setTextAnswer(val);
    saveCurrentAnswer(val);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  };

  const handleFinalSubmit = () => {
    setShowConfirmSubmit(false);
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const allResponses = Object.values(responses);
    const summary = {
      tab_switches: proctorEvents.filter((e) => e.type === 'tab_switch').length,
      no_face_count: proctorEvents.filter((e) => e.type === 'no_face').length,
      total_events: proctorEvents.length,
    };

    navigate('/reports', {
      state: {
        questions,
        responses: allResponses,
        events: proctorEvents,
        summary,
        testData,
      },
    });
  };

  const answeredCount = Object.keys(responses).filter(
    (id) => responses[id].answer !== ''
  ).length;

  const progress = Math.round(((currentIdx + 1) / questions.length) * 100);
  const timerPct = Math.round((timeLeft / (currentQuestion?.time_limit ?? 60)) * 100);
  const timerColor =
    timerPct > 50 ? 'text-green-600' : timerPct > 25 ? 'text-yellow-600' : 'text-red-600';

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl p-8 text-center shadow">
          <p className="text-gray-600 mb-4">No questions found. Please generate a test first.</p>
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

  const currentAnswer = responses[currentQuestion.id]?.answer ?? '';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">AI Interview Assessment</p>
            <p className="text-blue-300 text-xs">{testData.role}</p>
          </div>
        </div>

        {/* Proctoring status */}
        <div className="flex items-center gap-4">
          {proctorEvents.length > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-500 bg-opacity-20 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 text-xs font-medium">
                {proctorEvents.length} alert{proctorEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-blue-300">{answeredCount}/{questions.length} answered</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1.5">
        <div
          className="bg-blue-500 h-1.5 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-5">
        {/* Main question area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Question header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                {currentQuestion.category && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {currentQuestion.category}
                  </span>
                )}
                {currentQuestion.difficulty && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-1.5 font-mono font-bold ${timerColor}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>

            {/* Question text */}
            <p className="text-gray-800 font-medium text-base leading-relaxed mb-5">
              {currentQuestion.text}
            </p>

            {/* Code snippet */}
            {currentQuestion.code_snippet && (
              <pre className="bg-gray-900 text-green-400 text-sm p-4 rounded-lg mb-4 overflow-x-auto font-mono">
                {currentQuestion.code_snippet}
              </pre>
            )}

            {/* Answer area */}
            {currentQuestion.type === 'single_choice' && currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                      currentAnswer === opt.id
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      currentAnswer === opt.id
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {opt.id}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'code_fill') && (
              <textarea
                value={textAnswer}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={currentQuestion.type === 'code_fill' ? 6 : 4}
                placeholder={currentQuestion.placeholder || 'Type your answer here...'}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  currentQuestion.type === 'code_fill' ? 'font-mono' : ''
                }`}
              />
            )}

            {/* Confidence */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                How confident are you in this answer?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setConfidence(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      confidence === val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
                <span>Not sure</span>
                <span>Very confident</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                Submit Test
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Questions
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = !!responses[q.id]?.answer;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-600" />
                <span className="text-xs text-gray-500">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                <span className="text-xs text-gray-500">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-100" />
                <span className="text-xs text-gray-500">Unanswered</span>
              </div>
            </div>
          </div>

          {/* Proctoring info */}
          <div className="bg-white rounded-xl shadow-sm p-4 mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Proctoring
            </p>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Tab switches</span>
                <span className={proctorEvents.filter(e => e.type === 'tab_switch').length > 0 ? 'text-red-500 font-bold' : 'font-medium'}>
                  {proctorEvents.filter(e => e.type === 'tab_switch').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Focus lost</span>
                <span className={proctorEvents.filter(e => e.type === 'window_blur').length > 0 ? 'text-yellow-600 font-bold' : 'font-medium'}>
                  {proctorEvents.filter(e => e.type === 'window_blur').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Submit Test?</h3>
            <p className="text-sm text-gray-600 mb-1">
              You have answered <strong>{answeredCount}</strong> of{' '}
              <strong>{questions.length}</strong> questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                ⚠️ {questions.length - answeredCount} question(s) unanswered. Submitting now will leave them blank.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTaking;
