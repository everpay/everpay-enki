import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DeveloperSidebar } from "@/components/developer/DeveloperSidebar";
import { DeveloperHeader } from "@/components/developer/DeveloperHeader";

const DeveloperPortal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-background">
      <DeveloperSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-56" : "ml-16"}`}>
        <DeveloperHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 lg:p-8 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DeveloperPortal;
