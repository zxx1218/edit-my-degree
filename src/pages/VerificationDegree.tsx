import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Menu, Download } from "lucide-react";

/*
    样例url - 学位
    /verification-degree?name=张三&gender=男&birthDate=1998年5月12日&degreeDate=2022年6月20日&school=清华大学&degreeName=工学学士&major=计算机科学与技术&certificateNumber=1041842022000123&verificationCode=XWYZ202511270001&updateDate=2025年11月27日&photo=https://example.com/photo.jpg
*/

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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header 
      <header className="bg-white border-b border-gray-200">
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
      */}

      {/* Logo and Title Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_img/verify_logo.png" alt="学信网" className="h-8 w-auto" />
            <span className="text-gray-300 text-xl leading-relaxed">|</span>
            <span className="text-gray-600">在线验证</span>
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
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
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
              className="w-[6.8rem] h-[8.5rem] object-cover border border-gray-200"
            />
          ) : (
            <div className="w-[6.8rem] h-[8.5rem] border border-gray-200 bg-gray-50" />
          )}
        </div>

        {/* Information Fields */}
        <div className="space-y-0 pl-4">
          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">姓名</span>
            <span className="text-gray-900 ml-6">{data.name}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">性别</span>
            <span className="text-gray-900 ml-6">{data.gender}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">出生日期</span>
            <span className="text-gray-900 ml-6">{data.birthDate}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">获学位日期</span>
            <span className="text-gray-900 ml-6">{data.degreeDate}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">学位授予单位</span>
            <span className="text-gray-900 ml-6">{data.school}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">所授学位</span>
            <span className="text-gray-900 ml-6">{data.degreeName}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">学科/专业</span>
            <span className="text-gray-900 ml-6">{data.major}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">学位证书编号</span>
            <span className="text-gray-900 ml-6">{data.certificateNumber}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">在线验证码</span>
            <span className="text-gray-900 ml-6">{data.verificationCode}</span>
          </div>

          <div className="flex py-2">
            <span className="text-[rgb(136,143,152)] w-24 flex-shrink-0 text-right">更新日期</span>
            <span className="text-gray-900 ml-6">{data.updateDate}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[rgb(40,40,40)] text-white py-3 px-4">
        <div className="text-center">
          <p className="text-sm mb-1 text-[rgb(149,149,149)]">主办单位：教育部学生服务与素质发展中心</p>
          <p className="text-xs text-[rgb(149,149,149)]">Copyright © 2003-2026 学信网 All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default VerificationDegree;
