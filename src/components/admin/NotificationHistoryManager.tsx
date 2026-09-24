import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Bell, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  AlertTriangle,
  Clock,
  Smartphone,
  Mail,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as adminApi from "@/lib/adminApi";
import { format } from "date-fns";

interface NotificationItem {
  id: string;
  channel: 'bark' | 'email';
  title: string;
  body: string;
  recipient: string | null;
  group: string | null;
  level: string | null;
  sound: string | null;
  status: 'success' | 'failed';
  errorMessage: string | null;
  metadata: any;
  createdAt: string;
}

interface NotificationHistoryManagerProps {
  token: string | null;
}

const ITEMS_PER_PAGE = 20;

const NotificationHistoryManager = ({ token }: NotificationHistoryManagerProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [channelFilter, setChannelFilter] = useState<'all' | 'bark' | 'email'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  // 获取通知历史列表
  const fetchNotifications = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await adminApi.getNotificationHistory(token, {
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        channel: channelFilter,
        status: statusFilter,
        searchQuery: searchQuery
      });
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error || "获取通知历史失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 当筛选条件或页码变化时重新获取数据
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token, currentPage, channelFilter, statusFilter]);

  // 搜索处理（带防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        setCurrentPage(1); // 搜索时重置到第一页
        fetchNotifications();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 打开详情对话框
  const handleViewDetail = (item: NotificationItem) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  // 删除单条记录
  const handleDelete = async (item: NotificationItem) => {
    if (!token) return;

    try {
      const data = await adminApi.deleteNotificationHistory(token, item.id);

      if (data.success) {
        toast({
          title: "删除成功",
          description: "已删除该通知记录",
        });
        fetchNotifications();
      } else {
        throw new Error(data.error || "删除失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message,
      });
    }
  };


  // 格式化时间
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  // 获取渠道图标
  const getChannelIcon = (channel: string) => {
    return channel === 'bark' ? (
      <Smartphone className="h-4 w-4 text-blue-500" />
    ) : (
      <Mail className="h-4 w-4 text-purple-500" />
    );
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <Badge className="bg-green-500 hover:bg-green-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        成功
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        失败
      </Badge>
    );
  };

  // 脱敏显示接收者
  const maskRecipient = (recipient: string | null) => {
    if (!recipient) return '未知';
    
    // Bark设备密钥脱敏
    if (recipient.includes(',')) {
      const keys = recipient.split(',').map(key => {
        const trimmed = key.trim();
        if (trimmed.length > 8) {
          return trimmed.substring(0, 8) + '...';
        }
        return trimmed;
      });
      return keys.join(', ');
    }
    
    // 邮箱脱敏
    if (recipient.includes('@')) {
      const [username, domain] = recipient.split('@');
      const maskedUsername = username.length > 3 
        ? username.substring(0, 3) + '***' 
        : '***';
      return `${maskedUsername}@${domain}`;
    }
    
    return recipient;
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5 text-indigo-600" />
              通知历史
            </CardTitle>
            <CardDescription>查看Bark和邮件通知发送记录</CardDescription>
          </div>
          <Button
            onClick={fetchNotifications}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <Clock className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">刷新</span>
            <span className="sm:hidden">刷新</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 筛选器 */}
        <div className="space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="搜索标题、内容或接收者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              <Button
                variant={channelFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannelFilter('all')}
                className="text-xs"
              >
                全部渠道
              </Button>
              <Button
                variant={channelFilter === 'bark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannelFilter('bark')}
                className="text-xs"
              >
                <Smartphone className="h-3 w-3 mr-1" />
                Bark
              </Button>
              <Button
                variant={channelFilter === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannelFilter('email')}
                className="text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                邮件
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="text-xs"
              >
                全部状态
              </Button>
              <Button
                variant={statusFilter === 'success' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('success')}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                成功
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('failed')}
                className="text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                失败
              </Button>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-3 text-sm text-muted-foreground">
          共 {total} 条记录，第 {currentPage}/{totalPages} 页
        </div>

        {/* 通知列表 */}
        <div className="max-h-[600px] overflow-auto rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">暂无通知记录</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm hidden lg:table-cell">渠道</th>
                  <th className="text-left p-3 font-medium text-sm">标题</th>
                  <th className="text-left p-3 font-medium text-sm hidden md:table-cell">接收者</th>
                  <th className="text-left p-3 font-medium text-sm hidden sm:table-cell">状态</th>
                  <th className="text-left p-3 font-medium text-sm hidden lg:table-cell">时间</th>
                  <th className="text-right p-3 font-medium text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(item.channel)}
                        <span className="text-sm capitalize">{item.channel}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="lg:hidden">{getChannelIcon(item.channel)}</span>
                          <p className="font-medium text-sm truncate max-w-[200px] lg:max-w-none" title={item.title}>
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2" title={item.body}>
                          {item.body}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm" title={item.recipient || undefined}>
                        {maskRecipient(item.recipient)}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(item.createdAt)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="grid grid-cols-2 gap-1 sm:flex sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(item)}
                          className="h-7 px-2"
                        >
                          <Eye className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">详情</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">删除</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        {!isLoading && notifications.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              显示 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, total)} / {total}
            </div>
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">上一页</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="flex-1 sm:flex-none"
              >
                <span className="mr-1 hidden sm:inline">下一页</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && getChannelIcon(selectedItem.channel)}
              通知详情
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">渠道</label>
                <div className="flex items-center gap-2 mt-1">
                  {getChannelIcon(selectedItem.channel)}
                  <span className="capitalize">{selectedItem.channel}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">标题</label>
                <p className="mt-1 text-sm">{selectedItem.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">正文</label>
                <p className="mt-1 text-sm whitespace-pre-wrap break-all">{selectedItem.body}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">接收者</label>
                <p className="mt-1 text-sm" title={selectedItem.recipient || undefined}>
                  {selectedItem.recipient || '未知'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">发送时间</label>
                  <p className="mt-1 text-sm">{formatTime(selectedItem.createdAt)}</p>
                </div>
              </div>
              
              {selectedItem.group && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">消息分组</label>
                  <p className="mt-1 text-sm">{selectedItem.group}</p>
                </div>
              )}
              
              {selectedItem.level && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">推送级别</label>
                  <p className="mt-1 text-sm">{selectedItem.level}</p>
                </div>
              )}
              
              {selectedItem.sound && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">铃声</label>
                  <p className="mt-1 text-sm">{selectedItem.sound}</p>
                </div>
              )}
              
              {selectedItem.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">错误信息</label>
                  <p className="mt-1 text-sm text-destructive whitespace-pre-wrap break-all">
                    {selectedItem.errorMessage}
                  </p>
                </div>
              )}
              
              {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">元数据</label>
                  <pre className="mt-1 text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selectedItem.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NotificationHistoryManager;
