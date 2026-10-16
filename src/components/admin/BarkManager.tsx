import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Bell, BellRing, Loader2, Send, Settings, History, CheckCircle2,
  XCircle, Smartphone, Radio, Volume2, Link2, Image, ChevronLeft,
  ChevronRight, RefreshCw, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as adminApi from "@/lib/adminApi";
import { format } from "date-fns";

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

interface BarkHistoryItem {
  id: string;
  title: string;
  body: string;
  recipient: string;
  group: string | null;
  level: string | null;
  sound: string | null;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

interface BarkManagerProps {
  token: string | null;
}

const SOUND_OPTIONS = [
  { value: 'minuet', label: 'Minuet' },
  { value: 'default', label: 'Default' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'bell', label: 'Bell' },
  { value: 'birdsong', label: 'Birdsong' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'calypso', label: 'Calypso' },
  { value: 'chime', label: 'Chime' },
  { value: 'crystal', label: 'Crystal' },
  { value: 'dulcimer', label: 'Dulcimer' },
  { value: 'fanfare', label: 'Fanfare' },
  { value: 'horn', label: 'Horn' },
  { value: 'ladder', label: 'Ladder' },
  { value: 'mail', label: 'Mail' },
  { value: 'newsflash', label: 'Newsflash' },
  { value: 'piano', label: 'Piano' },
  { value: 'sherwood', label: 'Sherwood' },
  { value: 'silence', label: 'Silence' },
  { value: 'submarine', label: 'Submarine' },
  { value: 'telegraph', label: 'Telegraph' },
  { value: 'tree', label: 'Tree' },
  { value: 'vibrate', label: 'Vibrate' },
];

const LEVEL_OPTIONS = [
  { value: 'active', label: 'Active (默认)' },
  { value: 'critical', label: 'Critical (紧急)' },
  { value: 'timeSensitive', label: 'Time Sensitive (时效性)' },
  { value: 'passive', label: 'Passive (被动)' },
];

const BarkManager = ({ token }: BarkManagerProps) => {
  const [config, setConfig] = useState<BarkConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"test" | "custom" | "history">("test");

  // 测试推送表单
  const [testTitle, setTestTitle] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testGroup, setTestGroup] = useState('测试推送');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // 自定义推送表单
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customLevel, setCustomLevel] = useState('active');
  const [customSound, setCustomSound] = useState('minuet');
  const [customGroup, setCustomGroup] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isSendingCustom, setIsSendingCustom] = useState(false);

  // 推送历史
  const [barkHistory, setBarkHistory] = useState<BarkHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historyKeyword, setHistoryKeyword] = useState('');

  const { toast } = useToast();

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

  const fetchHistory = async (page?: number) => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const data = await adminApi.getBarkHistory(token, {
        page: page || historyPage,
        pageSize: 10,
        status: historyStatus !== 'all' ? historyStatus : undefined,
        keyword: historyKeyword || undefined,
      });
      if (data.success) {
        setBarkHistory(data.history || []);
        setHistoryTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      // silent
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConfig();
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === "history") {
      fetchHistory(1);
    }
  }, [activeTab, historyStatus]);

  const handleSendTest = async () => {
    if (!token || !testTitle.trim() || !testBody.trim()) {
      toast({ variant: "destructive", title: "请填写标题和内容" });
      return;
    }
    setIsSendingTest(true);
    try {
      const data = await adminApi.sendBarkTest(token, {
        title: testTitle,
        body: testBody,
        group: testGroup,
      });
      if (data.success) {
        toast({ title: "测试推送发送成功" });
        setTestTitle('');
        setTestBody('');
      } else {
        toast({ variant: "destructive", title: "推送失败", description: data.error });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "推送失败", description: error.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendCustom = async () => {
    if (!token || !customTitle.trim() || !customBody.trim()) {
      toast({ variant: "destructive", title: "请填写标题和内容" });
      return;
    }
    setIsSendingCustom(true);
    try {
      const data = await adminApi.sendBarkCustom(token, {
        title: customTitle,
        body: customBody,
        level: customLevel,
        sound: customSound,
        group: customGroup || undefined,
        icon: customIcon || undefined,
        url: customUrl || undefined,
      });
      if (data.success) {
        toast({ title: "推送发送成功" });
        setCustomTitle('');
        setCustomBody('');
      } else {
        toast({ variant: "destructive", title: "推送失败", description: data.error });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "推送失败", description: error.message });
    } finally {
      setIsSendingCustom(false);
    }
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
              <CardDescription>管理推送配置、发送测试通知和查看推送历史</CardDescription>
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

        {/* 功能Tab */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="test" className="text-base">
              <Sparkles className="mr-2 h-4 w-4" />
              快速测试
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-base">
              <Send className="mr-2 h-4 w-4" />
              自定义推送
            </TabsTrigger>
            <TabsTrigger value="history" className="text-base">
              <History className="mr-2 h-4 w-4" />
              推送历史
            </TabsTrigger>
          </TabsList>

          {/* 快速测试 */}
          <TabsContent value="test" className="mt-4">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-300">快速测试推送</h3>
              </div>
              <p className="text-sm text-muted-foreground">向所有已配置的设备发送一条测试通知</p>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>推送标题</Label>
                  <Input
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="例如：测试推送"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>推送内容</Label>
                  <Textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder="例如：这是一条来自管理后台的测试通知"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>消息分组</Label>
                  <Input
                    value={testGroup}
                    onChange={(e) => setTestGroup(e.target.value)}
                    placeholder="测试推送"
                  />
                </div>
                <Button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testTitle.trim() || !testBody.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md"
                >
                  {isSendingTest ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 发送中...</>
                  ) : (
                    <><BellRing className="h-4 w-4 mr-2" /> 发送测试推送</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 自定义推送 */}
          <TabsContent value="custom" className="mt-4">
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-lg text-purple-800 dark:text-purple-300">自定义推送</h3>
              </div>
              <p className="text-sm text-muted-foreground">自定义推送参数，向所有设备或指定设备发送通知</p>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>推送标题 *</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="通知标题"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>消息分组</Label>
                    <Input
                      value={customGroup}
                      onChange={(e) => setCustomGroup(e.target.value)}
                      placeholder={config?.group || '自定义推送'}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>推送内容 *</Label>
                  <Textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="通知正文内容"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>推送级别</Label>
                    <Select value={customLevel} onValueChange={setCustomLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>通知铃声</Label>
                    <Select value={customSound} onValueChange={setCustomSound}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOUND_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" /> 图标 URL (可选)
                    </Label>
                    <Input
                      value={customIcon}
                      onChange={(e) => setCustomIcon(e.target.value)}
                      placeholder="https://example.com/icon.png"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" /> 跳转 URL (可选)
                    </Label>
                    <Input
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendCustom}
                  disabled={isSendingCustom || !customTitle.trim() || !customBody.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md"
                >
                  {isSendingCustom ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 发送中...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> 发送自定义推送</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 推送历史 */}
          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              {/* 筛选 */}
              <div className="flex flex-wrap gap-3 items-center">
                <Select value={historyStatus} onValueChange={(v) => { setHistoryStatus(v); setHistoryPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[200px]">
                  <Input
                    value={historyKeyword}
                    onChange={(e) => setHistoryKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setHistoryPage(1); fetchHistory(1); } }}
                    placeholder="搜索标题或内容..."
                    className="pl-3"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchHistory(1)}>
                  <RefreshCw className="h-4 w-4 mr-1" /> 刷新
                </Button>
              </div>

              {/* 历史列表 */}
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-muted-foreground">正在加载推送历史...</p>
                </div>
              ) : barkHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 rounded-xl bg-muted/30">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>暂无推送记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {barkHistory.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md animate-scale-in ${
                        item.status === 'success'
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50'
                          : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200/50 dark:border-red-800/50'
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {item.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                            )}
                            <span className="font-semibold text-sm truncate">{item.title}</span>
                            {item.metadata?.type === 'test' && (
                              <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">测试</Badge>
                            )}
                            {item.metadata?.type === 'custom' && (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">自定义</Badge>
                            )}
                            {item.group && (
                              <Badge variant="outline" className="text-[10px]">{item.group}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.body}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>接收: {item.recipient?.substring(0, 12)}...</span>
                            {item.level && (
                              <Badge className={`text-[10px] ${getLevelBadgeColor(item.level)}`}>{item.level}</Badge>
                            )}
                            {item.sound && <span>铃声: {item.sound}</span>}
                            <span>{format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss')}</span>
                          </div>
                          {item.error_message && (
                            <p className="text-xs text-red-500 mt-1">错误: {item.error_message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-xs text-muted-foreground">第 {historyPage} / {historyTotalPages} 页</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { setHistoryPage(p => Math.max(1, p - 1)); fetchHistory(historyPage - 1); }}
                      disabled={historyPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> 上一页
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { setHistoryPage(p => Math.min(historyTotalPages, p + 1)); fetchHistory(historyPage + 1); }}
                      disabled={historyPage === historyTotalPages}
                    >
                      下一页 <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BarkManager;
