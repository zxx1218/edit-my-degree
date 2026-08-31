import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, AlertTriangle, Info, BookOpen, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const VideoPlayer = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<"demo1" | "demo2" | "demo3">("demo1");

  const videoConfig = {
    demo1: {
      src: "t.mp4",
      title: "基础操作演示",
      description: "添加或修改学籍、学历、学位、考研信息等功能演示",
      icon: <BookOpen className="h-5 w-5" />,
      instructions: [
        {
          number: "1",
          text: '主页面所有内容的新增、删除和修改都需要长按卡片进行操作。如果只是新增信息，也可以点击右上角"尝试绑定"按钮',
          isWarning: false,
        },
        {
          number: "2",
          text: "点击具体卡片进入详情页可以修改个人信息，若上传的照片过大会导致保存较慢，请耐心等待系统弹出照片保存成功的提示",
          isWarning: false,
        },
        { number: "3", 
          text: "登录后没有使用时间限制，能否登陆只看登录次数余额", 
          isWarning: false 
        },
        { number: "4", text: "仅供娱乐，激励自身努力学习，保持积极向上态度面对人生！", isWarning: true },
      ],
    },
    // demo2: {
    //   src: "tt.mp4",
    //   title: "报告制作演示",
    //   description: "学籍、学历、学位在线验证报告生成功能以及网页版模拟档案操作演示",
    //   icon: <FileText className="h-5 w-5" />,
    //   instructions: [
    //     {
    //       number: "1",
    //       text: "建议使用电脑登录系统操作PDF报告的下载，部分手机浏览器对生成的报告可能只能观看无法下载",
    //       isWarning: false,
    //     },
    //     {
    //       number: "2",
    //       text: "每生成一份报告需消耗30个PDF积分，积分请在登录页点击"卡密购买"购买（永久版卡密自带30个积分赠送）",
    //       isWarning: false,
    //     },
    //     {
    //       number: "3",
    //       text: "网页版模拟网信息来源于您在主页设置的学籍学历学位以及考研信息卡片及其内容，请先设置好再登陆网页版查看",
    //       isWarning: false,
    //     },
    //     { number: "4", text: "特别注意：低调低调！！", isWarning: true },
    //   ],
    // },
    demo3: {
      src: "ttt.mp4",
      title: "账号注册与充值演示",
      description: "演示如何在系统内注册账号，以及注册后如何使用卡密为您的账号充值登录次数或PDF积分",
      icon: <CreditCard className="h-5 w-5" />,
      instructions: [
        {
          number: "1",
          text: '在登录页面点击"注册"按钮，输入用户名和密码完成账号注册（用户名不能包含中文）',
          isWarning: false,
        },
        {
          number: "2",
          text: "注册成功后，新账号的登录次数余额为0，需要使用充值卡密进行充值后才能登录",
          isWarning: false,
        },
        {
          number: "3",
          text: '在登录页面点击"使用卡密"按钮，选择对应的卡密类型，输入已注册的账号和购买的卡密进行充值',
          isWarning: false,
        },
        {
          number: "4",
          text: "卡密就是一种预付费的充值卡，同手机话费充值卡一样，使用充值卡密为账号充值后，账号就会获得卡密内的登录次数或者PDF积分！",
          isWarning: true,
        },
      ],
    },
  };

  const currentVideo = videoConfig[selectedVideo];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 顶部导航 */}
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="gap-2 hover:bg-primary/5 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PlayCircle className="h-4 w-4" />
            <span>视频演示</span>
          </div>
        </div>

        {/* 主容器 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          {/* 视频切换标签 */}
          <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            {/* 提示信息 */}
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <span className="font-medium">点击下方按钮切换不同的演示内容</span>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setSelectedVideo("demo1")}
                className={`relative px-5 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2.5 min-w-[160px] justify-center ${
                  selectedVideo === "demo1"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-300 dark:ring-blue-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md"
                }`}
              >
                <BookOpen className={`h-5 w-5 transition-transform duration-300 ${
                  selectedVideo === "demo1" ? "scale-110" : ""
                }`} />
                <span className="text-sm">系统基础操作</span>
                {selectedVideo === "demo1" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                )}
              </button>

              {/* <button
                onClick={() => setSelectedVideo("demo2")}
                className={`relative px-5 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2.5 min-w-[160px] justify-center ${
                  selectedVideo === "demo2"
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105 ring-2 ring-purple-300 dark:ring-purple-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 border-2 border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md"
                }`}
              >
                <FileText className={`h-5 w-5 transition-transform duration-300 ${
                  selectedVideo === "demo2" ? "scale-110" : ""
                }`} />
                <span className="text-sm">在线验证报告制作</span>
                {selectedVideo === "demo2" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                )}
              </button> */}

              <button
                onClick={() => setSelectedVideo("demo3")}
                className={`relative px-5 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2.5 min-w-[160px] justify-center ${
                  selectedVideo === "demo3"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300 dark:ring-emerald-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md"
                }`}
              >
                <CreditCard className={`h-5 w-5 transition-transform duration-300 ${
                  selectedVideo === "demo3" ? "scale-110" : ""
                }`} />
                <span className="text-sm">账号注册与充值</span>
                {selectedVideo === "demo3" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                )}
              </button>
            </div>
          </div>

          {/* 视频播放器 */}
          <div className="relative bg-black">
            <div className="aspect-video w-full">
              <video
                key={selectedVideo}
                controls
                autoPlay
                preload="metadata"
                className="w-full h-full object-contain"
                poster=""
                onError={(e) => {
                  toast.error("视频加载失败，请刷新页面重试");
                }}
                onLoadedData={() => {
                  // 视频数据加载成功
                }}
              >
                <source src={currentVideo.src} type="video/mp4" />
                <source src={currentVideo.src} type="video/webm" />
                您的浏览器不支持视频播放
              </video>
            </div>
          </div>

          {/* 说明区域 */}
          <div className="p-6 md:p-8 space-y-6">
            {/* 标题和描述 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {currentVideo.icon}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {currentVideo.title}
                </h1>
              </div>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                {currentVideo.description}
              </p>
            </div>

            {/* 操作说明列表 */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 md:p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                操作说明
              </h2>
              <div className="space-y-4">
                {currentVideo.instructions.map((instruction) => (
                  <div 
                    key={instruction.number} 
                    className={`flex gap-3 p-3 rounded-lg transition-all duration-200 ${
                      instruction.isWarning 
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" 
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md"
                    }`}
                  >
                    <span 
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        instruction.isWarning 
                          ? "bg-red-500 text-white" 
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {instruction.number}
                    </span>
                    <div className="flex-1">
                      {instruction.isWarning ? (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="font-semibold text-red-700 dark:text-red-400 leading-relaxed">
                            {instruction.text}
                          </p>
                        </div>
                      ) : (
                        <p className="text-foreground/80 leading-relaxed">
                          {instruction.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
