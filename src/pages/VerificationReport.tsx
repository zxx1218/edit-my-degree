import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DegreeVerificationDialog from "@/components/DegreeVerificationDialog";
import EducationRegistrationDialog from "@/components/EducationRegistrationDialog";
import StudentStatusDialog from "@/components/StudentStatusDialog";

const VerificationReport = () => {
  const navigate = useNavigate();
  const [degreeDialogOpen, setDegreeDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [studentStatusDialogOpen, setStudentStatusDialogOpen] = useState(false);

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
          <h1 className="text-lg font-medium">在线验证报告查看与下载</h1>
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
                setStudentStatusDialogOpen(true);
              } else if (index === 1) {
                setDegreeDialogOpen(true);
              } else if (index === 2) {
                setEducationDialogOpen(true);
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
            onClick={() => navigate("/educationBackground")}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  查看网页版学历学籍信息页面
                </h3>
                <p className="text-white/80 text-sm">
                  查看您的所有学历、学位和学籍信息
                </p>
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
      />
      <DegreeVerificationDialog
        open={degreeDialogOpen}
        onOpenChange={setDegreeDialogOpen}
      />
      <EducationRegistrationDialog
        open={educationDialogOpen}
        onOpenChange={setEducationDialogOpen}
      />
    </div>
  );
};

export default VerificationReport;
