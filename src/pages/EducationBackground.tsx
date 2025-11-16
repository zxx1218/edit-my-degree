import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck } from "lucide-react";
import { getUserData } from "@/lib/api";
import { toast } from "sonner";

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
}

const EducationBackground = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStatusRecords, setStudentStatusRecords] = useState<any[]>([]);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [degreeRecords, setDegreeRecords] = useState<EducationRecord[]>([]);
  const [activeTab, setActiveTab] = useState("education");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
          const user = JSON.parse(userStr);
          const data = await getUserData(user.id);

          setStudentStatusRecords(data.studentStatus || []);
          setEducationRecords(data.education || []);
          setDegreeRecords(data.degree || []);
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

  const allRecords = activeTab === "education" ? educationRecords : activeTab === "degree" ? degreeRecords : [];
  const showStudentStatus = activeTab === "info";

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" />
            <span className="text-xl font-semibold">学信档案</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <button className="hover:text-accent transition-colors">首页</button>
            <button className="hover:text-accent transition-colors">高等教育信息</button>
            <button className="hover:text-accent transition-colors">在线验证报告</button>
            <button className="hover:text-accent transition-colors">学历学位认证与成绩验证</button>
            <button className="hover:text-accent transition-colors">出国报告发送</button>
            <button className="hover:text-accent transition-colors">调查/投票</button>
            <button className="hover:text-accent transition-colors">就业测评</button>
            <button className="hover:text-accent transition-colors">就业</button>
            <button className="hover:text-accent transition-colors">个人中心</button>
          </nav>
        </div>
      </header>

      {/* 二级导航 */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              学籍信息/园校对
            </button>
            <button
              onClick={() => setActiveTab("education")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "education"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              学历信息
            </button>
            <button
              onClick={() => setActiveTab("degree")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "degree"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              学位信息
            </button>
            <button
              onClick={() => setActiveTab("exam")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "exam"
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              考研信息
            </button>
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧主内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 横幅广告 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-orange-100 to-orange-50 p-6 border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">专业满意度</h3>
                <p className="text-sm text-orange-700">
                  好大学我的孩子选择、教学质量、就业情况及权威性就行提要
                </p>
              </Card>
              <Card className="bg-gradient-to-r from-purple-100 to-purple-50 p-6 border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">职场实习</h3>
                <p className="text-sm text-purple-700">
                  反馈实习困惑、实践心得与建议，解大家实习疑虑更习惯
                </p>
              </Card>
            </div>

            {/* 学历数量提示 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>您一共有 {showStudentStatus ? studentStatusRecords.length : allRecords.length} 个{showStudentStatus ? "学籍" : "学历"}</span>
              <button className="text-primary hover:underline">还有{showStudentStatus ? "学籍" : "学历"}没有显示出来？</button>
              <span>|</span>
              <button className="text-primary hover:underline">{showStudentStatus ? "学籍" : "学历"}查询范围</button>
            </div>

            {/* 学历/学籍列表 */}
            {loading ? (
              <Card className="p-8 text-center text-muted-foreground">
                加载中...
              </Card>
            ) : showStudentStatus ? (
              // 学籍信息格式
              studentStatusRecords.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  暂无数据
                </Card>
              ) : (
                studentStatusRecords.map((record) => (
                  <Card key={record.id} className="p-6">
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="bg-primary text-primary-foreground px-6 py-3 rounded text-lg font-medium">
                        {record.degree_level}-{record.school}-{record.major}
                      </div>
                      <button className="text-primary hover:underline flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        查看该学籍的在线验证报告
                      </button>
                    </div>

                    {/* 内容区域 */}
                    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                      {/* 左侧照片 */}
                      <div className="space-y-6">
                        <div>
                          <div className="w-full aspect-[3/4] bg-primary/5 rounded flex items-center justify-center mb-2">
                            <span className="text-muted-foreground text-sm">照片</span>
                          </div>
                          <p className="text-center text-sm text-muted-foreground">录取照片</p>
                        </div>
                        <div>
                          <div className="w-full aspect-[3/4] bg-primary/5 rounded flex items-center justify-center mb-2">
                            <span className="text-muted-foreground text-sm">照片</span>
                          </div>
                          <p className="text-center text-sm text-muted-foreground">学历照片</p>
                        </div>
                      </div>

                      {/* 右侧详细信息 */}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                        <div className="flex">
                          <span className="text-muted-foreground w-28">姓名：</span>
                          <span className="font-medium">{record.name}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">性别：</span>
                          <span>{record.gender || "男"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">出生日期：</span>
                          <span>{record.birth_date || "1999年12月18日"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">民族：</span>
                          <span>{record.nationality || "汉族"}</span>
                        </div>
                        <div className="flex col-span-2">
                          <span className="text-muted-foreground w-28">证件号码：</span>
                          <span>{record.id_number || ""}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">学校名称：</span>
                          <span>{record.school}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">层次：</span>
                          <span>{record.degree_level}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">专业：</span>
                          <span>{record.major}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">学制：</span>
                          <span>{record.duration || "3 年"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">学历类别：</span>
                          <span>{record.education_type || "普通高等教育"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">学习形式：</span>
                          <span>{record.study_type || "全日制"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">分院：</span>
                          <span>{record.branch || ""}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">系所：</span>
                          <span>{record.department || ""}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">班级：</span>
                          <span>{record.class || ""}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">学号：</span>
                          <span>{record.student_id || ""}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">入学日期：</span>
                          <span>{record.enrollment_date || ""}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">学籍状态：</span>
                          <span>{record.status || "不在籍（毕业）"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-muted-foreground w-28">离校日期：</span>
                          <span>{record.graduation_date || ""}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )
            ) : allRecords.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                暂无数据
              </Card>
            ) : (
              // 学历/学位信息格式
              allRecords.map((record) => (
                <Card key={record.id} className="p-6">
                  {/* 标题栏 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded text-lg font-medium">
                      {record.degreeLevel}-{record.school}-{record.major}
                    </div>
                    <button className="text-primary hover:underline flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      查看该学历的电子注册备案表
                    </button>
                  </div>

                  {/* 内容区域 */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                    {/* 左侧照片 */}
                    <div>
                      <div className="w-full aspect-[3/4] bg-primary/5 rounded flex items-center justify-center mb-2">
                        <span className="text-muted-foreground text-sm">照片</span>
                      </div>
                      <p className="text-center text-sm text-muted-foreground">学历照片</p>
                    </div>

                    {/* 右侧详细信息 */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                      <div className="flex">
                        <span className="text-muted-foreground w-32">姓名：</span>
                        <span className="font-medium">{record.name || "朱晓煜"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">性别：</span>
                        <span>{record.gender || "男"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">出生日期：</span>
                        <span>{record.birthDate || "1999年12月18日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">入学日期：</span>
                        <span>{record.enrollmentDate || "2022年09月03日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">毕（结）业日期：</span>
                        <span>{record.graduationDate || "2025年06月13日"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">学校名称：</span>
                        <span>{record.school}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">专业：</span>
                        <span>{record.major}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">学历类别：</span>
                        <span>{record.studyType || "普通高等教育"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">学制：</span>
                        <span>{record.duration || "3 年"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">学习形式：</span>
                        <span>{record.studyType || "全日制"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">层次：</span>
                        <span>{record.degreeLevel}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-32">毕（结）业：</span>
                        <span>毕业</span>
                      </div>
                      <div className="flex col-span-2">
                        <span className="text-muted-foreground w-32">校（院）长姓名：</span>
                        <span>{record.principalName || "盛况"}</span>
                      </div>
                      <div className="flex col-span-2">
                        <span className="text-muted-foreground w-32">证书编号：</span>
                        <span>{record.certificateNumber || "1034 7120 2502 5201 62"}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* 职位推荐 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">你想求职吗？这里有适合你的职位</h3>
                <div className="flex gap-4 text-sm">
                  <button className="text-primary hover:underline">换一批</button>
                  <span>|</span>
                  <button className="text-primary hover:underline">更多</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "软件工程师", salary: "10.0K-20.0K", level: "本科及以上" },
                  { title: "售后客服", salary: "8.0K-10.0K", level: "本科及以上" },
                  { title: "售前客服", salary: "8.0K-12.0K", level: "本科及以上" },
                ].map((job, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{job.title}</h4>
                        <p className="text-sm text-primary mt-1">{job.salary}</p>
                        <p className="text-xs text-muted-foreground mt-1">{job.level}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* 右侧推荐卡片 */}
          <div className="space-y-6">
            {/* 专业推荐 */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">专业推荐</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">累计投票</span>
                <span className="text-2xl font-bold text-primary">1699</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                您已推荐 1 个专业，还能推荐 7 个
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90">
                我要推荐
              </Button>
            </Card>

            {/* 专业满意度 */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">专业满意度</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">累计投票</span>
                <span className="text-2xl font-bold text-orange-500">683</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>综合</span>
                  <span className="text-primary font-medium">3.9</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>办学条件</span>
                  <span className="text-primary font-medium">3.8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>就业</span>
                  <span className="text-primary font-medium">3.6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>教学质量</span>
                  <span className="text-primary font-medium">3.8</span>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">
                我要评价
              </Button>
            </Card>

            {/* 院校满意度 */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">院校满意度</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">累计投票</span>
                <span className="text-2xl font-bold text-orange-500">4106</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>综合</span>
                  <span className="text-primary font-medium">3.7</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>环境</span>
                  <span className="text-primary font-medium">4.1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>生活</span>
                  <span className="text-primary font-medium">3.3</span>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">
                我要评价
              </Button>
            </Card>

            {/* 毕业论文查重 */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-primary mb-2">毕业论文查重</h3>
                <p className="text-sm text-muted-foreground">Q友专属</p>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">
                学科/专业变化查询
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-card border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-4">
            <button className="hover:text-primary">学信网</button>
            <span>|</span>
            <button className="hover:text-primary">帮助中心</button>
          </div>
          <p>Copyright © 2003-2025 学信网 All Rights Reserved</p>
          <div className="flex items-center justify-center gap-4">
            <span>京ICP备19004913号-1</span>
            <span>京公网安备11010202007479号</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EducationBackground;
