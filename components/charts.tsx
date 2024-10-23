"use client";
import React, { useMemo } from "react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import ms from "ms";
import { staticData } from "@/app/data";
import { IssueAnalytics } from "@/app/types/analytics";

const { timeFromOpenToClose, timeFromPrOpenToIssueClose, contributorsData } = processData(staticData);

const contributorsConfig = {
  contributors: {
    label: "Contributors",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const averageTimeConfig = {
  openToClose: {
    label: "Time (h)",
    color: "#2563eb",
  },
  prOpenToIssueClose: {
    label: "Time (h)",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

function formatTime(time: number) {
  return ms(time, { long: true });
}

function processData(data: typeof staticData) {
  const timeFromOpenToClose: { issue: string; time: number | null; url: string }[] = [];
  const timeFromPrOpenToIssueClose: { issue: string; time: number | null; url: string }[] = [];
  const contributorsData: { issue: string; contributors: number | null; url: string }[] = [];

  Object.keys(data).forEach((owner) => {
    const ownerKey = owner as keyof typeof data;
    Object.keys(data[ownerKey]).forEach((repo) => {
      const repoKey = repo as keyof (typeof data)[typeof ownerKey];
      Object.keys(data[ownerKey][repoKey]).forEach((issueNumber) => {
        const issueNumberKey = issueNumber as keyof (typeof data)[typeof ownerKey][typeof repoKey];
        const issueData = data[ownerKey][repoKey][issueNumberKey] as IssueAnalytics;
        const urlKey = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
        timeFromOpenToClose.push({
          issue: `#${issueNumber}`,
          time: issueData.timeFromOpenToClose,
          url: urlKey,
        });
        timeFromPrOpenToIssueClose.push({
          issue: `#${issueNumber}`,
          time: issueData.timeFromPrOpenToIssueClose,
          url: urlKey,
        });
        contributorsData.push({
          issue: `#${issueNumber}`,
          contributors: issueData.totalContributorsThatAttempted,
          url: urlKey,
        });
      });
    });
  });

  return { timeFromOpenToClose, timeFromPrOpenToIssueClose, contributorsData };
}

export function AverageTimeChart() {
  const openToClose = useMemo(() => timeFromOpenToClose.filter((data) => data.time !== null), [timeFromOpenToClose]);
  const prOpenToClose = useMemo(() => timeFromPrOpenToIssueClose.filter((data) => data.time !== null), [timeFromPrOpenToIssueClose]);

  // Merging data from both datasets
  const mergedData = useMemo(() => {
    return openToClose.map((item, index) => ({
      ...item,
      prTime: prOpenToClose[index]?.time || 0, // Use the same index or key to map prTime
    }));
  }, [openToClose, prOpenToClose]);

  return (
    <ChartContainer config={averageTimeConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mergedData} accessibilityLayer>
          <XAxis dataKey="issue" tickLine={true} tickMargin={10} axisLine={true} />
          <YAxis tickLine={false} tickMargin={10} axisLine={true} tickFormatter={(value) => `${(value / (1000 * 60 * 60)).toFixed(1)}h`} />
          <ChartTooltip
            formatter={(value, name) => {
              let label = "";
              if (name === "time") {
                label = "Issue Opened for";
              } else if (name === "prTime") {
                label = "Pull Opened for";
              }
              return [`${label}: ${formatTime(value)}`];
            }}
            content={<ChartTooltipContent />}
          />
          <ChartLegend content={<ChartLegendContent />} />

          <Bar
            className="cursor-pointer"
            dataKey="time"
            fill={averageTimeConfig.openToClose.color}
            stackId="a"
            radius={4}
            onClick={(data) => {
              if (data.url) {
                window.open(data.url, "_blank");
              }
            }}
          />

          <Bar
            className="cursor-pointer"
            dataKey="prTime"
            fill={averageTimeConfig.prOpenToIssueClose.color}
            stackId="a"
            radius={4}
            onClick={(data) => {
              if (data.url) {
                window.open(data.url, "_blank");
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function ContributorsChart() {
  return (
    <ChartContainer config={contributorsConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={contributorsData}>
          <XAxis dataKey="issue" tickLine={false} tickMargin={10} axisLine={false} />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="contributors" fill={contributorsConfig.contributors.color} radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
