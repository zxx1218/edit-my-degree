import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileCheck, GraduationCap, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const VerificationReport = () => {
  const navigate = useNavigate();

  const reportOptions = [
    {
      title: "教育部学籍在线验证报告",
      icon: FileCheck,
      description: "查看和下载学籍在线验证报告",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "中国高等教育学位在线验证报告",
      icon: Award,
      description: "查看和下载学位在线验证报告",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "教育部学历证书电子注册备案表",
      icon: GraduationCap,
      description: "查看和下载学历证书电子注册备案表",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">在线验证报告查看与下载</h1>
              <p className="text-sm text-muted-foreground mt-1">选择需要查看的验证报告类型</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Report Options */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-border/50"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Button
                    className="w-full group-hover:shadow-md transition-shadow"
                    variant="outline"
                  >
                    查看报告
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Education Background Link */}
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">教育背景管理</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                查看和管理您的完整教育背景信息，包括学籍、学历、学位和考研记录
              </p>
            </div>
            <Button
              onClick={() => navigate("/educationBackground")}
              size="lg"
              className="mt-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              进入教育背景页面
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerificationReport;
