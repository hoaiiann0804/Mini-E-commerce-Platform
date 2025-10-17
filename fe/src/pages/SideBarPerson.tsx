import React, { useState } from "react";
import { FaUserCog } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { IoHeart } from "react-icons/io5";
import ProfilePage from "./ProfilePage";
import { IoIosNotifications } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";

// icon: React.ElementType → cho phép bạn lưu một component (ví dụ FaUserCog).
// có thể định nghĩa kiểu riêng cho IconType
type IconType = React.ElementType;
type NavigationRoute = {
  key: string;
  path: string;
  label: string;
  icon: IconType;
};
//Đổi màu highlight cho Icon thư viện reactjs-icon

const SideBarPerson = () => {
  const location = useLocation();
  const MenuNavItem: NavigationRoute[] = [
    {
      key: "profile",
      path: "/user/profile",
      label: "Profile",
      icon: FaUserCog,
    },
    {
      key: "wishlist",
      path: "/user/wishlist",
      label: "Wishlist",
      icon: IoHeart,
    },
    {
      key: "address",
      path: "/user/wishlist",
      label: "Manager Address",
      icon: FaMapMarkerAlt,
    },
    {
      key: "notifications",
      path: "/user/setting",
      label: "Notifications",
      icon: IoIosNotifications,
    },
    {
      key: "setting",
      path: "/user/setting",
      label: "Setting",
      icon: IoIosSettings,
    },
  ];
  const IconWrapper = ({
    icon: Icon,
    active,
  }: {
    icon: React.ElementType;
    active: boolean;
  }) => (
    <Icon
      className={`${active ? "text-primary-600" : "text-neutral-400"} transition-colors duration-200`}
      size={22}
    />
  );
  return (
    <div>
      <div className="flex flex-col: md:flex-row">
        {/* <p>Hello Mother</p> */}

        <div className="hidden md:block w-64 bg-white dark:bg-neutral-800 min-h-screen shadow-sm border-r border-neutral-200  ">
          {/* //Desktop sidebar */}
          <nav className="px-6 py-6">
            <ul className="space-y-2">
              {MenuNavItem.map((item) => {
                // const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.key}>
                    <Link
                      //   to={"#"}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium "
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <IconWrapper icon={item.icon} active={isActive} />

                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default SideBarPerson;
