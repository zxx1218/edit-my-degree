import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Download, ArrowRight, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DegreeVerificationDialog from "@/components/DegreeVerificationDialog";
import EducationRegistrationDialog from "@/components/EducationRegistrationDialog";
import StudentStatusDialog from "@/components/StudentStatusDialog";
import LoadingDialog from "@/components/LoadingDialog";
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
import { toast } from "sonner";

const VerificationReport = () => {
  const navigate = useNavigate();
  const [degreeDialogOpen, setDegreeDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [studentStatusDialogOpen, setStudentStatusDialogOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showAccessConfirm, setShowAccessConfirm] = useState(false);
  const [currentPdfLimit, setCurrentPdfLimit] = useState(0);
  const [showPdfCostConfirm, setShowPdfCostConfirm] = useState(false);
  const [pendingReportType, setPendingReportType] = useState<'studentStatus' | 'degree' | 'education' | null>(null);
  
  // 从环境变量读取PDF积分购买链接
  const cardPdfUrl = import.meta.env.VITE_CARD_PDF_URL || "http://4ox.cn/sdms3r";

  const handleReportClick = (type: 'studentStatus' | 'degree' | 'education') => {
    // Get current PDF limit before showing confirmation dialog
    const currentUserStr = localStorage.getItem("currentUser");
    console.log("currentUser from localStorage:", currentUserStr);
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      console.log("currentUser object:", currentUser);
      console.log("pdf_limit value:", currentUser.pdf_limit);
      setCurrentPdfLimit(currentUser.pdf_limit || 0);
    }
    
    // 显示PDF积分消耗确认对话框
    setPendingReportType(type);
    setShowPdfCostConfirm(true);
  };

  // 处理PDF积分确认
  const handlePdfCostConfirm = () => {
    setShowPdfCostConfirm(false);
    
    if (!pendingReportType) return;
    
    // 直接打开对应的对话框
    if (pendingReportType === 'studentStatus') {
      setStudentStatusDialogOpen(true);
    } else if (pendingReportType === 'degree') {
      setDegreeDialogOpen(true);
    } else if (pendingReportType === 'education') {
      setEducationDialogOpen(true);
    }
    
    setPendingReportType(null);
  };

  // 处理PDF积分购买
  const handlePurchasePdfCredits = () => {
    window.open(cardPdfUrl, "_blank");
  };

  const handleEducationBackgroundAccess = async () => {
    setShowAccessConfirm(false);
    setIsLoadingData(true);

    try {
      const currentUserStr = localStorage.getItem("currentUser");
      if (!currentUserStr) {
        toast.error("未找到用户信息，请重新登录");
        setIsLoadingData(false);
        navigate("/login");
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      const username = currentUser.username;

      if (!username) {
        toast.error("用户信息不完整，请重新登录");
        setIsLoadingData(false);
        navigate("/login");
        return;
      }

      // 生成签名所需参数
      const timestamp = Date.now().toString();
      const params = { username, decreaseLogins: 1 };
      
      // 生成签名
      const method = 'POST';
      const url = '/api/decrease-user-logins';
      const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
      const signString = `${method.toUpperCase()}${url}${sortedParams}${timestamp}`;
      
      let hash = 0;
      for (let i = 0; i < signString.length; i++) {
        const char = signString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const secretKey = import.meta.env.VITE_API_SECRET_KEY || 'default_secret_key';
      for (let i = 0; i < secretKey.length; i++) {
        const char = secretKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const signature = Math.abs(hash).toString(16);
      const appKey = import.meta.env.VITE_APP_KEY || 'default_app_key';

      // 调用本地 API 扣除登录次数
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"}/decrease-user-logins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Timestamp": timestamp,
            "X-Signature": signature,
            "X-App-Key": appKey,
          },
          body: JSON.stringify({ username, decreaseLogins: 1 }),
        },
      );

      const result = await response.json();

      setIsLoadingData(false);

      if (!response.ok || !result.success) {
        toast.error(result.error || "操作失败，请稍后重试");
        return;
      }

      if (result.success) {
        // 更新本地存储的登录次数
        if (result.newLogins !== undefined) {
          localStorage.setItem("remainingLogins", result.newLogins.toString());
        }
        // 跳转到学历学籍信息页面
        navigate("/educationBackground");
      } else {
        toast.error(result.message || "登录次数不足，无法访问");
      }
    } catch (error) {
      setIsLoadingData(false);
      console.error("访问页面失败:", error);
      toast.error("访问失败，请稍后重试");
    }
  };

  const reportOptions = [
    {
      title: "教育部学籍在线验证报告",
      icon: <FileText className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "中国高等教育学位在线验证报告",
      icon: <FileText className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "教育部学历证书电子注册备案表",
      icon: <FileText className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">在线验证报告生成与下载</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Report Options */}
        {reportOptions.map((option, index) => (
          <Card
            key={index}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              if (index === 0) {
                handleReportClick('studentStatus');
              } else if (index === 1) {
                handleReportClick('degree');
              } else if (index === 2) {
                handleReportClick('education');
              }
            }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white flex-shrink-0`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-foreground">
                  {option.title}
                </h3>
              </div>
              <Download className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        ))}

        {/* Education Background Link */}
        <Card className="mt-8 overflow-hidden">
          <div
            className="relative bg-gradient-to-br from-[#5DADE2] to-[#3498DB] p-6 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowAccessConfirm(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">登录网页版学历学籍信息页面</h3>
                <p className="text-white/80 text-sm">跳转到网页版模拟信息查询页面，建议您在主页设置好您的所有信息后使用电脑端访问</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 ml-4">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <StudentStatusDialog
        open={studentStatusDialogOpen}
        onOpenChange={setStudentStatusDialogOpen}
        onLoadingChange={setIsLoadingData}
      />
      <DegreeVerificationDialog
        open={degreeDialogOpen}
        onOpenChange={setDegreeDialogOpen}
        onLoadingChange={setIsLoadingData}
      />
      <EducationRegistrationDialog
        open={educationDialogOpen}
        onOpenChange={setEducationDialogOpen}
        onLoadingChange={setIsLoadingData}
      />

      <LoadingDialog open={isLoadingData} message="正在加载数据" description="请稍候..." />

      {/* PDF积分消耗确认对话框 */}
      <AlertDialog open={showPdfCostConfirm} onOpenChange={setShowPdfCostConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>报告制作确认</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="text-sm">1. 报告二维码支持任意设备扫码验证</p>
              <p className="text-sm">2. 制作此报告需要消耗 <span className="font-semibold text-foreground text-base">30个PDF积分</span></p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-end gap-2">
            <AlertDialogCancel>取消制作</AlertDialogCancel>
            <AlertDialogAction onClick={handlePdfCostConfirm}>开始制作</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAccessConfirm} onOpenChange={setShowAccessConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>网页版访问确认</AlertDialogTitle>
            <AlertDialogDescription>
              1. 网页版信息取决于您在系统中设置的学籍学历学位以及考研信息，请确保信息准确再访问该页面
              <br />
              2. 访问该页面需要消耗 <span className="font-semibold text-foreground">1次登录次数</span>，是否确认访问？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleEducationBackgroundAccess}>确认访问</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default VerificationReport;
