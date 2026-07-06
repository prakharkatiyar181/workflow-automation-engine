import Layout from "@/components/layout/Layout";
import PipelineForm from "@/components/pipeline/PipelineForm";

export default function CreatePipeline() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Pipeline</h1>
          <p className="text-sm text-gray-400 mt-1">Design a new workflow DAG</p>
        </div>
        
        <PipelineForm />
      </div>
    </Layout>
  );
}
