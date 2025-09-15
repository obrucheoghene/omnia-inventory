/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Clock, Package, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Activity {
  id: string;
  type: "inflow" | "outflow";
  materialName: string;
  quantity: string;
  unitName: string;
  projectName: string;
  date: Date;
  person: string;
  createdAt: Date;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export default function RecentActivities({
  activities,
}: RecentActivitiesProps) {
  const getActivityIcon = (type: string) => {
    return type === "inflow" ? TrendingUp : TrendingDown;
  };

  const getActivityColor = (type: string) => {
    return type === "inflow"
      ? { bg: "bg-green-50", text: "text-green-600", badge: "default" }
      : { bg: "bg-red-50", text: "text-red-600", badge: "secondary" };
  };

  const getPersonInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[700px] overflow-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activities</p>
            </div>
          ) : (
            activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const colors = getActivityColor(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <ActivityIcon className={`h-4 w-4 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={colors.badge as any}>
                        {activity.type === "inflow" ? "Received" : "Released"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(new Date(activity.date))}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        <span
                          className={
                            activity.type === "inflow"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {activity.type === "inflow" ? "+" : "-"}
                          {parseFloat(activity.quantity).toLocaleString()}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {activity.unitName}
                        </span>{" "}
                        <span className="font-semibold">
                          {activity.materialName}
                        </span>
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {activity.projectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.person}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getPersonInitials(activity.person)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
