import React from "react";
import { Outlet } from "react-router-dom";
import SideBarPerson from "@/pages/SideBarPerson";

const UserLayout: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <SideBarPerson />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;
