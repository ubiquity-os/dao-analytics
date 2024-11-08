"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { staticData } from "@/app/data";
import { IssueAnalytics } from "@/app/types/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-range";
import ms from "ms";

const analysis = processData(staticData);

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

// Leaderboard of most merged PRs
const mergedPRsByUser = analysis.reduce((acc: Record<string, number>, item) => {
  const user = item.pullRequest?.user?.login || "Unknown";
  acc[user] = (acc[user] || 0) + 1;
  return acc;
}, {});

const mergedPRsLeaderboard = Object.entries(mergedPRsByUser)
  .map(([user, count]) => ({ user, count }))
  .sort((a, b) => b.count - a.count);

// Tasks open for the longest
const tasksOpenLongest = analysis
  .map((item) => ({
    ...item,
    timeOpen: item.issue?.closed_at
      ? new Date(item.issue?.closed_at).getTime() - new Date(item.issue?.created_at).getTime()
      : new Date().getTime() - new Date(item.issue?.created_at).getTime(),
  }))
  .sort((a, b) => b.timeOpen - a.timeOpen);

// PRs that took the longest
const prsTookLongest = analysis
  .map((item) => ({
    ...item,
    prDuration: item.pullRequest?.merged_at ? new Date(item.pullRequest?.merged_at).getTime() - new Date(item.pullRequest?.created_at).getTime() : 0,
  }))
  .filter((item) => item.prDuration > 0)
  .sort((a, b) => b.prDuration - a.prDuration);

export function IssueLifeCycle() {
  const [selectedData, setSelectedData] = useState<IssueAnalytics | null>(null);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

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

  const filteredData = useMemo(() => {
    return analysis.filter((item) => {
      const matchesFilter = filter === "All" || item.repo === filter || item.owner === filter;
      const matchesDateRange =
        (!dateRange.from || new Date(item.issue?.created_at) >= dateRange.from) && (!dateRange.to || new Date(item.issue?.created_at) <= dateRange.to);
      return matchesFilter && matchesDateRange;
    });
  }, [filter, dateRange]);

  const sortedData = useMemo(() => {
    return filteredData.slice().sort((a, b) => {
      if ("issue" in a && "issue" in b) {
        return a.issue.number - b.issue.number;
      } else if ("pullRequest" in a && "pullRequest" in b) {
        return a.pullRequest.number - b.pullRequest.number;
      } else {
        console.log("Found nothing to sort by", a, b);
        return 0;
      }
    });
  }, [filteredData]);

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row">
        {/* Main Content */}
        <div className="w-full md:w-3/4 order-2 md:order-1 p-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center space-x-4 mb-4">
            <Select onValueChange={(value) => setFilter(value)} defaultValue="All">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Repo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {Array.from(new Set(analysis.map((item) => item.repo))).map((repo) => (
                  <SelectItem key={repo} value={repo}>
                    {repo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker dateRange={dateRange} setDateRange={setDateRange} />

            <Input placeholder="Search..." className="max-w-xs" />
          </div>

          {/* Chart */}
          <div className="h-[300px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData}>
                <XAxis
                  dataKey="issue.number"
                  tickLine={false}
                  tickMargin={1}
                  axisLine={true}
                  label={{ value: "Issue Number", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  tickLine={false}
                  tickMargin={10}
                  axisLine={true}
                  tickFormatter={(value) => `${(value / (1000 * 60 * 60 * 24)).toFixed(0)}d`}
                  label={{ value: "Duration (days)", angle: -90, position: "insideLeft", offset: 0 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />

                <Bar name="Time from Open to Close" dataKey="timeFromOpenToClose" fill={barColors.timeFromOpenToClose} onClick={handleBarClick} />

                <Bar
                  name="Time from PR Open to Issue Close"
                  dataKey="timeFromPrOpenToIssueClose"
                  fill={barColors.timeFromPrOpenToIssueClose}
                  onClick={handleBarClick}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-1/4 order-1 md:order-2 p-4 bg-background border-t md:border-t-0 md:border-r">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <h3 className="text-lg font-bold mb-4">Aggregates</h3>

            <div className="mb-6">
              <h4 className="font-semibold text-sm mb-2">Top Contributors</h4>
              <div className="space-y-2">
                {mergedPRsLeaderboard.slice(0, 5).map((item) => (
                  <Card key={item.user}>
                    <CardHeader className="flex text-md items-center justify-between p-2">
                      <CardTitle className="text-md">{item.user}</CardTitle>
                      <Badge variant="secondary" className="text-md">
                        {item.count} PRs
                      </Badge>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-sm mb-2">Tasks Open Longest</h4>
              <div className="space-y-2">
                {tasksOpenLongest.slice(0, 5).map((item) => (
                  <Card key={item.issue?.id} className="cursor-pointer" onClick={() => handleBarClick(item)}>
                    <CardHeader className="p-2">
                      <CardTitle className="text-md">Issue #{item.issue?.number}</CardTitle>
                      <p className="text-md text-muted-foreground">{(item.timeOpen / (1000 * 60 * 60 * 24)).toFixed(0)} days</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">PRs That Took Longest</h4>
              <div className="space-y-2">
                {prsTookLongest.slice(0, 5).map((item) => (
                  <Card key={item.pullRequest?.id} className="cursor-pointer" onClick={() => handleBarClick(item)}>
                    <CardHeader className="p-2">
                      <CardTitle className="text-md">PR #{item.pullRequest?.number}</CardTitle>
                      <p className="text-md text-muted-foreground">{(item.prDuration / (1000 * 60 * 60 * 24)).toFixed(0)} days</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedData && (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {selectedData.owner}/{selectedData.repo}
                  </h3>
                  <h2 className="text-2xl font-bold">{selectedData.issue?.title}</h2>
                </div>
                <DialogTrigger asChild>
                  <Button variant="ghost" onClick={closeModal}>
                    ✕
                  </Button>
                </DialogTrigger>
              </div>

              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <div className="space-y-4">
                    <div>
                      <Label>Contributors</Label>
                      <div className="flex space-x-2 mt-1">
                        <Badge variant="secondary">{selectedData.pullRequest?.user?.login}</Badge>
                        <Badge variant="secondary">{selectedData.issue?.user?.login}</Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Reviewers</Label>
                      <div className="flex space-x-2 mt-1">
                        {selectedData.pullRequest?.requested_reviewers?.map((reviewer) => (
                          <Badge key={reviewer?.id} variant="secondary">
                            {reviewer?.login}
                          </Badge>
                        )) || <p>None</p>}
                      </div>
                    </div>

                    <div>
                      <Label>Labels</Label>
                      <div className="flex space-x-2 mt-1">
                        {selectedData.issue?.labels?.map((label) =>
                          typeof label === "string" ? (
                            <Badge key={label} variant="outline">
                              {label}
                            </Badge>
                          ) : (
                            <Badge key={label.id} variant="outline">
                              {label.name}
                            </Badge>
                          )
                        ) || <p>None</p>}
                      </div>
                    </div>

                    <div>
                      <Label>State</Label>
                      <p>{selectedData.issue?.state || "N/A"}</p>
                    </div>

                    <div>
                      <Label>Timeline</Label>
                      <ul className="list-disc list-inside">
                        <li>
                          Created At:{" "}
                          {new Date(selectedData.issue?.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </li>
                        <li>
                          Closed At:{" "}
                          {selectedData.issue?.closed_at
                            ? new Date(selectedData.issue?.closed_at).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "N/A"}
                        </li>
                        <li>
                          Last Update:{" "}
                          {new Date(selectedData.issue?.updated_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </li>
                      </ul>
                    </div>

                    <div>
                      <Label>Links</Label>
                      <ul className="list-disc list-inside">
                        <li>
                          <a href={selectedData.issue?.html_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                            View Issue
                          </a>
                        </li>
                        {selectedData.pullRequest && (
                          <li>
                            <a href={selectedData.pullRequest?.html_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                              View Pull Request
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics">
                  <div className="space-y-4">
                    <div>
                      <Label>Time from Open to Close</Label>
                      <p>{(selectedData.timeFromOpenToClose! / (1000 * 60 * 60 * 24)).toFixed(2)} days</p>
                    </div>

                    <div>
                      <Label>Time from PR Open to Issue Close</Label>
                      <p>{(selectedData.timeFromPrOpenToIssueClose! / (1000 * 60 * 60 * 24)).toFixed(2)} days</p>
                    </div>

                    <div>
                      <Label>Total Contributors Attempted</Label>
                      <p>{selectedData.totalContributorsThatAttempted}</p>
                    </div>

                    <div>
                      <Label>Has Multiple Linked PRs</Label>
                      <p>{selectedData.hasMultipleLinkedPrs ? "Yes" : "No"}</p>
                    </div>

                    <div>
                      <Label>Total PRs from Author that Closed Issue</Label>
                      <p>{selectedData.totalPrsFromAuthorThatClosedIssue}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comments">
                  <div className="space-y-4">
                    <Label>Description</Label>
                    <p>{selectedData.issue?.body || "No description provided."}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className=" p-2 rounded shadow bg-gray-800 text-white">
        <p className="label font-semibold">Issue #{data.issue.number}</p>
        <p className="intro">{data.issue.title}</p>
        <p className="desc">Time Open: {ms(data.timeFromOpenToClose, { long: true })}</p>
        <p className="desc">Merged PR:{ms(data.timeFromPrOpenToIssueClose, { long: true })}</p>
      </div>
    );
  }

  return null;
}
