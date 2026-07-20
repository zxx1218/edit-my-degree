import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { getUserData } from "@/lib/api";
import { toast } from "sonner";
import { sortByDegreeLevel, sortByDegreeType } from "@/lib/educationSort";
import { 
  StudentStatusCard, 
  EducationInfoCard, 
  DegreeInfoCard, 
  ExamInfoCard,
  RecommendationCard,
  JobRecommendationCard
} from "@/components/educationBackground_comp";

interface EducationRecord {
  id: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  degreeType?: string;
  type: "student-status" | "education" | "degree" | "exam";
  name?: string;
  gender?: string;
  birthDate?: string;
  enrollmentDate?: string;
  graduationDate?: string;
  certificateNumber?: string;
  principalName?: string;
  duration?: string;
  graduation_status?: string;
  photo?: string;
  admission_photo?: string;
  degree_photo?: string;
  // Exam specific fields
  year?: string;
  exam_location?: string;
  registration_number?: string;
  exam_unit?: string;
  department?: string;
  research_direction?: string;
  exam_type?: string;
  special_program?: string;
  foreign_language_name?: string;
  foreign_language_score?: string;
  politics_name?: string;
  politics_score?: string;
  business_course1_name?: string;
  business_course1_score?: string;
  business_course2_name?: string;
  business_course2_score?: string;
  total_score?: string;
  admission_unit?: string;
  admission_major?: string;
}

const EducationBackground = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStatusRecords, setStudentStatusRecords] = useState<any[]>([]);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [degreeRecords, setDegreeRecords] = useState<EducationRecord[]>([]);
  const [examRecords, setExamRecords] = useState<EducationRecord[]>([]);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
          const user = JSON.parse(userStr);
          const data = await getUserData(user.id);
          
          // 按学历层次排序学籍信息
          const sortedStudentStatus = sortByDegreeLevel(
            (data.studentStatus || []).map((record: any) => ({
              ...record,
              degreeLevel: record.degree_level
            }))
          );
          
          // 按学历层次排序学历信息
          const sortedEducation = sortByDegreeLevel(
            (data.education || []).map((record: any) => ({
              ...record,
              degreeLevel: record.degree_level,
              principalName: record.principal_name,
              certificateNumber: record.certificate_number,
              enrollmentDate: record.enrollment_date,
              graduationDate: record.graduation_date,
              studyType: record.study_type,
              educationType: record.education_type,
              graduationStatus: record.graduation_status,
              idNumber: record.id_number
            }))
          );
          
          // 按学位类型排序学位信息
          const sortedDegree = sortByDegreeType(
            (data.degree || []).map((record: any) => ({
              ...record,
              degreeType: record.degree_level
            }))
          );
          
          setStudentStatusRecords(sortedStudentStatus);
          setEducationRecords(sortedEducation);
          setDegreeRecords(sortedDegree);
          setExamRecords(data.exam || []);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const allRecords = activeTab === "education" ? educationRecords : activeTab === "degree" ? degreeRecords : activeTab === "exam" ? examRecords : [];
  const showStudentStatus = activeTab === "info";

  // 检查是否所有数据都为空
  const hasNoData = studentStatusRecords.length === 0 && educationRecords.length === 0 && degreeRecords.length === 0 && examRecords.length === 0;

  return (
    <div className="min-h-screen bg-gray-100 min-w-[1200px]">
      {/* 顶部导航栏 - 绿色背景 */}
      <header className="bg-[#25b887] text-[#d6f8e4] shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between min-w-[1200px]">
          {/* Logo和导航菜单区域 */}
          <div className="flex items-center gap-3">
            {/* Logo区域 */}
            <div 
              className="flex-shrink-0"
              style={{
                width: '215px',
                height: '40px',
                backgroundImage: '-webkit-image-set(url("/logo_img/background_logo.png") 1x, url("/logo_img/background_logo_2x.png") 2x)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0',
                overflow: 'hidden'
              }}
            />
            
            {/* 主导航菜单 - 使用绝对定位与logo左对齐 */}
            <nav className="hidden md:flex gap-4 lg:gap-5 flex-shrink-0 ml-[-215px]" style={{position: 'relative', left: '215px'}}>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">首页</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">高等教育信息</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">在线验证报告</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">学历学位认证与成绩验证</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">出国（境）报告发送</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">调查/投票</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">职业测评</button>
              <button className="hover:text-[#f7ffff] transition-colors font-medium whitespace-nowrap">就业</button>
            </nav>
          </div>
          
          {/* 右侧用户区域 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 二级导航 - 白色背景 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <nav className="flex gap-8">
            <button onClick={() => setActiveTab("info")} className={`py-3 px-3 border-b-2 transition-colors text-sm ${activeTab === "info" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-[#666666] hover:text-gray-800"}`}>
              学籍信息/图像校对
            </button>
            <button onClick={() => setActiveTab("education")} className={`py-3 px-3 border-b-2 transition-colors text-sm ${activeTab === "education" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-[#666666] hover:text-gray-800"}`}>
              学历信息
            </button>
            <button onClick={() => setActiveTab("degree")} className={`py-3 px-3 border-b-2 transition-colors text-sm ${activeTab === "degree" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-[#666666] hover:text-gray-800"}`}>
              学位信息
            </button>
            <button onClick={() => setActiveTab("exam")} className={`py-3 px-3 border-b-2 transition-colors text-sm ${activeTab === "exam" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-[#666666] hover:text-gray-800"}`}>
              考研信息
            </button>
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Banner图片 - 仅在学籍和学历页面显示 */}
        {activeTab !== "degree" && activeTab !== "exam" && (
          <div className="flex gap-4 mb-6 min-w-[600px]">
            <Card className="overflow-hidden border-none h-[72px] rounded-none shadow-sm flex-1">
              <img 
                src="/background_banner_img/banner_0.png" 
                alt="专业满意度" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/temp.png";
                }}
              />
            </Card>
            <Card className="overflow-hidden border-none h-[72px] rounded-none shadow-sm flex-1">
              <img 
                src="/background_banner_img/banner_1.jpg" 
                alt="职场实习" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/temp.png";
                }}
              />
            </Card>
          </div>
        )}
        
        {/* 学历数量提示 - 全宽显示（考研信息页面不显示） */}
        {!hasNoData && activeTab !== "exam" && (
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span>您一共有 <span style={{ color: '#25b887' }}>{showStudentStatus ? studentStatusRecords.length : allRecords.length}</span> 个{activeTab === "info" ? "学籍" : activeTab === "education" ? "学历" : activeTab === "degree" ? "学位" : "学历"}</span>
            <span className="">还有{activeTab === "info" ? "学籍" : activeTab === "education" ? "学历" : activeTab === "degree" ? "学位" : "学历"}没有显示出来？</span>
            <button className="text-[#2c74c4] hover:underline text-sm">尝试绑定{activeTab === "info" ? "学籍" : activeTab === "education" ? "学历" : activeTab === "degree" ? "学位" : "学历"}</button>
            <span>|</span>
            <button className="text-[#2c74c4] hover:underline text-sm">{activeTab === "info" ? "学籍" : activeTab === "education" ? "学历" : activeTab === "degree" ? "学位" : "学历"}查询范围</button>
            {activeTab === "degree" && (
              <>
                <span>|</span>
                <button className="text-[#2c74c4] hover:underline text-sm">学位查询结果说明</button>
              </>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* 学历/学籍列表 */}
          {loading ? (
            <Card className="p-8 text-center text-gray-500 rounded-none shadow-sm bg-white">
              加载中...
            </Card>
          ) : hasNoData ? (
            <Card className="p-12 text-center rounded-none shadow-sm bg-white">
              <div className="flex flex-col items-center gap-4">
                <ShieldCheck className="w-16 h-16 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-500">暂无教育信息</h3>
                <p className="text-sm text-gray-500">
                  您还没有添加任何学籍、学历、学位或考研信息
                </p>
              </div>
            </Card>
          ) : showStudentStatus ? (
            // 学籍信息 - 每条学籍对应一个推荐卡片
            studentStatusRecords.length === 0 ? (
              <Card className="p-8 text-center text-gray-500 rounded-none shadow-sm bg-white">
                暂无数据
              </Card>
            ) : (
              studentStatusRecords.map((record, index) => (
                <div key={record.id} className="grid grid-cols-4 gap-6 min-w-[1200px]">
                  <div className="col-span-3 flex">
                    <StudentStatusCard record={record} />
                  </div>
                  <div className="col-span-1 flex">
                    <RecommendationCard index={index} />
                  </div>
                </div>
              ))
            )
          ) : allRecords.length === 0 ? (
            <Card className="p-8 text-center text-gray-500 rounded-none shadow-sm bg-white">
              暂无数据
            </Card>
          ) : activeTab === "degree" ? (
            // 学位信息 - 每条学位对应一个推荐卡片
            allRecords.map((record, index) => (
              <div key={record.id} className="grid grid-cols-4 gap-6 min-w-[1200px]">
                <div className="col-span-3 flex">
                  <DegreeInfoCard record={record} />
                </div>
                <div className="col-span-1 flex">
                  <RecommendationCard index={index} />
                </div>
              </div>
            ))
          ) : activeTab === "exam" ? (
            // 考研信息 - 不显示推荐卡片，占据整个屏幕
            allRecords.map((record) => (
              <div key={record.id} className="flex flex-col">
                <ExamInfoCard record={record} />
                {/* 考研信息说明 */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">说明：</span>系统提供2006年以来入学的硕士研究生报名和成绩数据。
                  </p>
                </div>
              </div>
            ))
          ) : (
            // 学历信息 - 每条学历对应一个推荐卡片
            allRecords.map((record, index) => (
              <div key={record.id} className="grid grid-cols-4 gap-6 min-w-[1200px]">
                <div className="col-span-3 flex">
                  <EducationInfoCard record={record} />
                </div>
                <div className="col-span-1 flex">
                  <RecommendationCard index={index} />
                </div>
              </div>
            ))
          )}

          {/* 职位推荐 - 仅在学历信息栏目下显示 */}
          {activeTab === "education" && (
            <JobRecommendationCard />
          )}
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500 space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button className="hover:text-primary">模拟网</button>
            <span>|</span>
            <button className="hover:text-primary">帮助中心</button>
            <span>|</span>
            <span>Copyright © 2003-2026 模拟网 All Rights Reserved</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <span>京ICP备37451233号-2</span>
            <span>京公网安备82715273612534号</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EducationBackground;
