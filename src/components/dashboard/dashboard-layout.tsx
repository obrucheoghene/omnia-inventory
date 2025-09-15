"use client";

import React, { ReactNode, useState } from "react";
import DashboardNav from "./dashboard-nav";
import UserProfile from "../auth/user-profile";
import { Menu, Sparkles } from "lucide-react";

const DashboardLayoutComp = ({ children }: { children: ReactNode }) => {
  const [showNav, setShowNav] = useState(true);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center ">
            {/* Logo & Brand */}
            <Menu
              className=" h-5 w-5 lg:hidden"
              onClick={() => setShowNav((prev) => !prev)}
            />

            <div className="hidden lg:flex items-center gap-3">
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
            <UserProfile />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="relative flex gap-6 h-full ">
          {showNav && (
            <div className="w-64 flex-shrink-0 absolute lg:static z-10 ">
              <DashboardNav />
            </div>
          )}
          <main className="flex-1 min-h-[calc(100vh-140px)]">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayoutComp;
