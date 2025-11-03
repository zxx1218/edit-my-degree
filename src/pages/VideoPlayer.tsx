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
              src="http://jk.fortunefreedom.top:9090/share/5_eKT01x"
              className="w-full h-full border-0"
              allowFullScreen
              title="系统使用介绍视频"
            />
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">系统使用介绍视频</h1>
            <p className="text-muted-foreground">
              观看此视频了解如何使用学信档案系统的各项功能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
