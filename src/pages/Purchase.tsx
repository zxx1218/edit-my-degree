import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import xianyuImage from "@/assets/xianyu.png";

const Purchase = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "体验版",
      logins: "5次",
      price: "¥9",
      description: "获得一个可以登陆5次的个人账号",
      popular: false,
    },
    {
      name: "标准版",
      logins: "50次",
      price: "¥29",
      description: "获得一个可以登陆50次的个人账号",
      popular: true,
    },
    {
      name: "永久版",
      logins: "永久",
      price: "¥99",
      description: "永久使用，不限制登录次数",
      popular: false,
    },
  ];

  const handlePurchase = () => {
    window.open("https://m.tb.cn/h.Sn7Xrtk?tk=jTiAffAGIsg", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回登录
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">选择您的套餐</h1>
          <p className="text-muted-foreground text-lg">
            购买或续费学信档案账号，享受便捷的学历信息管理服务
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative transition-all hover:shadow-lg ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  推荐
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                </div>
                <CardDescription className="mt-2 text-lg font-medium">
                  {plan.logins}登录次数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      数据加密存储
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      支持学历信息修改
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">如何购买？</CardTitle>
            <CardDescription>通过闲鱼平台安全购买</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <img
                src={xianyuImage}
                alt="闲鱼购买"
                className="max-w-sm h-auto rounded-lg shadow-md"
              />
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground">①</span>
                <span>在登录页注册一个个人账号</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground">②</span>
                <span>点击下方"前往购买"按钮跳转到闲鱼商品页面</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground">③</span>
                <span>在闲鱼APP中选择您需要的套餐并完成支付</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground">④</span>
                <span>支付成功后，将您注册的账号发给卖家</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-foreground">⑤</span>
                <span>卖家点击发货即代表开通成功</span>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              className="w-full h-12 text-lg"
              size="lg"
            >
              前往购买
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Purchase;
