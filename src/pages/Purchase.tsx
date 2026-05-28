import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, ExternalLink, Users, Copy, Check } from "lucide-react";
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
      logins: "5次登录",
      price: "¥9",
      description: "为您的个人账号充值5次登录次数",
      popular: false,
      features: ["数据加密存储", "支持信息任意修改"],
    },
    {
      name: "标准版",
      logins: "50次登录",
      price: "¥29",
      description: "为您的个人账号充值50次登录次数",
      popular: true,
      features: ["数据加密存储", "支持信息任意修改"],
    },
    {
      name: "永久版",
      logins: "无限",
      price: "¥99",
      description: "永久使用，不限制登录次数",
      popular: false,
      features: ["赠送30个PDF下载积分", "数据加密存储", "支持信息任意修改"],
    },
    {
      name: "PDF积分包",
      logins: "30个PDF积分",
      price: "¥30",
      description: "30个PDF下载积分，积分不使用永不过期",
      popular: true,
      features: ["制作一份PDF消耗30积分", "积分对三种PDF均可通用"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/login")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回登录
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">选择您的套餐</h1>
          <p className="text-muted-foreground text-lg">购买或续费模拟档案账号，享受便捷的信息管理服务</p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-6">主要套餐</h2>
        <div className="grid md:grid-cols-3 gap-6">
            {plans.slice(0, 3).map((plan, index) => (
              <Card
                key={index}
                onClick={handlePurchaseLogin}
                className={`relative transition-all hover:shadow-lg cursor-pointer hover:scale-105 ${
                  plan.popular ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">推荐</Badge>}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                  </div>
                  <CardDescription className="mt-2 text-lg font-medium">{plan.logins}登录次数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button className="w-full" variant="outline">
                    前往购买
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-6">附加产品</h2>
          <div className="max-w-md mx-auto">
            <Card 
              onClick={ handlePurchasePDF}
              className="relative transition-all hover:shadow-lg cursor-pointer hover:scale-105"
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plans[3].name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plans[3].price}</span>
                </div>
                <CardDescription className="mt-2 text-lg font-medium">{plans[3].logins}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{plans[3].description}</p>
                  </div>
                  {plans[3].features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{feature}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="px-6 pb-4">
                <Button className="w-full" variant="outline">
                  前往购买
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 客服联系方式卡片 */}
        <Card className="max-w-2xl mx-auto mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
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
            <div className="flex items-center justify-center gap-3 p-4 bg-background rounded-lg border">
              <span className="text-lg font-mono font-semibold">{qqGroup}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyQQ}
                className="gap-1.5"
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
