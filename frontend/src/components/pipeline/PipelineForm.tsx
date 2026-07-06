import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePipeline } from "@/hooks/usePipelines";
import Button from "@/components/ui/Button";
import type { CreatePipelinePayload } from "@/types/pipeline";

interface TaskField {
  name: string;
  estimated_duration: number;
  failure_probability: number;
}

interface DependencyField {
  task: string;     // task name
  depends_on: string;
}

export default function PipelineForm() {
  const navigate = useNavigate();
  const { mutate: createPipeline, isPending } = useCreatePipeline();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<TaskField[]>([
    { name: "", estimated_duration: 5, failure_probability: 0 },
  ]);
  const [dependencies, setDependencies] = useState<DependencyField[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addTask = () =>
    setTasks((prev) => [...prev, { name: "", estimated_duration: 5, failure_probability: 0 }]);

  const removeTask = (idx: number) => {
    const removed = tasks[idx].name;
    setTasks((prev) => prev.filter((_, i) => i !== idx));
    setDependencies((prev) =>
      prev.filter((d) => d.task !== removed && d.depends_on !== removed)
    );
  };

  const updateTask = (idx: number, field: keyof TaskField, value: string | number) =>
    setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

  const addDependency = () =>
    setDependencies((prev) => [...prev, { task: "", depends_on: "" }]);

  const removeDependency = (idx: number) =>
    setDependencies((prev) => prev.filter((_, i) => i !== idx));

  const updateDependency = (idx: number, field: keyof DependencyField, value: string) =>
    setDependencies((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Pipeline name is required";

    const taskNames = tasks.map((t) => t.name.trim());
    tasks.forEach((t, i) => {
      if (!t.name.trim()) errs[`task_${i}_name`] = "Task name is required";
    });

    const duplicates = taskNames.filter((n, i) => taskNames.indexOf(n) !== i);
    if (duplicates.length) errs.duplicates = `Duplicate task names: ${[...new Set(duplicates)].join(", ")}`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreatePipelinePayload = {
      name: name.trim(),
      description: description.trim(),
      tasks: tasks.map((t) => ({
        name: t.name.trim(),
        description: "",
        estimated_duration: Number(t.estimated_duration),
        failure_probability: Number(t.failure_probability),
      })),
      dependencies: dependencies
        .filter((d) => d.task && d.depends_on)
        .map((d) => ({ task: d.task, depends_on: d.depends_on })),
    };

    createPipeline(payload);
  };

  const taskNameOptions = tasks.map((t) => t.name.trim()).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Pipeline info */}
      <section className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Pipeline</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
            <input
              className="input w-full"
              placeholder="e.g. Genome Analysis Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Tasks */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Tasks</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addTask}>
            + Add Task
          </Button>
        </div>

        {errors.duplicates && (
          <p className="text-red-400 text-xs">{errors.duplicates}</p>
        )}

        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Task {idx + 1}</span>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    className="text-gray-600 hover:text-red-400 transition-colors"
                    onClick={() => removeTask(idx)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                  <input
                    className="input w-full"
                    placeholder="e.g. Upload Data"
                    value={task.name}
                    onChange={(e) => updateTask(idx, "name", e.target.value)}
                  />
                  {errors[`task_${idx}_name`] && (
                    <p className="text-red-400 text-xs mt-1">{errors[`task_${idx}_name`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Duration (sec)</label>
                  <input
                    type="number"
                    min={1}
                    className="input w-full"
                    value={task.estimated_duration}
                    onChange={(e) => updateTask(idx, "estimated_duration", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Failure prob. (0–1)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    className="input w-full"
                    value={task.failure_probability}
                    onChange={(e) => updateTask(idx, "failure_probability", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dependencies */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Dependencies</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Define which tasks must complete before others can start.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addDependency}
            disabled={taskNameOptions.length < 2}
          >
            + Add Dependency
          </Button>
        </div>

        {dependencies.length === 0 && (
          <p className="text-xs text-gray-600 italic">
            No dependencies — all tasks will run in parallel.
          </p>
        )}

        <div className="space-y-2">
          {dependencies.map((dep, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                className="input flex-1"
                value={dep.task}
                onChange={(e) => updateDependency(idx, "task", e.target.value)}
              >
                <option value="">Task…</option>
                {taskNameOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-gray-500 text-xs whitespace-nowrap">depends on</span>
              <select
                className="input flex-1"
                value={dep.depends_on}
                onChange={(e) => updateDependency(idx, "depends_on", e.target.value)}
              >
                <option value="">Task…</option>
                {taskNameOptions.filter((n) => n !== dep.task).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                type="button"
                className="text-gray-600 hover:text-red-400 transition-colors"
                onClick={() => removeDependency(idx)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate("/")}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          Create Pipeline
        </Button>
      </div>
    </form>
  );
}
