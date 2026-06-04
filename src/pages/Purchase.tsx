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
    question: "如何购买套餐？",
    answer: "目前支持通过微信、支付宝购买，点击上方套餐下方购买按钮即可前往商品购买页。如遇到麻烦，可通过下方售后QQ群联系我们。"
  },
  {
    question: "登录次数是什么意思？",
    answer: "每次登录系统会消耗1次登录次数。次数用完后需要续费才能继续使用。登录次数不使用永不过期"
  },
  {
    question: "PDF积分是什么？",
    answer: "PDF积分用于生成学历、学位、学籍等验证报告的PDF文件。制作一份PDF消耗30积分，积分不使用永不过期。"
  },
  {
    question: "数据安全吗？",
    answer: "所有数据均采用加密存储，仅您本人可见。"
  },
  {
    question: "忘记密码怎么办？",
    answer: "由于数据是加密存储的，所以请牢记您的密码，如果忘记密码则无法找回。建议您将密码妥善保管，或使用密码管理工具保存。"
  },
  {
    question: "可以退款吗？",
    answer: "虚拟商品一经售出概不退款，请在购买前确认您的需求。如有疑问可先咨询后再购买。有任何问题请联系我们。"
  }
];

const Purchase = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // 从环境变量读取配置，提供默认值以防未配置
  const qqGroup = import.meta.env.VITE_QQ_GROUP || "1034981273";
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
      logins: "1次登录",
      price: "¥3",
      description: "获取一张1次登录次数充值卡密",
      popular: false,
      features: ["数据加密存储", "支持个人信息任意修改"],
      icon: Zap,
      gradient: "from-sky-500 to-blue-500",
    },
    {
      name: "标准版",
      logins: "5次登录",
      price: "¥9",
      description: "获取一张5次登录次数充值卡密",
      popular: false,
      features: ["数据加密存储", "支持信息任意修改"],
      icon: Sparkles,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "进阶版",
      logins: "30次登录",
      price: "¥29",
      description: "获取一张30次登录次数充值卡密",
      popular: true,
      features: ["购买人数最多","数据加密存储", "支持信息任意修改"],
      icon: Crown,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "永久版",
      logins: "不限制登录次数",
      price: "¥99",
      description: "获取一张不限制登录次数的充值卡密，额外赠送30个PDF下载积分",
      popular: false,
      features: ["无限制登录次数","额外赠送30个PDF下载积分", "数据加密存储", "支持信息任意修改"],
      icon: Crown,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      name: "PDF积分包",
      logins: "30个PDF积分",
      price: "¥30",
      description: "30个PDF下载积分，积分不使用永不过期",
      popular: true,
      features: ["可制作一份PDF", "积分对三种PDF均可通用"],
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
          <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
            {plans.slice(0, 4).map((plan, index) => {
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

        {/* PDF制作 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            PDF制作
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
            <div className="flex items-center justify-center gap-3 p-4 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
              <span className="text-lg font-mono font-semibold tracking-wide">{qqGroup}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyQQ}
                className="gap-1.5 hover:bg-primary/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-primary" />
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
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Purchase;
