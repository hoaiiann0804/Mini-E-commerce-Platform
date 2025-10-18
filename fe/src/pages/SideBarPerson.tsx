import React, { useEffect, useState } from "react";
import { FaUserCog } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { IoHeart } from "react-icons/io5";
import ProfilePage from "./ProfilePage";
import { IoIosNotifications } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { ConfigProvider, Drawer, theme as antdTheme, Button } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWith, setWindowWidth] = useState(window.innerWidth);
  const theme = useSelector((state: RootState) => state.ui.theme);
  //Handle window resize for responsive design
  useEffect(() => {
    const HandleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };

    window.addEventListener("resize", HandleResize);
    return () => window.removeEventListener("resize", HandleResize);
  });

  const MenuNavItem: NavigationRoute[] = [
    {
      key: "profile",
      path: "profile",
      label: "Profile",
      icon: FaUserCog,
    },
    {
      key: "wishlist",
      path: "wishlist",
      label: "Wishlist",
      icon: IoHeart,
    },
    {
      key: "address",
      path: "address",
      label: "Manager Address",
      icon: FaMapMarkerAlt,
    },
    {
      key: "notifications",
      path: "notifications",
      label: "Notifications",
      icon: IoIosNotifications,
    },
    {
      key: "setting",
      path: "setting",
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
      className={`${active ? "text-primary-600 group-hover:text-primary-800" : "text-neutral-400 group-hover:text-neutral-900"} transition-colors duration-200`}
      size={22}
    />
  );
  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <div className=" bg-neutral-50 dark:bg-neutral-900">
        {/* min-h-screen */}
        {/* Admin Header */}
        <div className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
          <div className="px-4 md:flex-row py-4 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  className="md:hidden text-neutral-700 dark:text-neutral-300"
                  onClick={() => setMobileMenuOpen(true)}
                />

                {/* <h1 className="hidden text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                </h1> */}
                {/* <div className="hidden md:flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col: md:flex-row">
          {/* Mobile Sidebar drawer */}
          <Drawer
            title="Menu Profile"
            placement="left"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            width={280}
            bodyStyle={
              {
                // borderBottom: `1px solid ${theme === "dark" ? "#424242" : "#f0f0f0"}`,
                // background: theme === "dark" ? "#141414" : "#fff",
                // color: theme === "dark" ? "#fff" : "#000",
              }
            }
          >
            <nav className="px-0 py-4">
              <ul className="space-y-2">
                {MenuNavItem.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.key}>
                      <Link
                        // to={"#"}
                        to={item.path}
                        className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
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
          </Drawer>

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
                        // to={"#"}
                        to={item.path}
                        className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
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
    </ConfigProvider>
  );
};

export default SideBarPerson;
