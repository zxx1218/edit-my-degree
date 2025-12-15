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
      title: "系统基础操作",
      description: "添加学籍、学历、学位、考研信息等基础功能演示",
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
        { number: "3", text: "系统没有登陆时间限制，能否登陆只看登录次数余额", isWarning: false },
        {
          number: "4",
          text: "点击具体卡片跳转详情页面需等待数据加载，稍等片刻即可进入",
          isWarning: false,
        },
        {
          number: "5",
          text: "如果您是第一次使用，建议您先使用电脑登录后将所有信息设置好，再使用手机登录查看（因为电脑更方便打字与操作）",
          isWarning: false,
        },
        {
          number: "6",
          text: "每生成一份报告需消耗30个PDF积分，永久版用户会赠送30个积分，若需PDF积分充值请在闲鱼下单",
          isWarning: true,
        },
        { number: "7", text: "特别注意：在系统内修改的各项信息，不会同步到自己的真实学信网上", isWarning: true },
      ],
    },
    demo2: {
      src: "tt.mp4",
      title: "在线验证报告生成",
      description: "学籍、学历、学位在线验证报告生成功能以及网页版学信档案操作演示",
      instructions: [
        {
          number: "1",
          text: "生成PDF之前务必注意您填写的信息要准确，证件照上传请保持1:1.33的标准证件照比例",
          isWarning: false,
        },
        {
          number: "2",
          text: "务必使用电脑登录系统操作PDF报告的下载，部分手机浏览器对生成的报告可能只能观看无法下载",
          isWarning: false,
        },
        {
          number: "3",
          text: "每生成一份报告需消耗30个PDF积分，永久版用户会赠送30个积分，若需额外PDF积分充值请在闲鱼下单",
          isWarning: false,
        },
        {
          number: "4",
          text: "网页版学信档案建议使用电脑端访问，手机访问效果不佳，注意网页版档案信息来源于您在主页设置的学籍学历学位以及考研信息卡片及其内容，请先设置好再登陆网页版查看",
          isWarning: false,
        },
        { number: "5", text: "特别注意：低调使用！", isWarning: true },
      ],
    },
    demo3: {
      src: "ttt.mp4",
      title: "账号注册与充值示范",
      description: "演示如何在系统内注册账号，以及如何使用卡密为账号充值登录次数或PDF积分",
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
          text: '在登录页面点击"充值/续费"按钮，选择对应充值类型，输入已注册的账号和购买的卡密进行充值',
          isWarning: false,
        },
        {
          number: "4",
          text: "充值成功后，对应的登录次数或PDF积分会自动添加到您的账户中",
          isWarning: false,
        },
        {
          number: "5",
          text: "卡密就是一种预付费的充值码，类似于手机话费充值卡，您注册的账号就像是手机号码，使用充值卡密为账号充值后，账号就会获得相应的登录次数或PDF积分，一个账号可以充值多次，但一张卡密只能给一个账号充值一次！",
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
              系统基础操作
            </Button>

            <Button
              variant={selectedVideo === "demo2" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo2")}
            >
              在线验证报告生成
            </Button>

            <Button
              variant={selectedVideo === "demo3" ? "default" : "outline"}
              onClick={() => setSelectedVideo("demo3")}
            >
              账号注册与充值示范
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
