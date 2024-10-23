import { AverageTimeChart } from "@/components/charts";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="container mx-auto mt-24">{children}</div>;
}

function DataDisplay() {
  return (
    <div className="w-full h-full">
      <Container>
        <h1 className="text-3xl font-bold mb-8 text-center">Issues Analytics</h1>
        <div className="grid grid-rows-1 gap-8">
          <div className="p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Average Time to Close Issues</h2>
            <AverageTimeChart />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default DataDisplay;
