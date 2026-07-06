import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";

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
        {/* Phase 1: placeholder dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Phase 6 routes — uncomment when implemented:
        <Route path="/create" element={<CreatePipeline />} />
        <Route path="/executions/:id" element={<ExecutionDetail />} />
        */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
