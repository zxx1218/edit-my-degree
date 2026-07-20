import { ShieldCheck } from "lucide-react";

interface StudentStatusRecord {
  id: string;
  name?: string;
  gender?: string;
  birth_date?: string;
  nationality?: string;
  id_number?: string;
  school: string;
  degree_level: string;
  major: string;
  duration?: string;
  education_type?: string;
  study_type?: string;
  branch?: string;
  department?: string;
  class?: string;
  student_id?: string;
  enrollment_date?: string;
  status?: string;
  graduation_date?: string;
  admission_photo?: string;
  degree_photo?: string;
}

interface StudentStatusCardProps {
  record: StudentStatusRecord;
}

const StudentStatusCard = ({ record }: StudentStatusCardProps) => {
  return (
    <div className="p-0 rounded-none shadow-sm bg-white border border-gray-200 flex-1 flex flex-col">
      {/* 标题栏 - 绿色背景 */}
      <div className="flex items-center justify-between mb-1">
        <div className="bg-[#66cdab] text-white px-4 py-3 text-sm font-medium mt-2">
          {[record.degree_level, record.school, record.major].filter(Boolean).join('-')}
        </div>
        <button className="text-[#2c74c4] hover:underline flex items-center gap-1 mr-4 text-sm">
          <ShieldCheck className="w-4 h-4" />
          查看该学籍的在线验证报告
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-8 flex gap-6 flex-1">
        {/* 左侧照片 - 固定宽度 */}
        <div className="w-[120px] flex-shrink-0 space-y-5">
          <div>
            <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
              {record.admission_photo ? (
                <img 
                  src={record.admission_photo} 
                  alt="录取照片" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">照片</span>
              )}
            </div>
            <p className="text-center text-xs text-gray-600">录取照片</p>
          </div>
          <div>
            <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
              {record.degree_photo ? (
                <img 
                  src={record.degree_photo} 
                  alt="学历照片" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">照片</span>
              )}
            </div>
            <p className="text-center text-xs text-gray-600">学历照片</p>
          </div>
        </div>

        {/* 右侧学籍详细信息 - 多行布局 */}
        <div className="flex-1 border-l border-gray-200 pl-8">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm">
            {/* 第1行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">姓名：</span>
              <span className="text-gray-800 font-medium flex-1">{record.name}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">性别：</span>
              <span className="text-gray-800 flex-1">{record.gender || "女"}</span>
            </div>

            {/* 第2行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">出生日期：</span>
              <span className="text-gray-800 flex-1">{record.birth_date || "2003年05月25日"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">民族：</span>
              <span className="text-gray-800 flex-1">{record.nationality || "汉族"}</span>
            </div>

            {/* 第3行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">证件号码：</span>
              <span className="text-gray-800 flex-1">{record.id_number || ""}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学校名称：</span>
              <span className="text-gray-800 flex-1">{record.school}</span>
            </div>

            {/* 第4行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">层次：</span>
              <span className="text-gray-800 flex-1">{record.degree_level}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">专业：</span>
              <span className="text-gray-800 flex-1">{record.major}</span>
            </div>
            
            {/* 第5行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学制：</span>
              <span className="text-gray-800 flex-1">{record.duration || ""}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学历类别：</span>
              <span className="text-gray-800 flex-1">{record.education_type || ""}</span>
            </div>

            {/* 第6行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">分院：</span>
              <span className="text-gray-800 flex-1">{record.branch || ""}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">系所：</span>
              <span className="text-gray-800 flex-1">{record.department || ""}</span>
            </div>

            {/* 第7行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">班级：</span>
              <span className="text-gray-800 flex-1">{record.class || ""}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学习形式：</span>
              <span className="text-gray-800 flex-1">{record.study_type || ""}</span>
            </div>

            {/* 第8行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学号：</span>
              <span className="text-gray-800 flex-1">{record.student_id || ""}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">入学日期：</span>
              <span className="text-gray-800 flex-1">{record.enrollment_date || ""}</span>
            </div>

            {/* 第9行 */}
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">学籍状态：</span>
              <span className="text-gray-800 flex-1">{record.status || "不在籍（毕业）"}</span>
            </div>
            <div className="flex items-start">
              <span className="text-gray-400 w-24 text-right flex-shrink-0 mr-3 whitespace-nowrap">离校日期：</span>
              <span className="text-gray-800 flex-1">{record.graduation_date || ""}</span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStatusCard;
