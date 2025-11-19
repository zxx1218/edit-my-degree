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
      title: "系统基础操作演示",
      description: "添加学籍、学历、学位、考研信息等基础功能演示"
    },
    demo2: {
      src: "tt.mp4", // 替换为第二个视频的路径
      title: "在线验证报告生成演示",
      description: "学籍、学历、学位在线验证报告生成功能演示"
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
              系统基础操作演示
            </Button>
            <Button
              variant={selectedVideo === "demo2" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo2")}
            >
              在线验证报告生成演示
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
              <div className="flex gap-2">
                <span className="text-primary font-semibold">1.</span>
                <p className="text-foreground/80">长按选项卡可以编辑学历信息内容或者添加学籍学历学位，单点选项卡可以跳转到信息详情页面（存在1-2秒加载延迟）</p>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-semibold">2.</span>
                <p className="text-foreground/80">每个学历学位的详情页面都支持上传自己的照片，且所有个人数据都会加密存储，下次登录依然存在</p>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-semibold">3.</span>
                <p className="text-foreground/80">系统没有登陆时间限制，能否登陆只看登录次数余额</p>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-semibold">4.</span>
                <p className="text-foreground/80">登录次数余额为0后7天会删除个人信息，如需续费请在信息删除之前，否则只能重新注册</p>
              </div>
              <div className="flex gap-2">
                <span className="text-destructive font-semibold">5.</span>
                <p className="text-foreground/80"><span className="font-semibold text-destructive">特别注意：在系统内修改的各项信息，不会同步到自己的真实学信网上</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
