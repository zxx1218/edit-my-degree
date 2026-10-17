import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BellRing, Loader2, RefreshCw, CheckCircle2,
  XCircle, Smartphone, Radio, Volume2, Link2,
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
}

interface BarkManagerProps {
  token: string | null;
}

const BarkManager = ({ token }: BarkManagerProps) => {
  const [config, setConfig] = useState<BarkConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const fetchConfig = async () => {
    if (!token) return;
    setIsLoadingConfig(true);
    try {
      const data = await adminApi.getBarkConfig(token);
      if (data.success) {
        setConfig(data.config);
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
              <CardDescription>查看推送配置概览</CardDescription>
            </div>
          </div>
          <Button onClick={fetchConfig} variant="outline" size="sm" disabled={isLoadingConfig}>
            {isLoadingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">刷新配置</span>
          </Button>
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
              {config?.enabled ? (
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
              {config?.sound || 'minuet'}
            </div>
            <div className="mt-1">
              <Badge className={`text-[10px] ${getLevelBadgeColor(config?.level || 'active')}`}>
                {config?.level || 'active'}
              </Badge>
            </div>
          </div>

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
        </div>

        <Separator />
      </CardContent>
    </Card>
  );
};

export default BarkManager;
