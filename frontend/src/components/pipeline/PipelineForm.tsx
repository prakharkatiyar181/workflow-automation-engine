import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePipeline } from "@/hooks/usePipelines";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TextArea from "@/components/ui/TextArea";
import Select from "@/components/ui/Select";
import NumberInput from "@/components/ui/NumberInput";
import type { CreatePipelinePayload } from "@/types/pipeline";
import { Trash2, ArrowDown, Plus } from "lucide-react";
import LiveDAGPreview from "./LiveDAGPreview";

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

  const taskNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const depSelectRefs = useRef<(HTMLSelectElement | null)[]>([]);

  const addTask = useCallback(() => {
    setTasks((prev) => {
      const next = [...prev, { name: "", estimated_duration: 5, failure_probability: 0 }];
      // Focus the new task name input after render
      requestAnimationFrame(() => {
        taskNameRefs.current[next.length - 1]?.focus();
      });
      return next;
    });
  }, []);

  const removeTask = (idx: number) => {
    const removed = tasks[idx].name;
    setTasks((prev) => prev.filter((_, i) => i !== idx));
    setDependencies((prev) =>
      prev.filter((d) => d.task !== removed && d.depends_on !== removed)
    );
  };

  const updateTask = (idx: number, field: keyof TaskField, value: string | number) =>
    setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

  const addDependency = useCallback(() => {
    setDependencies((prev) => {
      const next = [...prev, { task: "", depends_on: "" }];
      requestAnimationFrame(() => {
        depSelectRefs.current[next.length - 1]?.focus();
      });
      return next;
    });
  }, []);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
      {/* Left Column: Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 xl:col-span-8 space-y-8">
        
        {/* Pipeline Details */}
        <section className="card p-6 space-y-5 shadow-lg">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pipeline Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure the core workflow metadata.</p>
          </div>
          <div className="space-y-4">
            <Input
              label="Pipeline Name"
              required
              autoFocus
              placeholder="e.g. Data Ingestion Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              helperText="Name used to identify this workflow."
            />
            <TextArea
              label="Description"
              placeholder="Optional description of what this workflow does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </section>

        {/* Tasks */}
        <section className="card p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tasks</h2>
              <p className="text-xs text-gray-500 mt-0.5">Define the individual jobs to execute.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addTask}>
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </div>

          {errors.duplicates && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errors.duplicates}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tasks.map((task, idx) => (
              <div 
                key={idx} 
                className="group bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 shadow-sm relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Task {idx + 1}</span>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => removeTask(idx)}
                      title="Remove task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <Input
                    ref={(el) => { taskNameRefs.current[idx] = el; }}
                    label="Name"
                    required
                    placeholder="e.g. Fetch Data"
                    value={task.name}
                    onChange={(e) => updateTask(idx, "name", e.target.value)}
                    error={errors[`task_${idx}_name`]}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      label="Duration (sec)"
                      min={1}
                      value={task.estimated_duration}
                      onChange={(e) => updateTask(idx, "estimated_duration", e.target.value)}
                    />
                    <NumberInput
                      label="Failure Chance"
                      min={0}
                      max={1}
                      step={0.05}
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
        <section className="card p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Dependencies</h2>
              <p className="text-xs text-gray-500 mt-0.5">Control the execution order between tasks.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addDependency}
              disabled={taskNameOptions.length < 2}
            >
              <Plus className="w-4 h-4" /> Add Dependency
            </Button>
          </div>

          {dependencies.length === 0 && (
            <div className="p-10 border border-dashed border-gray-700/50 rounded-xl text-center bg-gray-900/30">
              <p className="text-sm text-gray-400">No dependencies defined.</p>
              <p className="text-xs text-gray-500 mt-1">All tasks will run in parallel simultaneously.</p>
            </div>
          )}

          {dependencies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {dependencies.map((dep, idx) => (
                <div key={idx} className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 space-y-4 relative group hover:border-gray-600 transition-colors">
                  <button
                    type="button"
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => removeDependency(idx)}
                    title="Remove dependency"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {/* Visual Preview */}
                  <div className="flex flex-col text-sm bg-gray-950/50 p-3 rounded-lg items-center border border-gray-800/80">
                    <span className="font-mono text-gray-400 truncate w-full text-center">{dep.depends_on || "..."}</span>
                    <ArrowDown className="w-4 h-4 text-gray-600 my-1" />
                    <span className="font-mono text-blue-400 font-bold truncate w-full text-center">{dep.task || "..."}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Select
                      ref={(el) => { depSelectRefs.current[idx] = el; }}
                      value={dep.depends_on}
                      onChange={(e) => updateDependency(idx, "depends_on", e.target.value)}
                      error={errors[`dep_${idx}`]}
                    >
                      <option value="">Depends on...</option>
                      {taskNameOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Select>
                    
                    <Select
                      value={dep.task}
                      onChange={(e) => updateDependency(idx, "task", e.target.value)}
                      error={errors[`dep_${idx}`]}
                    >
                      <option value="">Task to run...</option>
                      {taskNameOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 pb-12">
          <Button type="button" variant="ghost" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} size="lg">
            Create Pipeline
          </Button>
        </div>
      </form>

      {/* Right Column: Live DAG Preview */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-8 h-[calc(100vh-6rem)]">
        <div className="card h-full flex flex-col overflow-hidden border border-gray-800 shadow-2xl">
          <div className="px-5 py-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live DAG Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Visual representation of your workflow.</p>
          </div>
          <div className="flex-1 bg-gray-950 p-2">
            <LiveDAGPreview tasks={tasks} dependencies={dependencies} />
          </div>
        </div>
      </div>
    </div>
  );
}
