import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Shield, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Clock,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as adminApi from "@/lib/adminApi";
import { format } from "date-fns";

interface BlacklistItem {
  id: string;
  ipAddress: string;
  reason: string;
  blockedUntil: string;
  createdAt: string;
  hoursRemaining: number;
}

interface IpBlacklistManagerProps {
  token: string | null;
}

const ITEMS_PER_PAGE = 5;

const IpBlacklistManager = ({ token }: IpBlacklistManagerProps) => {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BlacklistItem | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editBlockedUntil, setEditBlockedUntil] = useState("");
  const [addIpAddress, setAddIpAddress] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addBlockedUntil, setAddBlockedUntil] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { toast } = useToast();

  // 获取黑名单列表
  const fetchBlacklist = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await adminApi.getIpBlacklist(token);
      if (data.success) {
        setBlacklist(data.blacklist || []);
      } else {
        throw new Error(data.error || "获取黑名单列表失败");
      }
    } catch (error: any) {
      console.error("获取黑名单列表时出错:", error);
      toast({
        variant: "destructive",
        title: "获取失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 当token变化时获取数据
  useEffect(() => {
    if (token) {
      fetchBlacklist();
    }
  }, [token]);

  // 过滤和分页
  const filteredBlacklist = blacklist.filter(item => 
    item.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBlacklist.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredBlacklist.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 打开编辑对话框
  const handleEditClick = (item: BlacklistItem) => {
    setSelectedItem(item);
    setEditReason(item.reason);
    // 将ISO日期转换为datetime-local格式
    const date = new Date(item.blockedUntil);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setEditBlockedUntil(`${year}-${month}-${day}T${hours}:${minutes}`);
    setIsEditDialogOpen(true);
  };

  // 打开删除确认对话框框
  const handleDeleteClick = (item: BlacklistItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  // 更新黑名单记录
  const handleUpdate = async () => {
    if (!token || !selectedItem) return;

    if (!editReason.trim()) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "封禁原因不能为空",
      });
      return;
    }

    if (!editBlockedUntil) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "封禁截止时间不能为空",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const data = await adminApi.updateIpBlacklist(token, {
        id: selectedItem.id,
        reason: editReason,
        blockedUntil: new Date(editBlockedUntil).toISOString(),
      });

      if (data.success) {
        toast({
          title: "更新成功",
          description: `已更新IP ${selectedItem.ipAddress} 的黑名单记录`,
        });
        setIsEditDialogOpen(false);
        fetchBlacklist();
      } else {
        throw new Error(data.error || "更新失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 删除黑名单记录
  const handleDelete = async () => {
    if (!token || !selectedItem) return;

    setIsDeleting(true);
    try {
      const data = await adminApi.deleteIpBlacklist(token, selectedItem.id);

      if (data.success) {
        toast({
          title: "删除成功",
          description: `已删除IP ${selectedItem.ipAddress} 的黑名单记录`,
        });
        setIsDeleteDialogOpen(false);
        fetchBlacklist();
      } else {
        throw new Error(data.error || "删除失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 打开新增对话框
  const handleAddClick = () => {
    setAddIpAddress("");
    setAddReason("");
    // 默认封禁7天
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    const hours = String(defaultDate.getHours()).padStart(2, '0');
    const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
    setAddBlockedUntil(`${year}-${month}-${day}T${hours}:${minutes}`);
    setIsAddDialogOpen(true);
  };

  // 新增黑名单记录
  const handleAdd = async () => {
    if (!token) return;

    if (!addIpAddress.trim()) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "IP地址不能为空",
      });
      return;
    }

    if (!addReason.trim()) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "封禁原因不能为空",
      });
      return;
    }

    if (!addBlockedUntil) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "封禁截止时间不能为空",
      });
      return;
    }

    setIsAdding(true);
    try {
      const data = await adminApi.addIpBlacklist(token, {
        ipAddress: addIpAddress.trim(),
        reason: addReason.trim(),
        blockedUntil: new Date(addBlockedUntil).toISOString(),
      });

      if (data.success) {
        toast({
          title: "添加成功",
          description: `已将IP ${addIpAddress} 加入黑名单`,
        });
        setIsAddDialogOpen(false);
        fetchBlacklist();
      } else {
        throw new Error(data.error || "添加失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "添加失败",
        description: error.message,
      });
    } finally {
      setIsAdding(false);
    }
  };

  // 格式化剩余时间
  const formatRemainingTime = (hours: number) => {
    if (hours < 1) {
      return "即将过期";
    }
    if (hours < 24) {
      return `${hours}小时`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days}天`;
    }
    const months = Math.floor(days / 30);
    return `${months}个月`;
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl">IP黑名单管理</CardTitle>
              <CardDescription>查看和管理被封禁的IP地址</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={handleAddClick} variant="default" size="sm" className="bg-red-600 hover:bg-red-700 border-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">新增黑名单</span>
              <span className="sm:hidden">新增</span>
            </Button>
            <Button onClick={fetchBlacklist} variant="outline" size="sm" className="border-2 flex-1 sm:flex-none" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              ) : (
                <Search className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">刷新列表</span>
              <span className="sm:hidden">刷新</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索IP地址或封禁原因..."
            className="pl-10 h-10"
          />
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{blacklist.length}</div>
            <div className="text-xs text-muted-foreground">总数</div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {blacklist.filter(item => item.hoursRemaining < 24).length}
            </div>
            <div className="text-xs text-muted-foreground">24小时内过期</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center col-span-2 md:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {blacklist.filter(item => item.hoursRemaining >= 720).length}
            </div>
            <div className="text-xs text-muted-foreground">长期封禁</div>
          </div>
        </div>

        {/* 黑名单列表 */}
        {isLoading ? (
          <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在加载黑名单列表...</p>
            </div>
          </div>
        ) : paginatedItems.length > 0 ? (
          <div className="border-2 rounded-lg p-3 max-h-[500px] overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
            <div className="space-y-2">
              {paginatedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border-2 hover:shadow-md transition-all bg-gradient-to-r from-background to-muted/20 border-border/50 hover:border-red-300 dark:hover:border-red-700 animate-scale-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* IP信息和详情 */}
                  <div className="flex-1 min-w-0 space-y-2 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400 break-all">
                        {item.ipAddress}
                      </span>
                      <Badge
                        variant={item.hoursRemaining < 24 ? "destructive" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {formatRemainingTime(item.hoursRemaining)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="line-clamp-2">
                        <span className="font-medium">原因:</span> {item.reason}
                      </p>
                      <p className="hidden sm:block">
                        <span className="font-medium">封禁至:</span>{" "}
                        {format(new Date(item.blockedUntil), "yyyy-MM-dd HH:mm:ss")}
                      </p>
                      <p className="hidden sm:block">
                        <span className="font-medium">创建于:</span>{" "}
                        {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      </p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(item)}
                      className="flex-1 sm:flex-none border-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 px-2 sm:px-3"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">编辑</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      className="flex-1 sm:flex-none border-2 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 px-2 sm:px-3"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">删除</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  第 {currentPage} / {totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">上一页</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="hidden sm:inline mr-1">下一页</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 rounded-lg">
            {searchQuery ? "未找到匹配的黑名单记录" : "暂无黑名单数据"}
          </div>
        )}
      </CardContent>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              编辑黑名单记录
            </DialogTitle>
            <DialogDescription>
              修改IP {selectedItem?.ipAddress} 的封禁信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-reason">封禁原因</Label>
              <Input
                id="edit-reason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="请输入封禁原因"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blocked-until">封禁截止时间</Label>
              <Input
                id="edit-blocked-until"
                type="datetime-local"
                value={editBlockedUntil}
                onChange={(e) => setEditBlockedUntil(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                当前剩余时间: {selectedItem && formatRemainingTime(selectedItem.hoursRemaining)}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除IP {selectedItem?.ipAddress} 的黑名单记录，该IP将可以重新访问系统。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  确认删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-600" />
              新增IP黑名单
            </DialogTitle>
            <DialogDescription>
              添加新的IP地址到黑名单中
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-ip-address">IP地址</Label>
              <Input
                id="add-ip-address"
                value={addIpAddress}
                onChange={(e) => setAddIpAddress(e.target.value)}
                placeholder="例如: 192.168.1.100"
              />
              <p className="text-xs text-muted-foreground">
                支持IPv4和IPv6格式
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-reason">封禁原因</Label>
              <Input
                id="add-reason"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                placeholder="请输入封禁原因"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-blocked-until">封禁截止时间</Label>
              <Input
                id="add-blocked-until"
                type="datetime-local"
                value={addBlockedUntil}
                onChange={(e) => setAddBlockedUntil(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                默认为7天后，可根据需要调整
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isAdding}
            >
              取消
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isAdding}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  确认添加
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default IpBlacklistManager;
