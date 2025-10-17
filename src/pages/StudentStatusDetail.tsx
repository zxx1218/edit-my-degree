import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const StudentStatusDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => navigate("/")} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-[#48C9B0]" />

      {/* Header */}
      <div className="text-center py-6 border-b">
        <button onClick={() => navigate(-1)} className="absolute left-4 top-20">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">高等学籍</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-[hsl(var(--student-status))] to-[hsl(var(--student-status-dark))] rounded-2xl p-6 text-white mb-6">
          <div className="flex items-start gap-4 mb-6">
            {/* Photos */}
            <div className="flex gap-3">
              <div className="text-center">
                <div className="w-20 h-24 bg-white/20 rounded-lg mb-2" />
                <span className="text-xs">录取照片</span>
              </div>
              <div className="text-center">
                <div className="w-20 h-24 bg-blue-400 rounded-lg mb-2" />
                <span className="text-xs">学历照片</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">朱晓煌</h2>
              <p className="text-base">男 1999年12月18日</p>
            </div>
          </div>

          {/* School Info */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">湖州师范学院</h3>
            <div className="flex items-center gap-4 text-base">
              <span>计算机技术</span>
              <span className="text-white/60">|</span>
              <span>全日制</span>
            </div>
          </div>

          <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full">
            <span className="text-sm font-medium">硕士研究生</span>
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">民族</span>
            <span className="font-medium">汉族</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">证件号码</span>
            <span className="font-medium">140105199912180817</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">学制</span>
            <span className="font-medium">3年</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">学历类别</span>
            <span className="font-medium">普通高等教育</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">分院</span>
            <span className="font-medium"></span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">系所</span>
            <span className="font-medium"></span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">班级</span>
            <span className="font-medium"></span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">学号</span>
            <span className="font-medium">2022388441</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">入学日期</span>
            <span className="font-medium">2022年09月03日</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">学籍状态</span>
            <span className="font-medium">不在籍（毕业）</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">离校日期</span>
            <span className="font-medium">2025年06月13日</span>
          </div>
        </div>

        {/* Button */}
        <Button className="w-full mt-6 h-14 text-lg bg-[#48C9B0] hover:bg-[#48C9B0]/90">
          查看验证报告
        </Button>
      </div>
    </div>
  );
};

export default StudentStatusDetail;
