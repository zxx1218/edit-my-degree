import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  BellRing, Loader2, RefreshCw, CheckCircle2,
  XCircle, Smartphone, Radio, Volume2, Link2,
  Settings, Save, Calendar,
} from "lucide-react";
import * as adminApi from "@/lib/adminApi";

interface BarkConfig {
  enabled: boolean;
  pushUrl: string;
  deviceKeys: string[];
  deviceKeysCount: number;
  level: string;
  sound: string;
  group: string;
  icon: string;
  url: string;
  dailyReportEnabled: boolean;
}

interface BarkManagerProps {
  token: string | null;
}

const BarkManager = ({ token }: BarkManagerProps) => {
  const [config, setConfig] = useState<BarkConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 编辑表单状态
  const [editEnabled, setEditEnabled] = useState(false);
  const [editSound, setEditSound] = useState('');
  const [editDailyReport, setEditDailyReport] = useState(false);
  
  const { toast } = useToast();

  const fetchConfig = async () => {
    if (!token) return;
    setIsLoadingConfig(true);
    try {
      const data = await adminApi.getBarkConfig(token);
      if (data.success) {
        setConfig(data.config);
        // 同步到编辑表单
        setEditEnabled(data.config.enabled);
        setEditSound(data.config.sound);
        setEditDailyReport(data.config.dailyReportEnabled);
      }
    } catch (error) {
      // silent
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const data = await adminApi.updateBarkConfig(token, {
        barkEnabled: editEnabled,
        barkSound: editSound,
        dailyReportEnabled: editDailyReport,
      });
      
      if (data.success) {
        toast({
          title: "保存成功",
          description: "配置已更新并生效",
        });
        setIsEditing(false);
        fetchConfig();
      } else {
        throw new Error(data.error || "保存失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (config) {
      setEditEnabled(config.enabled);
      setEditSound(config.sound);
      setEditDailyReport(config.dailyReportEnabled);
    }
    setIsEditing(false);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'timeSensitive': return 'bg-orange-500 text-white';
      case 'passive': return 'bg-gray-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md">
              <BellRing className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Bark 推送管理</CardTitle>
              <CardDescription>配置推送开关、铃声和定时任务</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                  取消
                </Button>
                <Button onClick={handleSave} size="sm" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  保存配置
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  编辑配置
                </Button>
                <Button onClick={fetchConfig} variant="outline" size="sm" disabled={isLoadingConfig}>
                  {isLoadingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">刷新</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 配置概览 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">推送状态</span>
            </div>
            <div className="flex items-center gap-2">
              {(isEditing ? editEnabled : config?.enabled) ? (
                <Badge className="bg-green-500 text-white border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> 已启用
                </Badge>
              ) : (
                <Badge className="bg-gray-500 text-white border-0">
                  <XCircle className="h-3 w-3 mr-1" /> 未启用
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">设备数量</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {config?.deviceKeysCount || 0}
            </div>
            <div className="text-xs text-purple-500 dark:text-purple-400 mt-1 truncate">
              {config?.deviceKeys?.map((k, i) => (
                <span key={i}>{i > 0 && ', '}{k}</span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">铃声 / 级别</span>
            </div>
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {isEditing ? editSound : (config?.sound || 'minuet')}
            </div>
            <div className="mt-1">
              <Badge className={`text-[10px] ${getLevelBadgeColor(config?.level || 'active')}`}>
                {config?.level || 'active'}
              </Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">每日报告</span>
            </div>
            <div className="flex items-center gap-2">
              {(isEditing ? editDailyReport : config?.dailyReportEnabled) ? (
                <Badge className="bg-green-500 text-white border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> 已开启
                </Badge>
              ) : (
                <Badge className="bg-gray-500 text-white border-0">
                  <XCircle className="h-3 w-3 mr-1" /> 已关闭
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* 编辑区域 */}
        {isEditing && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              配置编辑
            </h4>
            
            <div className="space-y-4">
              {/* Bark 推送开关 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bark-enabled" className="text-sm font-medium">
                    Bark 推送开关
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    控制是否发送 Bark 通知（充值通知等）
                  </p>
                </div>
                <Switch
                  id="bark-enabled"
                  checked={editEnabled}
                  onCheckedChange={setEditEnabled}
                />
              </div>

              <Separator />

              {/* 推送铃声 */}
              <div className="space-y-2">
                <Label htmlFor="bark-sound" className="text-sm font-medium">
                  推送铃声
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  设置通知铃声名称（如：paymentsuccess, minuet, piano 等）
                </p>
                <Input
                  id="bark-sound"
                  value={editSound}
                  onChange={(e) => setEditSound(e.target.value)}
                  placeholder="paymentsuccess"
                  className="max-w-xs"
                />
              </div>

              <Separator />

              {/* 每日收入报告开关 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-report" className="text-sm font-medium">
                    每日收入统计推送
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    每天 0 点自动推送前一天的收入统计
                  </p>
                </div>
                <Switch
                  id="daily-report"
                  checked={editDailyReport}
                  onCheckedChange={setEditDailyReport}
                />
              </div>
            </div>
          </div>
        )}

        {/* 推送服务信息 */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">推送服务</span>
          </div>
          <div className="text-xs font-mono text-green-700 dark:text-green-300 truncate">
            {config?.pushUrl || 'N/A'}
          </div>
          <div className="text-xs text-green-500 dark:text-green-400 mt-1 truncate">
            分组: {config?.group || 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarkManager;
