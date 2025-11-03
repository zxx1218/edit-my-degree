import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const VideoPlayer = () => {
  const navigate = useNavigate();

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
          <div className="aspect-video w-full">
            <iframe
              src="t.mp4"
              className="w-full h-full border-0"
              allowFullScreen
              title="系统使用介绍视频"
            />
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">系统使用介绍视频</h1>
            <p className="text-muted-foreground mb-4">
              观看此视频了解如何使用学信档案系统的各项功能
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
