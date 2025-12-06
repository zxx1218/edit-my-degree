import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const VideoPlayer = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<"demo1" | "demo2">("demo1");

  const videoConfig = {
    demo1: {
      src: "t.mp4",
      title: "系统基础操作",
      description: "添加学籍、学历、学位、考研信息等基础功能演示",
      instructions: [
        { number: "1", text: "点击或者长按任何卡片位都可以编辑当前卡片栏目内容，或者点击“尝试绑定”可以添加学籍学历学位", isWarning: false },
        { number: "2", text: "单机具体卡片进入详情页可以修改个人信息，但上传的照片保存会比较慢，请等待系统弹出保存成功的提示", isWarning: false },
        { number: "3", text: "系统没有登陆时间限制，能否登陆只看登录次数余额", isWarning: false },
        { number: "4", text: "第一次不会使用建议使用电脑登录，修改好全部信息后再使用手机登录查看", isWarning: false },
        { number: "4", text: "请勿将系统至于后台太久，时间太久会触发自动退出", isWarning: false },
        { number: "5", text: "特别注意：在系统内修改的各项信息，不会同步到自己的真实学信网上", isWarning: true }
      ]
    },
    demo2: {
      src: "tt.mp4",
      title: "在线验证报告生成",
      description: "学籍、学历、学位在线验证报告生成功能以及网页版学信档案操作演示",
      instructions: [
        { number: "1", text: "生成PDF之前务必注意您填写的信息要准确，证件照上传请保持1:1.33的标准比例", isWarning: false },
        { number: "2", text: "务必使用电脑登录系统操作PDF报告的下载，部分手机浏览器对生成的报告可能只能观看无法下载", isWarning: false },
        { number: "3", text: "每生成一份报告需消耗30个PDF积分，永久版用户开通后会赠送30个积分，PDF积分充值请在闲鱼下单", isWarning: false },
        { number: "4", text: "网页版学信档案建议使用电脑端访问，手机访问效果不佳，网页版信息来源于您在主页设置的个人信息，请先设置好在登陆网页版查看", isWarning: false },
        { number: "5", text: "特别注意：低调使用！", isWarning: true }
      ]
    }
  };

  const currentVideo = videoConfig[selectedVideo];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b flex gap-2">
            <Button
              variant={selectedVideo === "demo1" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo1")}
            >
              系统基础操作
            </Button>
            <Button
              variant={selectedVideo === "demo2" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo2")}
            >
              在线验证报告生成
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
            <p className="text-muted-foreground mb-4">
              {currentVideo.description}
            </p>
            
            <div className="mt-6 space-y-3 text-sm">
              {currentVideo.instructions.map((instruction) => (
                <div key={instruction.number} className="flex gap-2">
                  <span className={`font-semibold ${instruction.isWarning ? 'text-destructive' : 'text-primary'}`}>
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
