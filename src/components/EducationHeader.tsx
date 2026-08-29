import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EducationHeader = () => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleBackClick = () => {
    // 显示确认对话框
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    // 检查是否是从 SuperAdd 页面代登录过来的
    const isImpersonated = localStorage.getItem("impersonatedByAdmin") === "true";
    
    // 添加调试日志
    console.log("[退出登录] 检查代登录标记:", {
      isImpersonated,
      impersonatedValue: localStorage.getItem("impersonatedByAdmin"),
      currentUser: localStorage.getItem("currentUser")
    });
    
    // 清除用户登录状态
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("auth_login_timestamp");
    localStorage.removeItem("auth_session_duration");
    localStorage.removeItem("impersonatedByAdmin"); // 清除代登录标记
    
    if (isImpersonated) {
      // 如果是代登录，返回 SuperAdd 页面
      console.log("[退出登录] 跳转到 SuperAdd 页面");
      navigate("/superadd");
    } else {
      // 否则跳转到登录页面
      console.log("[退出登录] 跳转到登录页面");
      navigate("/login");
    }
    
    // 关闭对话框
    setShowLogoutDialog(false);
  };

  const handleCancelLogout = () => {
    // 取消退出，关闭对话框
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="text-white sticky top-0 z-50 shadow-md" style={{ backgroundColor: 'rgb(37, 184, 135)' }}>
        <div className="flex items-center justify-center py-[14.4px] px-4 relative">
          <button 
            className="absolute left-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={handleBackClick}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-medium">高等教育信息</h1>
        </div>
      </header>

      {/* 退出确认对话框框 */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要退出登录吗？退出后需要重新登录才能访问您的信息。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLogout}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>确认退出</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EducationHeader;
