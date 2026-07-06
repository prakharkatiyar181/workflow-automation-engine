/**
 * Phase 1 Dashboard placeholder.
 *
 * Renders a visually polished landing card that confirms all services are
 * wired together. The actual pipeline list UI is implemented in Phase 6.
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Hero card */}
      <div className="card max-w-lg w-full p-8 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Workflow Engine
          </h1>
          <p className="mt-2 text-gray-400 text-sm leading-relaxed">
            Production-quality DAG pipeline executor.
            <br />
            Phase 1 foundation is running successfully.
          </p>
        </div>

        {/* Service status indicators */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { label: "Django Backend", color: "bg-emerald-500" },
            { label: "PostgreSQL", color: "bg-emerald-500" },
            { label: "Redis", color: "bg-emerald-500" },
            { label: "Celery Worker", color: "bg-emerald-500" },
          ].map((svc) => (
            <div
              key={svc.label}
              className="flex items-center gap-2.5 bg-gray-800/60 rounded-lg px-3 py-2.5 border border-gray-700/50"
            >
              <span
                className={`w-2 h-2 rounded-full ${svc.color} animate-pulse`}
              />
              <span className="text-xs font-medium text-gray-300">
                {svc.label}
              </span>
            </div>
          ))}
        </div>

        {/* Call to action hint */}
        <p className="text-xs text-gray-600">
          Full UI coming in Phase 6 — /create &amp; /executions/:id
        </p>
      </div>
    </div>
  );
}
