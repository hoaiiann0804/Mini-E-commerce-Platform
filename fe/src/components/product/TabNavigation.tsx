import React from "react";
import { Button, Space, Alert } from "antd";
import {
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabOrder: string[];
  isLastTab?: boolean;
  completedSteps?: Record<string, boolean>;
  onSubmit?: () => void | Promise<void>;
  isSubmitting?: boolean;
  submitText?: string;
  loadingText?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  tabOrder,
  isLastTab = false,
  completedSteps = {},
  onSubmit,
  isSubmitting = false,
  submitText = "Tạo sản phẩm",
  loadingText = "Đang tạo...",
}) => {
  const currentIndex = tabOrder.indexOf(activeTab);
  const nextTab =
    currentIndex < tabOrder.length - 1 ? tabOrder[currentIndex + 1] : null;

  const prevTab = currentIndex > 0 ? tabOrder[currentIndex - 1] : null;

  const handleNext = () => {
    // Chỉ cho phép chuyển sang bước tiếp theo nếu bước hiện tại đã hoàn thành
    if (nextTab && completedSteps[activeTab]) {
      setActiveTab(nextTab);
    } else if (nextTab) {
      // Hiển thị thông báo nếu bước hiện tại chưa hoàn thành
      alert("Vui lòng hoàn thành bước hiện tại trước khi tiếp tục");
    }
  };

  const handlePrev = () => {
    if (prevTab) {
      setActiveTab(prevTab);
    }
  };

  // Kiểm tra xem tất cả các step đã hoàn thành chưa
  const allStepsCompleted = Object.values(completedSteps).every((step) => step);

  // Nếu là tab cuối cùng, hiển thị button tạo sản phẩm nếu tất cả step hoàn thành
  if (isLastTab || !nextTab) {
    if (isLastTab && allStepsCompleted && onSubmit) {
      return (
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Alert
            message="Tất cả các bước đã hoàn thành"
            description="Bạn có thể tạo sản phẩm ngay bây giờ."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space>
            {prevTab && (
              <Button
                onClick={handlePrev}
                icon={<ArrowLeftOutlined />}
                size="large"
              >
                Quay lại
              </Button>
            )}
            <Button
              type="primary"
              onClick={() => onSubmit?.()}
              icon={<SaveOutlined />}
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
              style={{ minWidth: 150 }}
            >
              {isSubmitting ? loadingText : submitText}
            </Button>
          </Space>
        </div>
      );
    }
    return null;
  }

  // Kiểm tra xem bước hiện tại đã hoàn thành chưa
  const isCurrentStepCompleted = completedSteps[activeTab] || false;

  return (
    <div style={{ marginTop: 24, textAlign: "right" }}>
      <Alert
        message={
          isCurrentStepCompleted
            ? "Bước này đã hoàn thành"
            : "Hoàn thành bước này trước khi tiếp tục"
        }
        description={
          isCurrentStepCompleted
            ? "Bạn có thể tiếp tục sang bước tiếp theo."
            : "Vui lòng điền đầy đủ thông tin ở bước này trước khi chuyển sang bước tiếp theo."
        }
        type={isCurrentStepCompleted ? "success" : "info"}
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Space>
        {prevTab && (
          <Button
            onClick={handlePrev}
            icon={<ArrowLeftOutlined />}
            size="large"
          >
            Quay lại
          </Button>
        )}
        <Button
          type="primary"
          onClick={handleNext}
          icon={<ArrowRightOutlined />}
          size="large"
          disabled={!isCurrentStepCompleted}
        >
          Tiếp theo
        </Button>
      </Space>
    </div>
  );
};

export default TabNavigation;
