import { ShieldCheck } from "lucide-react";

interface DegreeRecord {
  id: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  graduationDate?: string;
  school: string;
  major: string;
  degreeType?: string;
  certificateNumber?: string;
  photo?: string;
}

interface DegreeInfoCardProps {
  record: DegreeRecord;
}

const DegreeInfoCard = ({ record }: DegreeInfoCardProps) => {
  return (
    <div className="p-0 rounded-none shadow-sm bg-white border border-gray-200 flex-1 flex flex-col">
      {/* 标题栏 - 绿色背景 */}
      <div className="flex items-center justify-between mb-0">
        <div className="bg-[#66cdab] text-white px-4 py-3 text-sm font-medium mt-2">
          {[record.degreeType, record.school, record.major].filter(Boolean).join('-')}
        </div>
        <button className="text-[#2c74c4] hover:underline flex items-center gap-1 mr-4 text-sm">
          <ShieldCheck className="w-4 h-4" />
          查看该学位的在线验证报告
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
                  alt="学位照片" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">照片</span>
              )}
            </div>
            <p className="text-center text-xs text-gray-600">学位照片</p>
          </div>
        </div>

        {/* 右侧详细信息 - 多列布局 */}
        <div className="flex-1 border-l border-gray-200 pl-8">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm">
            {/* 第1行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">姓名：</span>
              <span className="text-gray-800 font-medium flex-1">{record.name || "浆果儿"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">性别：</span>
              <span className="text-gray-800 flex-1">{record.gender || "女"}</span>
            </div>

            {/* 第2行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">出生日期：</span>
              <span className="text-gray-800 flex-1">{record.birthDate || "2001年12月09日"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">获学位日期：</span>
              <span className="text-gray-800 flex-1">{record.graduationDate || "2025年06月30日"}</span>
            </div>

            {/* 第3行 - 跨两列 */}
            <div className="flex items-start col-span-2">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学位授予单位：</span>
              <span className="text-gray-800 flex-1">{record.school}</span>
            </div>

            {/* 第4行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">所授学位：</span>
              <span className="text-gray-800 flex-1">{record.degreeType || "经济学学士学位"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学科/专业：</span>
              <span className="text-gray-800 flex-1">{record.major}</span>
            </div>

            {/* 第5行 - 跨两列 */}
            <div className="flex items-start col-span-2">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学位证书编号：</span>
              <span className="text-gray-800 flex-1">{record.certificateNumber || "101103832942"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DegreeInfoCard;
