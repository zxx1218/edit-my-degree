import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Check, CheckCircle2, ExternalLink, MessageSquare, HelpCircle, Users, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const faqItems = [
  {
    question: "如何购买套餐？",
    answer: "目前支持通过闲鱼或者微信支付宝购买，搜索相关商品下单后您会得到充值卡密。如闲鱼不方便，可通过QQ群联系我们使用微信/支付宝付款。"
  },
  {
    question: "登录次数是什么意思？",
    answer: "每次登录系统会消耗1次登录次数。次数用完后需要续费才能继续使用。永久版不限制登录次数。"
  },
  {
    question: "PDF积分是什么？",
    answer: "PDF积分用于生成三种报告的PDF文件。每制作一份PDF需要消耗30个PDF积分（积分不使用永不过期）。"
  },
  {
    question: "数据安全吗？",
    answer: "所有数据均采用加密存储，仅您本人可见。"
  },
  {
    question: "忘记密码怎么办？",
    answer: "由于所有数据均加密存储，所以请牢记您注册的账号和密码，一旦丢失无法找回。"
  },
  {
    question: "可以退款吗？",
    answer: "虚拟商品一经售出概不退款，请在购买前确认您的需求。如有疑问可先咨询后再购买。"
  }
];

const Purchase = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyQQ = async () => {
    try {
      await navigator.clipboard.writeText('1034981273');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "QQ号已复制",
        description: "您可以粘贴到QQ中联系客服",
      });
    } catch (err) {
      console.error('Failed to copy QQ number: ', err);
      toast({
        title: "复制失败",
        description: "请手动复制QQ号：1034981273",
        variant: "destructive"
      });
    }
  };

  const plans = [
    {
      name: "体验版",
      logins: "5次",
      price: "¥9",
      description: "为您的个人账号充值5次登录次数",
      popular: false,
      features: ["数据加密存储", "支持内容任意修改"],
    },
    {
      name: "标准版",
      logins: "50次",
      price: "¥29",
      description: "为您的个人账号充值50次登录次数",
      popular: true,
      features: ["数据加密存储", "支持内容任意修改"],
    },
    {
      name: "永久版",
      logins: "无限",
      price: "¥99",
      description: "永久使用，不限制登录次数",
      popular: false,
      features: ["赠送30个PDF下载积分", "数据加密存储", "支持内容任意修改"],
    },
    {
      name: "PDF积分包",
      logins: "30个PDF积分",
      price: "¥30",
      description: "30个PDF下载积分，积分不使用永不过期",
      popular: true,
      features: ["制作一份PDF都需消耗30积分", "积分对三种PDF均可通用"],
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
                className={`relative transition-all hover:shadow-lg ${
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
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-6">附加产品</h2>
          <div className="max-w-md mx-auto">
            <Card className="relative transition-all hover:shadow-lg">
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
            </Card>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                常见问题
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                意见反馈
              </CardTitle>
              <CardDescription>问题、建议或Bug反馈</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  您的每一条留言都会有专人查看和处理
                </p>
                <Button
                  onClick={() => window.open("http://cheerout.cn:40000", "_blank")}
                  className="w-full"
                >
                  前往留言板
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-2xl mx-auto mt-6 md:col-span-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">客服联系方式</CardTitle>
              <CardDescription>如遇问题或需要微信/支付宝下单，请联系我们</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md mx-auto">
                <div className="flex flex-col items-center p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <Users className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">版本更新及售后通知QQ群</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-2xl font-bold text-primary">1034981273</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyQQ}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    售后1群已满，二群建立于2026年2月
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    闲鱼不方便下单的客户，联系群主即可
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
