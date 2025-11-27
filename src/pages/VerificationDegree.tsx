import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const VerificationDegree = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("中文");

  const [data, setData] = useState({
    name: "",
    gender: "",
    birthDate: "",
    degreeDate: "",
    school: "",
    degreeName: "",
    major: "",
    certificateNumber: "",
    verificationCode: "",
    updateDate: "",
    photo: "",
  });

  useEffect(() => {
    setData({
      name: searchParams.get("name") || "",
      gender: searchParams.get("gender") || "",
      birthDate: searchParams.get("birthDate") || "",
      degreeDate: searchParams.get("degreeDate") || "",
      school: searchParams.get("school") || "",
      degreeName: searchParams.get("degreeName") || "",
      major: searchParams.get("major") || "",
      certificateNumber: searchParams.get("certificateNumber") || "",
      verificationCode: searchParams.get("verificationCode") || "",
      updateDate: searchParams.get("updateDate") || "",
      photo: searchParams.get("photo") || "",
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Title Bar */}
      <div className="bg-white border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <img 
            src="https://www.chsi.com.cn/images/chsi/chsi_logo.png" 
            alt="学信网" 
            className="h-8"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-muted-foreground">在线验证</span>
        </div>
      </div>

      {/* Language Selection and Download */}
      <div className="bg-white border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">报告语种</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLanguage("中文")}
                className={`px-4 py-1 text-sm rounded ${
                  selectedLanguage === "中文"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setSelectedLanguage("英文")}
                className={`px-4 py-1 text-sm rounded ${
                  selectedLanguage === "英文"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                英文
              </button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center py-8 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">
              中国高等教育学位在线验证报告
            </h1>
          </div>

          {/* Photo */}
          <div className="flex justify-center py-8 border-b border-border">
            {data.photo ? (
              <img
                src={data.photo}
                alt="证件照"
                className="w-32 h-40 object-cover border-2 border-primary rounded"
              />
            ) : (
              <div className="w-32 h-40 bg-muted flex items-center justify-center border-2 border-border rounded">
                <span className="text-sm text-muted-foreground">暂无照片</span>
              </div>
            )}
          </div>

          {/* Information Fields */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">姓名</span>
                <span className="text-sm text-foreground flex-1">{data.name}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">性别</span>
                <span className="text-sm text-foreground flex-1">{data.gender}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">出生日期</span>
                <span className="text-sm text-foreground flex-1">{data.birthDate}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">获学位日期</span>
                <span className="text-sm text-foreground flex-1">{data.degreeDate}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">学位授予单位</span>
                <span className="text-sm text-foreground flex-1">{data.school}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">所授学位</span>
                <span className="text-sm text-foreground flex-1">{data.degreeName}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">学科/专业</span>
                <span className="text-sm text-foreground flex-1">{data.major}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">学位证书编号</span>
                <span className="text-sm text-foreground flex-1">{data.certificateNumber}</span>
              </div>

              <div className="flex border-b border-border pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">在线验证码</span>
                <span className="text-sm text-foreground flex-1 font-mono">{data.verificationCode}</span>
              </div>

              <div className="flex pb-3">
                <span className="text-sm text-muted-foreground w-32 flex-shrink-0">更新日期</span>
                <span className="text-sm text-foreground flex-1">{data.updateDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 px-4 py-6 text-center space-y-2">
        <p className="text-sm">主办单位：教育部学生服务与素质发展中心</p>
        <p className="text-xs">Copyright © 2003-2025 学信网 All Rights Reserved</p>
      </div>
    </div>
  );
};

export default VerificationDegree;
