import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Users, Copy, Check, Sparkles, Zap, Crown, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Purchase = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyQQ = () => {
    navigator.clipboard.writeText("1034981273");
    setCopied(true);
    toast.success("QQ群号已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  const mainPlans = [
    {
      name: "体验版",
      logins: "5次",
      price: 9,
      description: "为您的个人账号充值5次登录次数",
      popular: false,
      icon: Zap,
      gradient: "from-emerald-400 to-teal-500",
      features: ["数据加密存储", "支持信息任意修改"],
    },
    {
      name: "标准版",
      logins: "50次",
      price: 29,
      description: "为您的个人账号充值50次登录次数",
      popular: true,
      icon: Sparkles,
      gradient: "from-blue-500 to-indigo-600",
      features: ["数据加密存储", "支持信息任意修改"],
    },
    {
      name: "永久版",
      logins: "无限",
      price: 99,
      description: "永久使用，不限制登录次数",
      popular: false,
      icon: Crown,
      gradient: "from-amber-500 to-orange-600",
      features: ["赠送30个PDF下载积分", "数据加密存储", "支持信息任意修改"],
    },
  ];

  const addonPlan = {
    name: "PDF积分包",
    logins: "30个PDF积分",
    price: 30,
    description: "30个PDF下载积分，积分不使用永不过期",
    icon: FileText,
    gradient: "from-violet-500 to-purple-600",
    features: ["制作一份PDF消耗30积分", "积分对三种PDF均可通用"],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/login")} 
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            返回
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">
            选择适合您的套餐
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto">
            购买或续费模拟档案账号，享受便捷的信息管理服务
          </p>
        </div>

        {/* Main Plans */}
        <section className="mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-slate-200" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">主要套餐</h2>
            <div className="h-px w-8 bg-slate-200" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {mainPlans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <div
                  key={index}
                  className={`relative group rounded-2xl bg-white border transition-all duration-300 hover:shadow-xl ${
                    plan.popular 
                      ? "border-primary shadow-lg md:scale-105 md:-translate-y-1" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-white shadow-md px-3 py-1">
                        最受欢迎
                      </Badge>
                    </div>
                  )}
                  
                  {/* Card Header with Gradient */}
                  <div className={`p-5 md:p-6 rounded-t-2xl bg-gradient-to-br ${plan.gradient} text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-white/90 text-sm font-medium">
                        {plan.logins}登录
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold">¥{plan.price}</span>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-5 md:p-6">
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                      {plan.description}
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-slate-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Addon Product */}
        <section className="mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-slate-200" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">附加产品</h2>
            <div className="h-px w-8 bg-slate-200" />
          </div>
          
          <div className="max-w-sm mx-auto">
            <div className="relative rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-slate-300">
              {/* Card Header with Gradient */}
              <div className={`p-5 md:p-6 bg-gradient-to-br ${addonPlan.gradient} text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <addonPlan.icon className="h-5 w-5" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">
                    {addonPlan.logins}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{addonPlan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-bold">¥{addonPlan.price}</span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-5 md:p-6">
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                  {addonPlan.description}
                </p>
                <ul className="space-y-3">
                  {addonPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-slate-200" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">联系客服</h2>
            <div className="h-px w-8 bg-slate-200" />
          </div>
          
          <div className="max-w-sm mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="font-semibold text-slate-900 mb-1">QQ售后群</h3>
              <p className="text-slate-500 text-xs mb-4">版本更新及售后通知</p>
              
              <button
                onClick={handleCopyQQ}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-lg font-bold text-slate-900">1034981273</span>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                )}
              </button>
              
              <div className="mt-4 space-y-1.5">
                <p className="text-xs text-slate-400">
                  售后1群已满，二群建立于2025年11月
                </p>
                <p className="text-xs text-primary font-medium">
                  闲鱼不方便下单？联系群主即可
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Purchase;
