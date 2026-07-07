import Layout from "@/components/layout/Layout";
import PipelineForm from "@/components/pipeline/PipelineForm";

export default function CreatePipeline() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PipelineForm />
      </div>
    </Layout>
  );
}
