interface ExamRecord {
  id: string;
  year?: string;
  school: string;
  major?: string;
  photo?: string;
  exam_location?: string;
  exam_type?: string;
  registration_number?: string;
  special_program?: string;
  exam_unit?: string;
  foreign_language_name?: string;
  department?: string;
  politics_name?: string;
  research_direction?: string;
  business_course1_name?: string;
  business_course2_name?: string;
  politics_score?: string;
  foreign_language_score?: string;
  business_course1_score?: string;
  business_course2_score?: string;
  total_score?: string;
  admission_unit?: string;
  admission_major?: string;
}

interface ExamInfoCardProps {
  record: ExamRecord;
}

const ExamInfoCard = ({ record }: ExamInfoCardProps) => {
  return (
    <div className="p-0 rounded-none shadow-sm bg-white border border-gray-200 flex-1 flex flex-col">
      {/* 标题栏 - 绿色背景 */}
      <div className="flex items-center justify-between mb-0">
        <div className="bg-[#66cdab] text-white px-4 py-3 text-sm font-medium mt-2">
          {record.year}年({record.school})
        </div>
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
                  alt="考研照片" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">照片</span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧信息区域 - 多列布局 */}
        <div className="flex-1 border-l border-gray-200 pl-8">
          <div className="space-y-6">
            {/* 报考信息 */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-800">报考信息</h3>
              <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm">
                {/* 第1行 */}
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">报考点：</span>
                  <span className="text-gray-800">{record.exam_location || "1101"}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">考试方式：</span>
                  <span className="text-gray-800">{record.exam_type || "全国统考"}</span>
                </div>

                {/* 第2行 */}
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">报名号：</span>
                  <span className="text-gray-800">{record.registration_number || "110826475"}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">专项计划：</span>
                  <span className="text-gray-800">{record.special_program || "非专项计划"}</span>
                </div>

                {/* 第3行 */}
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">报考单位：</span>
                  <span className="text-gray-800">{record.exam_unit || "10001"}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">外语语名称：</span>
                  <span className="text-gray-800">{record.foreign_language_name || "英语（一）"}</span>
                </div>

                {/* 第4行 */}
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">报考院系所：</span>
                  <span className="text-gray-800">{record.department || "无"}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">政治理论名称：</span>
                  <span className="text-gray-800">{record.politics_name || "思想政治理论"}</span>
                </div>

                {/* 第5行 */}
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">报考专业：</span>
                  <span className="text-gray-800">{record.major || "041420"}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">业务课一名称：</span>
                  <span className="text-gray-800">{record.business_course1_name || "数学（三）"}</span>
                </div>

                {/* 第6行 */}
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">研究方向：</span>
                  <span className="text-gray-800">{record.research_direction || "无"}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">业务课二名称：</span>
                  <span className="text-gray-800">{record.business_course2_name || "431 金融学综合"}</span>
                </div>
              </div>
            </div>

            {/* 成绩信息和录取信息 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 成绩信息 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-800">成绩信息</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">政治理论：</span>
                    <span className="text-gray-800">{record.politics_score || "78"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">外国语：</span>
                    <span className="text-gray-800">{record.foreign_language_score || "80"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">业务课一：</span>
                    <span className="text-gray-800">{record.business_course1_score || "137"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">业务课二：</span>
                    <span className="text-gray-800">{record.business_course2_score || "139"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">总分：</span>
                    <span className="text-gray-800">{record.total_score || "434.0"}</span>
                  </div>
                </div>
              </div>

              {/* 录取信息 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-800">录取信息</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">录取单位：</span>
                    <span className="text-gray-800">{record.admission_unit || record.school || "清华大学"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-20 text-right flex-shrink-0 mr-3">录取专业：</span>
                    <span className="text-gray-800">{record.admission_major || "工商管理学"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInfoCard;
