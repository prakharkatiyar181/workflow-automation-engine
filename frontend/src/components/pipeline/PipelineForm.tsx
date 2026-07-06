import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePipeline } from "@/hooks/usePipelines";
import Button from "@/components/ui/Button";
import type { CreatePipelinePayload } from "@/types/pipeline";
import { Trash2, ArrowDown } from "lucide-react";

interface TaskField {
  name: string;
  estimated_duration: number;
  failure_probability: number;
}

interface DependencyField {
  task: string;
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

    const duplicates = taskNames.filter((n, i) => taskNames.indexOf(n) !== i && n);
    if (duplicates.length) errs.duplicates = `Duplicate task names: ${[...new Set(duplicates)].join(", ")}`;

    dependencies.forEach((d, i) => {
      if (d.task && d.depends_on) {
        if (d.task === d.depends_on) {
          errs[`dep_${i}`] = "Self-dependency is not allowed";
        } else {
          // Check for duplicate dependencies
          const isDuplicate = dependencies.findIndex(
            (other, otherIdx) => otherIdx < i && other.task === d.task && other.depends_on === d.depends_on
          ) !== -1;
          if (isDuplicate) {
            errs[`dep_${i}`] = "Duplicate dependency";
          }
        }
      }
    });

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
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      {/* Pipeline info */}
      <section className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Pipeline Overview</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
            <input
              className={`input w-full ${errors.name ? "border-red-500/50 focus:border-red-500/50" : ""}`}
              placeholder="e.g. Data Ingestion Pipeline"
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
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Tasks</h2>
            <p className="text-xs text-gray-500 mt-0.5">Define the individual jobs to execute.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addTask}>
            + Add Task
          </Button>
        </div>

        {errors.duplicates && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
            {errors.duplicates}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task, idx) => (
            <div 
              key={idx} 
              className="group bg-gray-800/40 rounded-lg p-5 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task {idx + 1}</span>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => removeTask(idx)}
                    aria-label="Remove task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                  <input
                    className={`input w-full ${errors[`task_${idx}_name`] ? "border-red-500/50" : ""}`}
                    placeholder="e.g. Fetch Data"
                    value={task.name}
                    onChange={(e) => updateTask(idx, "name", e.target.value)}
                  />
                  {errors[`task_${idx}_name`] && (
                    <p className="text-red-400 text-xs mt-1">{errors[`task_${idx}_name`]}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
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
              Control the execution order.
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
          <div className="p-8 border border-dashed border-gray-700/50 rounded-lg text-center bg-gray-800/20">
            <p className="text-sm text-gray-400">No dependencies defined.</p>
            <p className="text-xs text-gray-500 mt-1">All tasks will run in parallel simultaneously.</p>
          </div>
        )}

        {dependencies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dependencies.map((dep, idx) => (
              <div key={idx} className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 space-y-3 relative group">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => removeDependency(idx)}
                  aria-label="Remove dependency"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex flex-col text-sm bg-gray-900/50 p-3 rounded-md items-center border border-gray-700/30">
                    <span className="font-mono text-gray-300">{dep.depends_on || "?"}</span>
                    <ArrowDown className="w-4 h-4 text-gray-500 my-1" />
                    <span className="font-mono text-blue-400">{dep.task || "?"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <select
                      className={`input w-full ${errors[`dep_${idx}`] ? "border-red-500/50" : ""}`}
                      value={dep.task}
                      onChange={(e) => updateDependency(idx, "task", e.target.value)}
                    >
                      <option value="">Task (Runs after)...</option>
                      {taskNameOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    
                    <select
                      className={`input w-full ${errors[`dep_${idx}`] ? "border-red-500/50" : ""}`}
                      value={dep.depends_on}
                      onChange={(e) => updateDependency(idx, "depends_on", e.target.value)}
                    >
                      <option value="">Depends on (Runs before)...</option>
                      {taskNameOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {errors[`dep_${idx}`] && (
                  <p className="text-red-400 text-xs mt-1 text-center">{errors[`dep_${idx}`]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
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
