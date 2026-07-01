import { ShieldCheck } from "lucide-react";

interface EducationRecord {
  id: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  enrollmentDate?: string;
  graduationDate?: string;
  school: string;
  major: string;
  studyType?: string;
  degreeLevel: string;
  duration?: string;
  principalName?: string;
  certificateNumber?: string;
  photo?: string;
}

interface EducationInfoCardProps {
  record: EducationRecord;
}

const EducationInfoCard = ({ record }: EducationInfoCardProps) => {
  return (
    <div className="p-0 rounded-none shadow-sm bg-white border border-gray-200 flex-1 flex flex-col">
      {/* 标题栏 - 绿色背景 */}
      <div className="flex items-center justify-between mb-0">
        <div className="bg-[#66cdab] text-white px-4 py-3 text-sm font-medium mt-2">
          {[record.degreeLevel, record.school, record.major].filter(Boolean).join('-')}
        </div>
        <button className="text-[#2c74c4] hover:underline flex items-center gap-1 mr-4 text-sm">
          <ShieldCheck className="w-4 h-4" />
          查看该学历的电子注册备案表
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-8 flex gap-6 flex-1">
        {/* 左侧照片 - 固定宽度 */}
        <div className="w-[120px] flex-shrink-0 space-y-5">
          <div>
            <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
              {record.photo ? (
                <img 
                  src={record.photo} 
                  alt="学历照片" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">照片</span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧详细信息 - 多列布局 */}
        <div className="flex-1 border-l border-gray-200 pl-8">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm">
            {/* 第1行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">姓名：</span>
              <span className="text-gray-800 font-medium">{record.name || "浆果儿"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">性别：</span>
              <span className="text-gray-800">{record.gender || "女"}</span>
            </div>

            {/* 第2行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">出生日期：</span>
              <span className="text-gray-800">{record.birthDate || "2002年12月09日"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">入学日期：</span>
              <span className="text-gray-800">{record.enrollmentDate || "2021年09月03日"}</span>
            </div>

            {/* 第3行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">毕（结）业日期：</span>
              <span className="text-gray-800">{record.graduationDate || "2025年06月30日"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">学校名称：</span>
              <span className="text-gray-800">{record.school}</span>
            </div>

            {/* 第4行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">专业：</span>
              <span className="text-gray-800">{record.major}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">学历类别：</span>
              <span className="text-gray-800">{record.studyType || "普通高等教育"}</span>
            </div>

            {/* 第5行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">学制：</span>
              <span className="text-gray-800">{record.duration || "4 年"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">学习形式：</span>
              <span className="text-gray-800">{record.studyType || "全日制"}</span>
            </div>

            {/* 第6行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">层次：</span>
              <span className="text-gray-800">{record.degreeLevel}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">毕（结）业：</span>
              <span className="text-gray-800">毕业</span>
            </div>

            {/* 第7行 - 跨两列 */}
            <div className="flex items-start col-span-2">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">校（院）长姓名：</span>
              <span className="text-gray-800">{record.principalName || "李路明"}</span>
            </div>

            {/* 第8行 - 跨两列 */}
            <div className="flex items-start col-span-2">
              <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">证书编号：</span>
              <span className="text-gray-800">{record.certificateNumber || "5432 1233 5435 43612 85"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationInfoCard;
