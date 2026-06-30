import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck } from "lucide-react";
import { getUserData } from "@/lib/api";
import { toast } from "sonner";
import { sortByDegreeLevel, sortByDegreeType } from "@/lib/educationSort";

// 推荐卡片组件
const RecommendationCard = ({ index }: { index: number }) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-none">
      {/* 专业推荐 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>专业推荐</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">{index % 2 === 0 ? '1721' : '0'}</span>
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {index % 2 === 0 ? (
            <>您已推荐 <span className="text-green-600">1</span> 个专业，还能推荐 <span className="text-green-600">7</span> 个</>
          ) : (
            <>您尚未推荐专业</>
          )}
        </p>
        <Button className="w-full bg-[#5cb87c] hover:bg-[#4cae4c] text-white rounded-none h-9 text-sm">
          我要推荐
        </Button>
      </div>

      {/* 专业满意度 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>专业满意度</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">687</span>
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">综合</span>
            <span className="text-green-600 font-medium">3.9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">办学条件</span>
            <span className="text-green-600 font-medium">3.8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">就业</span>
            <span className="text-green-600 font-medium">3.8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">教学质量</span>
            <span className="text-green-600 font-medium">3.8</span>
          </div>
        </div>
        <Button className="w-full bg-[#5cb87c] hover:bg-[#4cae4c] text-white rounded-none h-9 text-sm">
          我要评价
        </Button>
      </div>

      {/* 院校满意度 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>院校满意度</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">4141</span>
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">综合</span>
            <span className="text-green-600 font-medium">3.7</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">环境</span>
            <span className="text-green-600 font-medium">4.1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">生活</span>
            <span className="text-green-600 font-medium">3.3</span>
          </div>
        </div>
        <Button className="w-full bg-[#5cb87c] hover:bg-[#4cae4c] text-white rounded-none h-9 text-sm">
          我要评价
        </Button>
      </div>

      {/* 毕业论文查重 */}
      <div className="p-4">
        <img 
          src="/certification-banner.png" 
          alt="毕业论文查重" 
          className="w-full h-auto mb-3"
        />
        <Button className="w-full bg-[#5cb87c] hover:bg-[#4cae4c] text-white rounded-none h-9 text-sm">
          学科/专业变化查询
        </Button>
      </div>
    </div>
  );
};

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
              degreeLevel: record.degree_level
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
  return <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 - 绿色背景 */}
      <header className="bg-[#5cb87c] text-white sticky top-0 z-50 shadow-md">
        <div className="w-[80%] mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo区域 */}
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10" />
            <span className="text-2xl font-bold">学信档案</span>
          </div>
          
          {/* 主导航菜单 */}
          <nav className="hidden md:flex gap-6">
            <button className="hover:text-white/80 transition-colors font-medium">首页</button>
            <button className="hover:text-white/80 transition-colors font-medium">高等教育信息</button>
            <button className="hover:text-white/80 transition-colors font-medium">在线验证报告</button>
            <button className="hover:text-white/80 transition-colors font-medium">学历学位认证与成绩验证</button>
            <button className="hover:text-white/80 transition-colors font-medium">出国（境）报告发送</button>
            <button className="hover:text-white/80 transition-colors font-medium">调查/投票</button>
            <button className="hover:text-white/80 transition-colors font-medium">职业测评</button>
            <button className="hover:text-white/80 transition-colors font-medium">就业</button>
          </nav>
          
          {/* 右侧用户区域 */}
          <div className="flex items-center gap-2">
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
        <div className="w-[80%] mx-auto">
          <nav className="flex gap-8">
            <button onClick={() => setActiveTab("info")} className={`py-4 px-2 border-b-2 transition-colors ${activeTab === "info" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
              学籍信息/图像校对
            </button>
            <button onClick={() => setActiveTab("education")} className={`py-4 px-2 border-b-2 transition-colors ${activeTab === "education" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
              学历信息
            </button>
            <button onClick={() => setActiveTab("degree")} className={`py-4 px-2 border-b-2 transition-colors ${activeTab === "degree" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
              学位信息
            </button>
            <button onClick={() => setActiveTab("exam")} className={`py-4 px-2 border-b-2 transition-colors ${activeTab === "exam" ? "border-[#5cb87c] text-[#5cb87c] font-medium" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
              考研信息
            </button>
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="w-[80%] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="overflow-hidden border-none h-[90px] rounded-none shadow-sm">
                <img 
                  src="/banner_img/banner_0.png" 
                  alt="专业满意度" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/certification-banner.png";
                  }}
                />
              </Card>
              <Card className="overflow-hidden border-none h-[90px] rounded-none shadow-sm">
                <img 
                  src="/banner_img/banner_1.png" 
                  alt="职场实习" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/certification-banner.png";
                  }}
                />
              </Card>
            </div>
        
        {/* 学历数量提示 - 全宽显示 */}
        {!hasNoData && <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>您一共有 {showStudentStatus ? studentStatusRecords.length : allRecords.length} 个{showStudentStatus ? "学籍" : "学历"}</span>
                <button className="text-primary hover:underline">还有{showStudentStatus ? "学籍" : "学历"}没有显示出来？</button>
                <span>|</span>
                <button className="text-primary hover:underline">{showStudentStatus ? "学籍" : "学历"}查询范围</button>
              </div>}

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* 左侧主内容 - 占5列 */}
          <div className="lg:col-span-5 space-y-6">
            {/* 学历/学籍列表 - 每行包含左侧内容和右侧推荐 */}
            {loading ? <Card className="p-8 text-center text-gray-500 rounded-none shadow-sm bg-white">
                加载中...
              </Card> : hasNoData ? <Card className="p-12 text-center rounded-none shadow-sm bg-white">
                <div className="flex flex-col items-center gap-4">
                  <ShieldCheck className="w-16 h-16 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-500">暂无教育信息</h3>
                  <p className="text-sm text-gray-500">
                    您还没有添加任何学籍、学历、学位或考研信息
                  </p>
                </div>
              </Card> : showStudentStatus ?
          // 学籍信息格式
          studentStatusRecords.length === 0 ? <Card className="p-8 text-center text-gray-500 rounded-none shadow-sm bg-white">
                  暂无数据
                </Card> : studentStatusRecords.map((record, index) => <Card key={record.id} className="p-0 rounded-none shadow-sm bg-white">
                    {/* 标题栏 - 绿色背景 */}
                    <div className="flex items-center justify-between mb-0">
                      <div className="bg-[#7ec8a6] text-white px-6 py-3 text-lg font-medium">
                        {[record.degree_level, record.school, record.major].filter(Boolean).join('-')}
                      </div>
                      <button className="text-blue-600 hover:underline flex items-center gap-1 mr-6">
                        <ShieldCheck className="w-4 h-4" />
                        查看该学籍的在线验证报告
                      </button>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 flex gap-8">
                      {/* 左侧照片 - 固定宽度 */}
                      <div className="w-[140px] flex-shrink-0 space-y-6">
                        <div>
                          <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                            {record.admission_photo ? (
                              <img 
                                src={record.admission_photo} 
                                alt="录取照片" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">照片</span>
                            )}
                          </div>
                          <p className="text-center text-sm text-gray-600">录取照片</p>
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
                              <span className="text-gray-400 text-sm">照片</span>
                            )}
                          </div>
                          <p className="text-center text-sm text-gray-600">学历照片</p>
                        </div>
                      </div>

                      {/* 右侧详细信息 - 多列布局 */}
                      <div className="flex-1 border-l border-gray-200 pl-8">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">姓名：</span>
                            <span className="text-gray-800 font-medium">{record.name}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">性别：</span>
                            <span className="text-gray-800">{record.gender || "女"}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">出生日期：</span>
                            <span className="text-gray-800">{record.birth_date || "2003年05月25日"}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">民族：</span>
                            <span className="text-gray-800">{record.nationality || "汉族"}</span>
                          </div>
                          <div className="flex items-start col-span-2">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">证件号码：</span>
                            <span className="text-gray-800">{record.id_number || ""}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">学校名称：</span>
                            <span className="text-gray-800">{record.school}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">层次：</span>
                            <span className="text-gray-800">{record.degree_level}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">专业：</span>
                            <span className="text-gray-800">{record.major}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">学制：</span>
                            <span className="text-gray-800">{record.duration || "3 年"}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">学历类别：</span>
                            <span className="text-gray-800">{record.education_type || "普通高等教育"}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">学习形式：</span>
                            <span className="text-gray-800">{record.study_type || "全日制"}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">分院：</span>
                            <span className="text-gray-800">{record.branch || ""}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">系所：</span>
                            <span className="text-gray-800">{record.department || ""}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">班级：</span>
                            <span className="text-gray-800">{record.class || ""}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">学号：</span>
                            <span className="text-gray-800">{record.student_id || ""}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">入学日期：</span>
                            <span className="text-gray-800">{record.enrollment_date || ""}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">学籍状态：</span>
                            <span className="text-gray-800">{record.status || "不在籍（毕业）"}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-24 text-right flex-shrink-0 mr-4">离校日期：</span>
                            <span className="text-gray-800">{record.graduation_date || ""}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>) : allRecords.length === 0 ? <Card className="p-8 text-center text-gray-500 rounded-none shadow-sm bg-white">
                暂无数据
              </Card> : activeTab === "degree" ?
          // 学位信息格式
          allRecords.map((record, index) => <Card key={record.id} className="p-6 rounded-none shadow-sm bg-white">
                  {/* 标题栏 - 绿色背景 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-[#7ec8a6] text-white px-6 py-3 text-lg font-medium">
                      {[record.degreeLevel, record.school, record.major].filter(Boolean).join('-')}
                    </div>
                    <button className="text-blue-600 hover:underline flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      查看该学位的在线验证报告
                    </button>
                  </div>

                  {/* 内容区域 */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-8">
                    {/* 左侧照片 */}
                    <div>
                      <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                        {record.photo ? (
                          <img 
                            src={record.photo} 
                            alt="学位照片" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">照片</span>
                        )}
                      </div>
                      <p className="text-center text-sm text-gray-600">学位照片</p>
                    </div>

                    {/* 右侧详细信息 */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">姓名：</span>
                        <span className="text-gray-800 font-medium">{record.name || "浆果儿"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">性别：</span>
                        <span className="text-gray-800">{record.gender || "女"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">出生日期：</span>
                        <span className="text-gray-800">{record.birthDate || "2001年12月09日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">获学位日期：</span>
                        <span className="text-gray-800">{record.graduationDate || "2025年06月30日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学位授予单位：</span>
                        <span className="text-gray-800">{record.school}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">所授学位：</span>
                        <span className="text-gray-800">{record.degreeType || "经济学学士学位"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学科/专业：</span>
                        <span className="text-gray-800">{record.major}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学位证书编号：</span>
                        <span className="text-gray-800">{record.certificateNumber || "101103832942"}</span>
                      </div>
                    </div>
                  </div>
                </Card>) : activeTab === "exam" ?
          // 考研信息格式
          allRecords.map((record, index) => <Card key={record.id} className="p-6 rounded-none shadow-sm bg-white">
                  {/* 标题栏 - 绿色背景 */}
                  <div className="bg-[#7ec8a6] text-white px-6 py-3 text-lg font-medium mb-6">
                    {record.year}年({record.school})
                  </div>

                  {/* 内容区域 */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-8">
                    {/* 左侧照片 */}
                    <div>
                      <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                        {record.photo ? (
                          <img 
                            src={record.photo} 
                            alt="考研照片" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">照片</span>
                        )}
                      </div>
                    </div>

                    {/* 右侧信息区域 */}
                    <div className="space-y-6">
                      {/* 报考信息 */}
                      <div>
                        <h3 className="text-base font-semibold mb-4 text-gray-800">报考信息</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                          <div className="flex">
                            <span className="text-gray-500 w-28 flex-shrink-0">报考点：</span>
                            <span className="text-gray-800">{record.exam_location || "1101"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">考试方式：</span>
                            <span className="text-gray-800">{record.exam_type || "全国统考"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-28 flex-shrink-0">报名号：</span>
                            <span className="text-gray-800">{record.registration_number || "110826475"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">专项计划：</span>
                            <span className="text-gray-800">{record.special_program || "非专项计划"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-28 flex-shrink-0">报考单位：</span>
                            <span className="text-gray-800">{record.exam_unit || "10001"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-28 flex-shrink-0">外语语名称：</span>
                            <span className="text-gray-800">{record.foreign_language_name || "英语（一）"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-28 flex-shrink-0">报考院系所：</span>
                            <span className="text-gray-800">{record.department || "无"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">政治理论名称：</span>
                            <span className="text-gray-800">{record.politics_name || "思想政治理论"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">报考专业：</span>
                            <span className="text-gray-800">{record.major || "041420"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">业务课一名称：</span>
                            <span className="text-gray-800">{record.business_course1_name || "数学（三）"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">研究方向：</span>
                            <span className="text-gray-800">{record.research_direction || "无"}</span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-500 w-32 flex-shrink-0">业务课二名称：</span>
                            <span className="text-gray-800">{record.business_course2_name || "431 金融学综合"}</span>
                          </div>
                        </div>
                      </div>

                      {/* 成绩信息和录取信息 */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* 成绩信息 */}
                        <div>
                          <h3 className="text-base font-semibold mb-4 text-gray-800">成绩信息</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">政治理论：</span>
                              <span className="text-gray-800">{record.politics_score || "78"}</span>
                            </div>
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">外国语：</span>
                              <span className="text-gray-800">{record.foreign_language_score || "80"}</span>
                            </div>
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">业务课一：</span>
                              <span className="text-gray-800">{record.business_course1_score || "137"}</span>
                            </div>
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">业务课二：</span>
                              <span className="text-gray-800">{record.business_course2_score || "139"}</span>
                            </div>
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">总分：</span>
                              <span className="text-gray-800">{record.total_score || "434.0"}</span>
                            </div>
                          </div>
                        </div>

                        {/* 录取信息 */}
                        <div>
                          <h3 className="text-base font-semibold mb-4 text-gray-800">录取信息</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">录取单位：</span>
                              <span className="text-gray-800">{record.admission_unit || record.school || "清华大学"}</span>
                            </div>
                            <div className="flex">
                              <span className="text-gray-500 w-28 flex-shrink-0">录取专业：</span>
                              <span className="text-gray-800">{record.admission_major || "工商管理学"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>) :
          // 学历信息格式
          allRecords.map((record, index) => <Card key={record.id} className="p-6 rounded-none shadow-sm bg-white">
                  {/* 标题栏 - 绿色背景 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-[#7ec8a6] text-white px-6 py-3 text-lg font-medium">
                      {[record.degreeLevel, record.school, record.major].filter(Boolean).join('-')}
                    </div>
                    <button className="text-blue-600 hover:underline flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      查看该学历的电子注册备案表
                    </button>
                  </div>

                  {/* 内容区域 */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-8">
                    {/* 左侧照片 */}
                    <div>
                      <div className="w-full aspect-[3/4] bg-gray-50 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                        {record.photo ? (
                          <img 
                            src={record.photo} 
                            alt="学历照片" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">照片</span>
                        )}
                      </div>
                      
                    </div>

                    {/* 右侧详细信息 */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">姓名：</span>
                        <span className="text-gray-800 font-medium">{record.name || "浆果儿"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">性别：</span>
                        <span className="text-gray-800">{record.gender || "女"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">出生日期：</span>
                        <span className="text-gray-800">{record.birthDate || "2002年12月09日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">入学日期：</span>
                        <span className="text-gray-800">{record.enrollmentDate || "2021年09月03日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">毕（结）业日期：</span>
                        <span className="text-gray-800">{record.graduationDate || "2025年06月30日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学校名称：</span>
                        <span className="text-gray-800">{record.school}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">专业：</span>
                        <span className="text-gray-800">{record.major}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学历类别：</span>
                        <span className="text-gray-800">{record.studyType || "普通高等教育"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学制：</span>
                        <span className="text-gray-800">{record.duration || "4 年"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">学习形式：</span>
                        <span className="text-gray-800">{record.studyType || "全日制"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">层次：</span>
                        <span className="text-gray-800">{record.degreeLevel}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-32 flex-shrink-0">毕（结）业：</span>
                        <span className="text-gray-800">毕业</span>
                      </div>
                      <div className="flex col-span-2">
                        <span className="text-gray-500 w-32 flex-shrink-0">校（院）长姓名：</span>
                        <span className="text-gray-800">{record.principalName || "李路明"}</span>
                      </div>
                      <div className="flex col-span-2">
                        <span className="text-gray-500 w-32 flex-shrink-0">证书编号：</span>
                        <span className="text-gray-800">{record.certificateNumber || "5432 1233 5435 43612 85"}</span>
                      </div>
                    </div>
                  </div>
                </Card>)}

            {/* 职位推荐 - 仅在学历信息栏目下显示 */}
            {activeTab === "education" && (
              <Card className="p-6 rounded-none shadow-sm bg-white">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">你想求职吗？这里有适合你的职位</h3>
                  <div className="flex gap-4 text-sm">
                    <button className="text-[#5cb87c] hover:text-[#4cae4c]">换一批</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-[#5cb87c] hover:text-[#4cae4c]">更多</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[{
                    title: "C++软件开发工程师",
                    salary: "10.0K-20.0K",
                    level: "本科及以上"
                  }, {
                    title: "机电类技术岗位",
                    salary: "9.0K-13.0K",
                    level: "本科及以上"
                  }, {
                    title: "售前客服",
                    salary: "4.0K-6.0K",
                    level: "本科及以上"
                  }, {
                    title: "研发岗（2027届）",
                    salary: "20.0K-22.0K",
                    level: "硕士及以上"
                  }].map((job, index) => <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer rounded-none border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{job.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{job.salary} / {job.level}</p>
                        </div>
                      </div>
                    </Card>)}
                </div>
              </Card>
            )}

          </div>

          {/* 右侧专业推荐 - 占1列 */}
          <div className="lg:col-span-1">
            <RecommendationCard index={0} />
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="w-[80%] mx-auto px-4 text-center text-sm text-gray-500 space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button className="hover:text-primary">模拟网</button>
            <span>|</span>
            <button className="hover:text-primary">帮助中心</button>
            <span>|</span>
            <span>Copyright © 2003-2025 模拟网 All Rights Reserved</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <span>京ICP备19004913号-1</span>
            <span>京公网安备11010202007479号</span>
          </div>
        </div>
      </footer>
    </div>;
};
export default EducationBackground;