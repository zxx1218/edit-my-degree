import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BellRing, Loader2, RefreshCw, CheckCircle2,
  XCircle, Smartphone, Radio, Volume2, Link2,
  Settings, Save, Calendar, Image, MousePointerClick,
  Layers, Shield,
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

const BARK_SOUNDS = [
  { value: 'paymentsuccess', label: 'Payment Success' },
  { value: 'minuet', label: 'Minuet' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'anticipate', label: 'Anticipate' },
  { value: 'bell', label: 'Bell' },
  { value: 'birdsong', label: 'Birdsong' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'calypso', label: 'Calypso' },
  { value: 'chime', label: 'Chime' },
  { value: 'choo', label: 'Choo' },
  { value: 'descent', label: 'Descent' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'fanfare', label: 'Fanfare' },
  { value: 'glass', label: 'Glass' },
  { value: 'gotosleep', label: 'Go to Sleep' },
  { value: 'healthnotification', label: 'Health Notification' },
  { value: 'horn', label: 'Horn' },
  { value: 'ladder', label: 'Ladder' },
  { value: 'mailsent', label: 'Mail Sent' },
  { value: 'multiwayinvitation', label: 'Multiway Invitation' },
  { value: 'newmail', label: 'New Mail' },
  { value: 'newsflash', label: 'News Flash' },
  { value: 'noir', label: 'Noir' },
  { value: 'shake', label: 'Shake' },
  { value: 'sherwoodforest', label: 'Sherwood Forest' },
  { value: 'silence', label: 'Silence (无声)' },
  { value: 'spell', label: 'Spell' },
  { value: 'suspense', label: 'Suspense' },
  { value: 'telegraph', label: 'Telegraph' },
  { value: 'tiptoes', label: 'Tiptoes' },
  { value: 'typewriters', label: 'Typewriters' },
  { value: 'update', label: 'Update' },
];

const BARK_LEVELS = [
  { value: 'active', label: 'Active (默认)', desc: '立即亮屏显示通知' },
  { value: 'timeSensitive', label: 'Time Sensitive (时效性)', desc: '专注模式下仍可显示' },
  { value: 'passive', label: 'Passive (被动)', desc: '静默加入通知列表，不亮屏' },
  { value: 'critical', label: 'Critical (紧急)', desc: '忽略静音与勿扰，强制响铃' },
];

const BarkManager = ({ token }: BarkManagerProps) => {
  const [config, setConfig] = useState<BarkConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 编辑表单状态
  const [editEnabled, setEditEnabled] = useState(false);
  const [editSound, setEditSound] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDailyReport, setEditDailyReport] = useState(false);
  
  const { toast } = useToast();

  const fetchConfig = async () => {
    if (!token) return;
    setIsLoadingConfig(true);
    try {
      const data = await adminApi.getBarkConfig(token);
      if (data.success) {
        setConfig(data.config);
        syncEditForm(data.config);
      }
    } catch (error) {
      // silent
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const syncEditForm = (c: BarkConfig) => {
    setEditEnabled(c.enabled);
    setEditSound(c.sound || 'paymentsuccess');
    setEditLevel(c.level || 'active');
    setEditGroup(c.group || '');
    setEditIcon(c.icon || '');
    setEditUrl(c.url || '');
    setEditDailyReport(c.dailyReportEnabled);
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
        barkLevel: editLevel,
        barkGroup: editGroup,
        barkIcon: editIcon,
        barkUrl: editUrl,
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
      syncEditForm(config);
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

  const getLevelLabel = (level: string) => {
    const found = BARK_LEVELS.find(l => l.value === level);
    return found ? found.label : level;
  };

  const getSoundLabel = (sound: string) => {
    const found = BARK_SOUNDS.find(s => s.value === sound);
    return found ? found.label : sound;
  };

  const currentSound = isEditing ? editSound : (config?.sound || 'paymentsuccess');
  const currentLevel = isEditing ? editLevel : (config?.level || 'active');
  const currentGroup = isEditing ? editGroup : (config?.group || '');
  const currentIcon = isEditing ? editIcon : (config?.icon || '');
  const currentUrl = isEditing ? editUrl : (config?.url || '');

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
              <CardDescription>配置推送参数、铃声、级别和通知行为</CardDescription>
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
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">铃声</span>
            </div>
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-300 truncate">
              {getSoundLabel(currentSound)}
            </div>
            <div className="mt-1">
              <Badge className={`text-[10px] ${getLevelBadgeColor(currentLevel)}`}>
                {currentLevel}
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
          <div className="space-y-5 p-5 rounded-xl bg-muted/30 border">
            <h4 className="font-semibold flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              配置编辑
            </h4>
            
            <div className="space-y-5">
              {/* Bark 推送开关 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bark-enabled" className="text-sm font-medium">
                    Bark 推送开关
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    控制是否发送 Bark 通知（充值通知、安全告警等）
                  </p>
                </div>
                <Switch
                  id="bark-enabled"
                  checked={editEnabled}
                  onCheckedChange={setEditEnabled}
                />
              </div>

              <Separator />

              {/* 推送铃声 - 下拉框 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-amber-600" />
                  推送铃声
                </Label>
                <p className="text-xs text-muted-foreground">
                  选择 Bark 内置铃声，共 {BARK_SOUNDS.length} 种可选
                </p>
                <Select value={editSound} onValueChange={setEditSound}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="选择铃声..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BARK_SOUNDS.map((sound) => (
                      <SelectItem key={sound.value} value={sound.value}>
                        {sound.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 通知级别 - 下拉框 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  通知级别
                </Label>
                <p className="text-xs text-muted-foreground">
                  控制通知的展示方式和优先级
                </p>
                <Select value={editLevel} onValueChange={setEditLevel}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="选择级别..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BARK_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex flex-col">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">{level.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 通知分组 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-600" />
                  通知分组
                </Label>
                <p className="text-xs text-muted-foreground">
                  相同分组的通知会归类显示在一起
                </p>
                <Input
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                  placeholder="学位管理系统充值通知"
                  className="max-w-xs"
                />
              </div>

              <Separator />

              {/* 通知图标 URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Image className="h-4 w-4 text-pink-600" />
                  通知图标 URL
                </Label>
                <p className="text-xs text-muted-foreground">
                  自定义通知显示的图标（iOS 15+，留空使用默认）
                </p>
                <Input
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="https://example.com/icon.png"
                  className="max-w-md"
                />
              </div>

              <Separator />

              {/* 点击跳转 URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-green-600" />
                  点击跳转 URL
                </Label>
                <p className="text-xs text-muted-foreground">
                  用户点击通知后跳转的链接（留空则不跳转）
                </p>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="max-w-md"
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

        {/* 非编辑模式下的详细配置展示 */}
        {!isEditing && config && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Settings className="h-4 w-4" />
              当前配置详情
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border flex items-center gap-3">
                <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">通知级别</div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Badge className={`text-[10px] ${getLevelBadgeColor(config.level)}`}>
                      {config.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getLevelLabel(config.level)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30 border flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">铃声</div>
                  <div className="text-sm font-medium truncate">{getSoundLabel(config.sound)}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border flex items-center gap-3">
                <Layers className="h-4 w-4 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">分组</div>
                  <div className="text-sm font-medium truncate">{config.group || '未设置'}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border flex items-center gap-3">
                <Image className="h-4 w-4 text-pink-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">图标</div>
                  <div className="text-sm font-medium truncate">{config.icon || '默认'}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border flex items-center gap-3 sm:col-span-2">
                <MousePointerClick className="h-4 w-4 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">点击跳转</div>
                  <div className="text-sm font-medium truncate">{config.url || '未设置'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* 推送服务信息 */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">推送服务</span>
          </div>
          <div className="text-xs font-mono text-green-700 dark:text-green-300 truncate">
            {config?.pushUrl || 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarkManager;
