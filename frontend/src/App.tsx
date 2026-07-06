import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import CreatePipeline from "@/pages/CreatePipeline";
import ExecutionDetail from "@/pages/ExecutionDetail";

/**
 * Root application component.
 *
 * Defines top-level routing. Additional routes will be added per phase:
 *   Phase 6: /create, /executions/:id
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreatePipeline />} />
        <Route path="/executions/:id" element={<ExecutionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
