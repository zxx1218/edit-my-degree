import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, ExternalLink, Users, Copy, Check, Sparkles, Zap, Crown, FileText } from "lucide-react";
import { toast } from "sonner";

const faqItems = [
  {
    question: "登录次数是什么意思？",
    answer: "每次登录系统会消耗1次登录次数。次数用完后需要续费才能继续使用。登录次数不使用不会过期。"
  },
  {
    question: "不同套餐的登录次数有什么区别？",
    answer: "除永久卡密额外赠送 30 个PDF积分外，不同套餐区别仅登录次数不同。"
  },
  {
    question: "如何下载APP？",
    answer: "苹果手机在safri浏览器访问登录页后，点击右下角三个点，再点击“共享”，点击“添加到主屏幕”即可形成APP。安卓手机暂未支持APP化。"
  },
  {
    question: "可以多人同时使用一个账号登陆吗？",
    answer: "可以，支持多设备同时登录同一账号，但每台设备都会消耗一次登录次数。"
  },
  {
    question: "如何去掉浏览器访问时的地址栏？",
    answer: "将系统地址复制到微信中打开登录即可。"
  },
  {
    question: "忘记密码怎么办？",
    answer: "由于数据是加密存储的，所以请牢记您的密码，如果忘记密码则无法找回。请您将密码妥善保管。"
  },
  {
    question: "可以退款吗？",
    answer: "虚拟商品一经售出无法退款，请在购买前确认您的需求。如有疑问请先咨询后再购买。"
  }
];

const Purchase = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // 从环境变量读取配置，提供默认值以防未配置
  const qqGroup = import.meta.env.VITE_QQ_GROUP || "1034981273";
  const fullGroupNumber = "1034981273"; // 一群（已满员）
  const card_login = import.meta.env.VITE_CARD_LOGIN_URL || "http://4ox.cn/bq3kuv";
  const card_PDF = import.meta.env.VITE_CARD_PDF_URL || "http://4ox.cn/sdms3r";

  const handleCopyQQ = async () => {
    try {
      await navigator.clipboard.writeText(qqGroup);
      setCopied(true);
      toast.success("QQ群号已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = qqGroup;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("QQ群号已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    }
  };  

  const handlePurchaseLogin = () => {
    window.open(card_login, "_blank");
  };

  const handlePurchasePDF= () => {
    window.open(card_PDF, "_blank");
  };

  const plans = [
    {
      name: "体验版",
      logins: "可登录1次",
      price: "¥3",
      description: "获取一张1次登录次数充值卡密",
      popular: false,
      features: ["数据永久存储", "支持个人信息任意修改"],
      icon: Zap,
      gradient: "from-sky-500 to-blue-500",
    },
    {
      name: "标准版",
      logins: "可登录5次",
      price: "¥9",
      description: "获取一张5次登录次数充值卡密",
      popular: false,
      features: ["数据永久存储", "支持信息任意修改", "支持多设备同时登录"],
      icon: Sparkles,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "进阶版",
      logins: "可登录30次",
      price: "¥29",
      description: "获取一张30次登录次数充值卡密",
      popular: true,
      features: ["数据永久存储", "支持信息任意修改", "购买人数最多", "支持多人多设备同时登录"],
      icon: Crown,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "永久版",
      logins: "不限制登录次数",
      price: "¥99",
      description: "获取一张不限制登录次数的充值卡密，额外赠送30个PDF下载积分",
      popular: false,
      features: ["数据永久存储", "支持信息任意修改", "不限制登录次数","额外赠送30个PDF下载积分", "支持多人多设备同时登录"],
      icon: Crown,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      name: "PDF积分",
      logins: "获得30个PDF积分",
      price: "¥30",
      description: "获得含有30个PDF下载积分的卡密，不使用不过期",
      popular: true,
      features: ["制作后的PDF二维码支持扫码", "制作后的PDF支持下载", "积分对三种PDF均可通用", "卡密每周限量500张，售罄封版"],
      icon: FileText,
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/login")} 
          className="mb-8 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回登录
        </Button>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            选择您的套餐
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            购买或续费模拟档案充值卡密，享受便捷的信息管理服务
          </p>
        </div>

        {/* 登录次数套餐 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            登录次数套餐
          </h2>
          {/* 如果需要四列 下面这行改为 md:grid-cols-4 */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* 如果需要四列 下面这行改为 slice(0, 4) */}
            {plans.slice(1, 4).map((plan, index) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={index}
                  onClick={handlePurchaseLogin}
                  className={`relative group transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-2 ${
                    plan.popular 
                      ? "border-primary shadow-xl ring-2 ring-primary/20" 
                      : "hover:border-primary/50"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary animate-pulse">
                      🔥 热门推荐
                    </Badge>
                  )}
                  
                  {/* 渐变背景头部 */}
                  <div className={`h-2 rounded-t-lg bg-gradient-to-r ${plan.gradient}`} />
                  
                  <CardHeader className="text-center pb-4 pt-6">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full bg-gradient-to-br ${plan.gradient} text-white shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-6">
                      <span className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                    </div>
                    <CardDescription className="mt-3 text-base font-medium">
                      {plan.logins}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                    </div>
                    
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  <div className="px-6 pb-6 pt-2">
                    <button 
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r ${plan.gradient} active:scale-95`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        前往购买
                        <ExternalLink className="h-4 w-4" />
                      </span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* PDF积分套餐 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            PDF积分套餐
          </h2>
          <div className="max-w-md mx-auto">
            <Card 
              onClick={handlePurchasePDF}
              className="relative group transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50"
            >
              <div className="h-2 rounded-t-lg bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <CardHeader className="text-center pb-4 pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plans[4].name}</CardTitle>
                <div className="mt-6">
                  <span className="text-5xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    {plans[4].price}
                  </span>
                </div>
                <CardDescription className="mt-3 text-base font-medium">
                  {plans[4].logins}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{plans[4].description}</p>
                </div>
                
                <div className="space-y-3">
                  {plans[4].features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{feature}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <div className="px-6 pb-6 pt-2">
                <button 
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 active:scale-95"
                >
                  <span className="flex items-center justify-center gap-2">
                    前往购买
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ常见问题 */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">常见问题</h2>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* 客服联系方式卡片 */}
        <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              客服联系方式
            </CardTitle>
            <CardDescription>版本更新通知与售后服务2群</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              如需<span className="font-medium text-foreground">合作/代理</span>或遇到任何问题，欢迎加入QQ群联系我们
            </p>
            
            {/* 二群（当前可用） */}
            <div className="flex items-center justify-center gap-3 p-4 bg-background/90 backdrop-blur-sm rounded-lg border shadow-md border-primary/30 ring-1 ring-primary/10">
              <span className="text-lg font-mono font-semibold tracking-wide">{qqGroup}</span>
              <Badge variant="outline" className="ml-2 text-green-600 border-green-500 bg-green-50">可加入</Badge>
              <Button
                variant="default"
                size="sm"
                onClick={handleCopyQQ}
                className="gap-1.5 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    复制群号
                  </>
                )}
              </Button>
            </div>

            {/* 一群（已满员 - 弱化显示） */}
            <div className="flex items-center justify-center gap-2 py-1 opacity-60 hover:opacity-80 transition-opacity">
              <span className="text-xs text-muted-foreground">注：一群 ({fullGroupNumber})</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-red-200 text-red-500 bg-red-50/50">已满</Badge>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Purchase;
