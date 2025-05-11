import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MessageSquare, FileText, Clock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AnalyticsData {
  overview: {
    total_chats: number;
    total_pdfs: number;
    active_time_minutes: number;
    messages_sent: number;
    messages_received: number;
  };
  daily_usage: {
    dates: string[];
    minutes: number[];
    chats: number[];
    pdfs: number[];
    messages: number[];
  };
}

export function AnalyticsDialog({ open, onOpenChange }: AnalyticsDialogProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  
  // For tracking active time
  const activityInterval = useRef<NodeJS.Timeout | null>(null);
  const activityMinutes = useRef<number>(0);
  
  useEffect(() => {
    if (open && user?.id) {
      fetchAnalytics();
      startActivityTracking();
    } else if (!open && activityInterval.current) {
      stopActivityTracking();
    }
    
    return () => {
      if (activityInterval.current) {
        stopActivityTracking();
      }
    };
  }, [open, user?.id]);
  
  const startActivityTracking = () => {
    // Reset the counter
    activityMinutes.current = 0;
    
    // Track time every minute
    activityInterval.current = setInterval(() => {
      activityMinutes.current += 1;
      
      // Report activity every 3 minutes
      if (activityMinutes.current % 3 === 0 && user?.id) {
        reportActivity(3);
      }
    }, 60000); // Every minute
  };
  
  const stopActivityTracking = () => {
    if (activityInterval.current) {
      clearInterval(activityInterval.current);
      activityInterval.current = null;
      
      // Report remaining time
      if (activityMinutes.current > 0 && user?.id) {
        reportActivity(activityMinutes.current % 3 || activityMinutes.current);
      }
    }
  };
  
  const reportActivity = async (minutes: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiUrl}/api/analytics/${user?.id}/track-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });
    } catch (error) {
      console.error('Failed to report activity:', error);
    }
  };
  
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/analytics/${user?.id}`);
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
      // Set fallback data
      setData({
        overview: {
          total_chats: 0,
          total_pdfs: 0,
          active_time_minutes: 0,
          messages_sent: 0,
          messages_received: 0
        },
        daily_usage: {
          dates: [],
          minutes: [],
          chats: [],
          pdfs: [],
          messages: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Format minutes into hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };
  
  // Create combined chart data
  const getChartData = () => {
    if (!data?.daily_usage) return [];
    
    const { dates = [], minutes = [], chats = [], pdfs = [], messages = [] } = data.daily_usage;
    
    return dates.map((date, i) => ({
      date,
      minutes: minutes[i] || 0,
      chats: chats[i] || 0,
      pdfs: pdfs[i] || 0,
      messages: messages[i] || 0
    }));
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-w-[90%] h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span>Your Analytics</span>
              <Badge variant="outline" className="text-xs font-normal bg-primary/10">
                {user?.firstName}&apos;s Account
              </Badge>
            </motion.div>
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[300px] rounded-xl" />
          </motion.div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full mb-6 justify-start">
              <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="cursor-pointer">Activity</TabsTrigger>
              <TabsTrigger value="usage" className="cursor-pointer">Usage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div variants={itemVariants}>
                    <Card className="hover:shadow-md transition-all bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2 text-primary" /> 
                          Total Chats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{data?.overview?.total_chats || 0}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Card className="hover:shadow-md transition-all bg-green-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-green-500" /> 
                          PDF Uploads
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{data?.overview?.total_pdfs || 0}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Card className="hover:shadow-md transition-all bg-amber-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-amber-500" /> 
                          Active Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {formatTime(data?.overview?.active_time_minutes || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Card className="hover:shadow-md transition-all bg-blue-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                          <Send className="w-4 h-4 mr-2 text-blue-500" /> 
                          Messages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{data?.overview?.messages_sent || 0}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
                
                {/* Main Chart */}
                {data?.daily_usage?.dates?.length > 0 ? (
                  <motion.div variants={itemVariants} className="mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Overview</CardTitle>
                        <CardDescription>Your activity over the last 14 days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <LineChart
                            data={getChartData()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "var(--background)", 
                                borderColor: "var(--border)",
                                borderRadius: "8px"
                              }} 
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="minutes"
                              name="Minutes Active"
                              stroke="#f59e0b"
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="messages"
                              name="Messages"
                              stroke="#3b82f6"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants} className="mt-8 text-center">
                    <Card className="py-16">
                      <CardContent>
                        <p className="text-muted-foreground">Not enough data to display charts yet. Start chatting and uploading PDFs to see your activity!</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="activity">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {data?.daily_usage?.dates?.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Activity</CardTitle>
                      <CardDescription>Time spent on the platform each day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={getChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" />
                          <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            formatter={(value) => [`${value} mins`, 'Active Time']}
                            contentStyle={{ 
                              backgroundColor: "var(--background)", 
                              borderColor: "var(--border)",
                              borderRadius: "8px"
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="minutes" 
                            name="Minutes Active" 
                            fill="var(--primary)" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="py-16">
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">No activity data available yet.</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="usage">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {data?.daily_usage?.dates?.length > 0 ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Resource Usage</CardTitle>
                        <CardDescription>Your daily chats and PDF uploads</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            data={getChartData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "var(--background)", 
                                borderColor: "var(--border)",
                                borderRadius: "8px"
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="chats" 
                              name="Chats Created" 
                              fill="var(--primary)" 
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              dataKey="pdfs" 
                              name="PDFs Uploaded" 
                              fill="var(--secondary)" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Messages</CardTitle>
                        <CardDescription>Number of messages sent each day</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={getChartData()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "var(--background)", 
                                borderColor: "var(--border)",
                                borderRadius: "8px"
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="messages"
                              name="Messages Sent"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="py-16">
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">No usage data available yet.</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 