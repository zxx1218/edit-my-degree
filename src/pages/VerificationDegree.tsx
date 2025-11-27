import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Menu, Download } from "lucide-react";

const VerificationDegree = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<'chinese' | 'english'>('chinese');

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-2xl">×</span>
          </button>
        </div>
      </header>

      {/* Logo and Title Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">学</span>
              </div>
              <span className="text-2xl font-bold text-gray-800">学信网</span>
            </div>
            <span className="text-gray-600 ml-4">在线验证</span>
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-gray-600" />
            <Menu className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">报告语种</span>
            <button 
              onClick={() => setSelectedLanguage('chinese')}
              className={`px-3 py-1 text-sm font-medium rounded ${
                selectedLanguage === 'chinese' 
                  ? 'text-[rgb(0,186,198)] bg-[rgb(239,248,249)]' 
                  : 'text-[rgb(136,143,152)]'
              }`}
            >
              中文
            </button>
            <button 
              onClick={() => setSelectedLanguage('english')}
              className={`px-3 py-1 text-sm rounded ${
                selectedLanguage === 'english' 
                  ? 'text-[rgb(0,186,198)] bg-[rgb(239,248,249)]' 
                  : 'text-[rgb(136,143,152)]'
              }`}
            >
              英文
            </button>
          </div>
          <button className="p-2 bg-gray-100 rounded">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-center text-xl font-bold text-gray-900 mb-6">
          中国高等教育学位在线验证报告
        </h1>

        {/* Photo */}
        <div className="flex justify-center mb-6">
          {data.photo ? (
            <img 
              src={data.photo} 
              alt="证件照" 
              className="w-32 h-40 object-cover border border-gray-200"
            />
          ) : (
            <div className="w-32 h-40 border border-gray-200 bg-gray-50" />
          )}
        </div>

        {/* Information Fields */}
        <div className="space-y-0">
          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">姓名</span>
            <span className="text-gray-900 ml-2">{data.name}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">性别</span>
            <span className="text-gray-900 ml-2">{data.gender}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">出生日期</span>
            <span className="text-gray-900 ml-2">{data.birthDate}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">获学位日期</span>
            <span className="text-gray-900 ml-2">{data.degreeDate}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">学位授予单位</span>
            <span className="text-gray-900 ml-2">{data.school}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">所授学位</span>
            <span className="text-gray-900 ml-2">{data.degreeName}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">学科/专业</span>
            <span className="text-gray-900 ml-2">{data.major}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">学位证书编号</span>
            <span className="text-gray-900 ml-2">{data.certificateNumber}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">在线验证码</span>
            <span className="text-gray-900 ml-2">{data.verificationCode}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">更新日期</span>
            <span className="text-gray-900 ml-2">{data.updateDate}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 px-4 mt-12">
        <div className="text-center">
          <p className="text-sm mb-2">主办单位：教育部学生服务与素质发展中心</p>
          <p className="text-xs text-gray-400">Copyright © 2003-2025 学信网 All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default VerificationDegree;
