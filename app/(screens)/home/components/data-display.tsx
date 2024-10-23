"use client";
import { IssueLifeCycle } from "@/components/issue-lifecycle-chart";
import { Sidebar } from "@/components/sidebar";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="container mx-auto mt-24">{children}</div>;
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

function DataDisplay() {
  const [activeView, setActiveView] = useState("Issues Analytics");

  return (
    <div className="w-full h-full">
      <Sidebar
        activeView="analytics"
        onChangeView={() => {}}
        views={["Issues Analytics", "Pull Requests Analytics", "Contributors Analytics", "Community Analytics"]}
      />

      <Container>
        <Tabs defaultValue="issue" className="my-8 py-4">
          <TabsList className="flex justify-center space-x-4">
            <TabsTrigger value="issue">Issue Lifecycle</TabsTrigger>
            <TabsTrigger value="pull-request">Pull Lifecycle</TabsTrigger>
          </TabsList>
          <TabsContent value="issue">
            <div className="grid grid-rows-1 gap-8">
              <div className="p-4 rounded shadow">
                <IssueLifeCycle />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="pull-request">
            <div className="grid grid-rows-1 gap-8">
              <div className="p-4 rounded shadow">
                <IssueLifeCycle />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}

export default DataDisplay;
