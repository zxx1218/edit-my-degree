import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const VideoPlayer = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<"demo1" | "demo2" | "demo3">("demo1");

  const videoConfig = {
    demo1: {
      src: "t.mp4",
      title: "基础操作演示",
      description: "添加或修改学籍、学历、学位、考研信息等功能演示",
      instructions: [
        {
          number: "1",
          text: '主页面所有卡片（包括学籍、学历、学位、考研信息）的新增、删除和修改都需要长按卡片进行操作。如果只是新增信息，也可以点击右上角"尝试绑定"按钮',
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
    //   instructions: [
    //     {
    //       number: "1",
    //       text: "建议使用电脑登录系统操作PDF报告的下载，部分手机浏览器对生成的报告可能只能观看无法下载",
    //       isWarning: false,
    //     },
    //     {
    //       number: "2",
    //       text: "每生成一份报告需消耗30个PDF积分，积分请在登录页点击“卡密购买”购买（永久版卡密自带30个积分赠送）",
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b flex gap-2 flex-wrap">
            <Button
              variant={selectedVideo === "demo1" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo1")}
            >
              系统基础操作演示
            </Button>

             {/* <Button
              variant={selectedVideo === "demo2" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo2")}
            >
              在线验证报告制作演示
            </Button> */}

            <Button
              variant={selectedVideo === "demo3" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo3")}
            >
              账号注册与充值演示
            </Button>
          </div>
          <div className="aspect-video w-full">
            <iframe
              key={selectedVideo}
              src={currentVideo.src}
              className="w-full h-full border-0"
              allowFullScreen
              title={currentVideo.title}
            />
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{currentVideo.title}</h1>
            <p className="text-muted-foreground mb-4">{currentVideo.description}</p>

            <div className="mt-6 space-y-3 text-sm">
              {currentVideo.instructions.map((instruction) => (
                <div key={instruction.number} className="flex gap-2">
                  <span className={`font-semibold ${instruction.isWarning ? "text-destructive" : "text-primary"}`}>
                    {instruction.number}.
                  </span>
                  <p className="text-foreground/80">
                    {instruction.isWarning ? (
                      <span className="font-semibold text-destructive">{instruction.text}</span>
                    ) : (
                      instruction.text
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
