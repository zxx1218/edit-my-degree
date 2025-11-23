import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Menu, Download } from 'lucide-react';

const Verification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    enrollmentDate: '',
    graduationDate: '',
    school: '',
    major: '',
    duration: '',
    level: '',
    educationType: '',
    studyType: '',
    graduationStatus: '',
    certificateNumber: '',
    principalName: '',
    verificationCode: '',
    updateDate: '',
    photo: ''
  });

  useEffect(() => {
    setData({
      name: searchParams.get('name') || '',
      gender: searchParams.get('gender') || '',
      birthDate: searchParams.get('birthDate') || '',
      enrollmentDate: searchParams.get('enrollmentDate') || '',
      graduationDate: searchParams.get('graduationDate') || '',
      school: searchParams.get('school') || '',
      major: searchParams.get('major') || '',
      duration: searchParams.get('duration') || '',
      level: searchParams.get('level') || '',
      educationType: searchParams.get('educationType') || '',
      studyType: searchParams.get('studyType') || '',
      graduationStatus: searchParams.get('graduationStatus') || '',
      certificateNumber: searchParams.get('certificateNumber') || '',
      principalName: searchParams.get('principalName') || '',
      verificationCode: searchParams.get('verificationCode') || '',
      updateDate: searchParams.get('updateDate') || '',
      photo: searchParams.get('photo') || ''
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
            <button className="text-blue-500 font-medium text-sm">中文</button>
            <button className="text-gray-500 text-sm">英文</button>
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
          教育部学历证书电子注册备案表
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
        <div className="space-y-4">
          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">姓名</span>
            <span className="text-gray-900">{data.name}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">性别</span>
            <span className="text-gray-900">{data.gender}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">出生日期</span>
            <span className="text-gray-900">{data.birthDate}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">入学日期</span>
            <span className="text-gray-900">{data.enrollmentDate}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">毕（结）业日期</span>
            <span className="text-gray-900">{data.graduationDate}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">学校名称</span>
            <span className="text-gray-900">{data.school}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">专业</span>
            <span className="text-gray-900">{data.major}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">学制</span>
            <span className="text-gray-900">{data.duration}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">层次</span>
            <span className="text-gray-900">{data.level}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">学历类别</span>
            <span className="text-gray-900">{data.educationType}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">学习形式</span>
            <span className="text-gray-900">{data.studyType}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">毕（结）业</span>
            <span className="text-gray-900">{data.graduationStatus}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">证书编号</span>
            <span className="text-gray-900">{data.certificateNumber}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">校（院）长姓名</span>
            <span className="text-gray-900">{data.principalName}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">在线验证码</span>
            <span className="text-gray-900">{data.verificationCode}</span>
          </div>

          <div className="flex py-3 border-b border-gray-100">
            <span className="text-gray-500 w-32 flex-shrink-0">更新日期</span>
            <span className="text-gray-900">{data.updateDate}</span>
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

export default Verification;
