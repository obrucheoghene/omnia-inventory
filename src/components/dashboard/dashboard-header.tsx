"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Sparkles,
  Zap,
  TrendingUp,
  Package,
  Clock,
  Sun,
  Moon,
  Palette,
  Globe,
  Activity,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserProfile from "@/components/auth/user-profile";
import { Progress } from "../ui/progress";

interface DashboardHeaderProps {
  className?: string;
}

export default function DashboardHeader({ className }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications] = useState(3); // Mock notification count
  const [systemHealth] = useState(94); // Mock system health percentage

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
        className
      )}
    >
      {/* Main Header Content */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Branding & Greeting */}
          <div className="flex items-center gap-6">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Omnia Inventory
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Warehouse Management System
                </p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Greeting & Time */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {getGreeting()},{" "}
                    {session?.user?.name?.split(" ")[0] || "User"}! 👋
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate()} • {formatTime()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Search & Quick Stats */}
          <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl mx-8">
            {/* Enhanced Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div
                className={cn(
                  "relative transition-all duration-300 ease-in-out",
                  searchFocused ? "transform scale-105" : ""
                )}
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search materials, projects, suppliers..."
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm transition-all duration-200",
                    "placeholder:text-slate-400 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100",
                    searchFocused ? "shadow-lg shadow-blue-100/50" : ""
                  )}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="hidden xl:flex items-center gap-3">
              <Card className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Active</p>
                    <p className="text-sm font-bold text-green-800">247</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">
                      Materials
                    </p>
                    <p className="text-sm font-bold text-blue-800">1,429</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* System Health Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/50">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <div className="w-20">
                  <Progress value={systemHealth} className="h-1.5" />
                </div>
                <span className="text-xs font-semibold text-emerald-600">
                  {systemHealth}%
                </span>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative h-10 w-10 rounded-xl hover:bg-slate-100 transition-all duration-200 hover:scale-105"
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {notifications > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {notifications > 9 ? "9+" : notifications}
                    </span>
                  </div>
                )}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-all duration-200 hover:scale-105"
              >
                <Settings className="h-5 w-5 text-slate-600" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* User Profile */}
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Secondary Header Bar - Quick Navigation */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Breadcrumb/Current Page */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="h-3 w-3" />
                <span>Last updated: 2 minutes ago</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-all duration-200"
              >
                <Zap className="h-3 w-3 mr-1" />
                Quick Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-all duration-200"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-all duration-200"
              >
                <Globe className="h-3 w-3 mr-1" />
                Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (shown on mobile) */}
      <div className="md:hidden border-t border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </header>
  );
}
