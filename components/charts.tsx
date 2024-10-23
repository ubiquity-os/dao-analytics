"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { staticData } from "@/app/data";
import { IssueAnalytics } from "@/app/types/analytics";
//@ts-expect-error - This is a type error
import ms from "ms";

const analysis = processData(staticData);

const contributorsConfig = {
  contributors: {
    label: "Contributors",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const averageTimeConfig = {
  timeFromOpenToClose: {
    label: "Time (h)",
  },
} satisfies ChartConfig;

function formatTime(time: number | string) {
  return;
}

function processData(data: typeof staticData) {
  const analytics: IssueAnalytics[] = [];

  Object.keys(data).forEach((owner) => {
    const ownerKey = owner as keyof typeof data;
    Object.keys(data[ownerKey]).forEach((repo) => {
      const repoKey = repo as keyof (typeof data)[typeof ownerKey];
      Object.keys(data[ownerKey][repoKey]).forEach((issueNumber) => {
        const issueNumberKey = issueNumber as keyof (typeof data)[typeof ownerKey][typeof repoKey];
        const issueData = data[ownerKey][repoKey][issueNumberKey] as IssueAnalytics;
        const urlKey = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
        analytics.push({
          url: urlKey,
          owner,
          repo,
          ...issueData,
        });
      });
    });
  });

  return analytics;
}

export function AverageTimeChart() {
  const [selectedData, setSelectedData] = useState<IssueAnalytics | null>(null);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  const handleBarClick = (data: IssueAnalytics) => {
    setSelectedData(data);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedData(null);
  };

  const keyboardNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (!isModalOpen) return;

      const currentIndex = selectedData ? analysis.findIndex((item) => item.pullRequest.node_id === selectedData.pullRequest.node_id) : -1;

      switch (event.key) {
        case "Tab":
          if (!event.shiftKey) document.getElementById("modal-close-button")?.focus();
          break;
        case "Enter":
        case " ":
          closeModal();
          break;
        case "ArrowRight":
          setSelectedData(analysis[(currentIndex + 1) % analysis.length]);
          break;
        case "ArrowLeft":
          setSelectedData(analysis[(currentIndex - 1 + analysis.length) % analysis.length]);
          break;
        default:
          break;
      }
    },
    [isModalOpen, selectedData]
  );

  useEffect(() => {
    document.addEventListener("keydown", keyboardNavigation);
    return () => document.removeEventListener("keydown", keyboardNavigation);
  }, [keyboardNavigation]);

  const barColors = {
    timeFromOpenToClose: "#4a90e2",
    timeFromPrOpenToIssueClose: "#8ab6d6",
  };

  return (
    <>
      {/* Chart */}
      <ChartContainer config={averageTimeConfig} className="min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analysis}>
            <XAxis dataKey="issue" tickLine={true} tickMargin={10} axisLine={true} />
            <YAxis tickLine={false} tickMargin={10} axisLine={true} tickFormatter={(value) => `${(value / (1000 * 60 * 60 * 24)).toFixed(0)}d`} />
            <ChartTooltip
              formatter={(value, name) => [ms(value, { long: true }), name === "timeFromOpenToClose" ? " to close the issue" : " to merge the PR"]}
              content={<ChartTooltipContent />}
            />
            <ChartLegend content={<ChartLegendContent />} />

            <Bar
              className="cursor-pointer"
              dataKey="timeFromOpenToClose"
              fill={barColors.timeFromOpenToClose}
              stackId="a"
              radius={4}
              onClick={handleBarClick}
            />

            <Bar
              className="cursor-pointer"
              dataKey="timeFromPrOpenToIssueClose"
              fill={barColors.timeFromPrOpenToIssueClose}
              stackId="a"
              radius={4}
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Modal */}
      {isModalOpen && selectedData && (
        <div className="fixed inset-0 z-50 flex justify-end items-start">
          <div className="bg-[#3349] w-1/3 h-full shadow-lg p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8 mt-12 border-b border-gray-700 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400">
                  {selectedData?.owner}/{selectedData?.repo}
                </h3>
                <h2 className="text-2xl font-bold text-white">{selectedData?.issue?.title}</h2>
              </div>
              <button id="modal-close-button" className="text-gray-400 hover:text-gray-200 text-5xl cursor-pointer" onClick={closeModal}>
                &times;
              </button>
            </div>

            <div className="space-y-6 text-gray-300">
              <Section title="Contributors">
                <div className="flex justify-between">
                  <DetailItem label="PR Author" value={selectedData?.pullRequest?.user?.login} />
                  <DetailItem label="Issue Author" value={selectedData?.issue?.user?.login || "None"} />
                </div>
                <DetailItem label="Issue Assignee" value={selectedData?.issue?.assignee?.login || "None"} />
              </Section>

              <Section title="Details">
                <DetailItem
                  label="Reviewers"
                  value={selectedData?.pullRequest?.requested_reviewers?.map((reviewer) => reviewer?.login)?.join(", ") || "None"}
                />
                <DetailItem
                  label="Labels"
                  value={selectedData?.issue?.labels?.map((label) => (typeof label === "string" ? label : label.name))?.join(", ") || "None"}
                />
                <div className="flex justify-between">
                  <DetailItem label="Active State" value={selectedData?.issue?.state || "N/A"} />
                  <DetailItem label="State Reason" value={selectedData?.issue?.state_reason || "N/A"} />
                </div>
              </Section>

              <Section title="Timeline">
                <DetailItem label="Created At" value={new Date(selectedData?.issue?.created_at)?.toLocaleString()} />
                <DetailItem label="Updated At" value={new Date(selectedData?.issue?.updated_at)?.toLocaleString()} />
                <DetailItem label="Closed At" value={selectedData?.issue?.closed_at ? new Date(selectedData?.issue?.closed_at)?.toLocaleString() : "N/A"} />
              </Section>

              <Section title="Reactions">
                <Reactions reactions={selectedData?.issue?.reactions || {}} labels={["+1", "-1", "laugh", "hooray", "confused", "heart", "rocket", "eyes"]} />
              </Section>

              <Section title="Links">
                <DetailLink label="PR URL" url={selectedData?.pullRequest?.html_url} />
                <DetailLink label="Issue URL" url={selectedData?.issue?.html_url} />
              </Section>

              <Section title="Description">
                <p className="text-gray-400 font-sans lowercase tracking-wide text-lg overflow-ellipsis overflow-hidden">
                  {selectedData?.issue?.body || "No description provided."}
                </p>
              </Section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-lg font-semibold text-gray-100">{title}</h4>
      {children}
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}

function DetailLink({ label, url }: { label: string; url: string }) {
  return (
    <p>
      <strong>{label}:</strong>{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
        {url}
      </a>
    </p>
  );
}

function Reactions({ reactions, labels }: { reactions: Record<string, number | string>; labels: string[] }) {
  return (
    <div className="flex space-x-4">
      {labels.map((label) => (
        <p key={label}>
          {label}: {reactions[label] || 0}
        </p>
      ))}
    </div>
  );
}
