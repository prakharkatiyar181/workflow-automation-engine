import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import CreatePipeline from "@/pages/CreatePipeline";
import ExecutionDetail from "@/pages/ExecutionDetail";
import PipelineDetail from "@/pages/PipelineDetail";

/**
 * Root application component.
 *
 * Defines top-level routing.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreatePipeline />} />
        <Route path="/pipelines/:id" element={<PipelineDetail />} />
        <Route path="/executions/:id" element={<ExecutionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

