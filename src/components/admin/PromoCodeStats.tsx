import { format } from "date-fns";
import { Ticket, Users, Gift, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RecentRedemption {
  id: string;
  created_at: string;
  credits_awarded: number;
  user_email: string;
  code_name: string;
}

interface PromoStats {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  creditsDistributed: number;
  topCodes: Array<{ code: string; uses: number; credits: number }>;
  recentRedemptions: RecentRedemption[];
}

interface PromoCodeStatsProps {
  stats: PromoStats | null;
  loading: boolean;
}

export function PromoCodeStats({ stats, loading }: PromoCodeStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Codes",
      value: stats.totalCodes,
      icon: Ticket,
      color: "text-primary",
    },
    {
      title: "Active Codes",
      value: stats.activeCodes,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Total Redemptions",
      value: stats.totalRedemptions,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Credits Distributed",
      value: stats.creditsDistributed,
      icon: Gift,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Codes Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Promo Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCodes.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topCodes}>
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="uses"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Redemptions"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No redemption data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Redemptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRedemptions.length > 0 ? (
              <div className="max-h-[250px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentRedemptions.slice(0, 10).map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-medium truncate max-w-[150px]">
                          {redemption.user_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {redemption.code_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          +{redemption.credits_awarded}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No redemptions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
