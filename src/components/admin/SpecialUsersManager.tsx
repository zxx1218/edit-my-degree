import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Tag,
  Coins,
  KeyRound,
  Trash2,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as adminApi from "@/lib/adminApi";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  username: string;
  password: string;
  remaining_logins: number;
  pdf_limit: number;
  tags: string[];
  created_at?: string;
}

interface SpecialUsersManagerProps {
  token: string | null;
  onImpersonateLogin?: (username: string) => Promise<void>;
  onUpdateTags?: (username: string, tags: string[]) => Promise<void>;
  onChangePassword?: (username: string, newPassword: string) => Promise<void>;
  onDeleteUser?: (username: string) => Promise<void>;
  onAddLogins?: (username: string, amount: number) => Promise<void>;
  onDecreaseLogins?: (username: string, amount: number) => Promise<void>;
  onResetLogins?: (username: string) => Promise<void>;
  onAddPdf?: (username: string, amount: number) => Promise<void>;
  onDecreasePdf?: (username: string, amount: number) => Promise<void>;
  onResetPdf?: (username: string) => Promise<void>;
}

const USERS_PER_PAGE = 10;

const SpecialUsersManager = ({
  token,
  onImpersonateLogin,
  onUpdateTags,
  onChangePassword,
  onDeleteUser,
  onAddLogins,
  onDecreaseLogins,
  onResetLogins,
  onAddPdf,
  onDecreasePdf,
  onResetPdf,
}: SpecialUsersManagerProps) => {
  const [specialUsers, setSpecialUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // 对话框状态
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingTags, setIsProcessingTags] = useState(false);
  
  // 复制状态
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { toast } = useToast();

  // 获取特别关注用户列表
  const fetchSpecialUsers = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await adminApi.getSpecialUsers(token);
      if (data.success) {
        setSpecialUsers(data.users || []);
      } else {
        throw new Error(data.error || "获取特别关注用户失败");
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

  // 当token变化时获取数据
  useEffect(() => {
    if (token) {
      fetchSpecialUsers();
    }
  }, [token]);

  // 复制文本到剪贴板
  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopyTextToClipboard(text);
      }
      
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("复制失败:", error);
      try {
        fallbackCopyTextToClipboard(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackError) {
        toast({
          variant: "destructive",
          title: "复制失败",
          description: `请长按"${text}"手动选择复制`,
        });
      }
    }
  };

  // 降级复制方法
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (!successful) {
        throw new Error("execCommand copy failed");
      }
    } finally {
      document.body.removeChild(textArea);
    }
  };

  // 过滤和分页
  const filteredUsers = specialUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.tags && user.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  // 当搜索条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 直接登录用户
  const handleImpersonateLogin = async (user: User) => {
    if (!onImpersonateLogin) {
      toast({
        variant: "destructive",
        title: "功能不可用",
        description: "直接登录功能未配置",
      });
      return;
    }

    try {
      await onImpersonateLogin(user.username);
      toast({
        title: "登录成功",
        description: `已直接登录到用户 ${user.username} 的账号`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error.message || "请稍后重试",
      });
    }
  };

  // 打开标签编辑对话框
  const handleOpenTagDialog = (user: User) => {
    setSelectedUser(user);
    setCurrentTags(user.tags || []);
    setNewTagInput("");
    setTagDialogOpen(true);
  };

  // 添加标签
  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      setCurrentTags([...currentTags, trimmedTag]);
      setNewTagInput("");
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  // 保存标签
  const handleSaveTags = async () => {
    if (!selectedUser || !onUpdateTags) return;

    setIsProcessingTags(true);
    try {
      await onUpdateTags(selectedUser.username, currentTags);
      toast({
        title: "标签更新成功",
        description: `已为用户 ${selectedUser.username} 更新标签`,
      });
      setTagDialogOpen(false);
      fetchSpecialUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsProcessingTags(false);
    }
  };

  // 获取标签颜色
  const getTagColor = (tag: string) => {
    const colorMap: Record<string, string> = {
      'VIP': 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      '问题用户': 'bg-red-500 text-white',
      '测试账号': 'bg-gray-500 text-white',
      '特别关注': 'bg-purple-500 text-white',
    };
    return colorMap[tag] || 'bg-blue-500 text-white';
  };

  // 打开修改密码对话框
  const handleOpenChangePassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setChangePasswordDialogOpen(true);
  };

  // 确认修改密码
  const handleConfirmChangePassword = async () => {
    if (!selectedUser || !newPassword.trim() || !onChangePassword) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: "请输入新密码",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onChangePassword(selectedUser.username, newPassword);
      setChangePasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      fetchSpecialUsers();
    } catch (error) {
      // 忽略错误，由调用方处理
    } finally {
      setIsProcessing(false);
    }
  };

  // 打开删除对话框
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // 确认删除用户
  const handleConfirmDelete = async () => {
    if (!selectedUser || !onDeleteUser) return;

    setIsProcessing(true);
    try {
      await onDeleteUser(selectedUser.username);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchSpecialUsers();
    } catch (error) {
      // 忽略错误，由调用方处理
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Star className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl">特别关注用户</CardTitle>
              <CardDescription>查看和管理带有特别关注标签的用户账号</CardDescription>
            </div>
          </div>
          <Button onClick={fetchSpecialUsers} variant="outline" size="sm" className="border-2 flex-1 sm:flex-none" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            刷新列表
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用户名或标签..."
            className="pl-10 h-10"
          />
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{specialUsers.length}</div>
            <div className="text-xs text-muted-foreground">总数</div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredUsers.length}</div>
            <div className="text-xs text-muted-foreground">搜索结果</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-center col-span-2 md:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPages}</div>
            <div className="text-xs text-muted-foreground">总页数</div>
          </div>
        </div>

        {/* 用户列表 */}
        {isLoading ? (
          <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在加载特别关注用户...</p>
            </div>
          </div>
        ) : paginatedUsers.length > 0 ? (
          <>
            <div className="border-2 rounded-lg p-3 max-h-96 overflow-auto bg-gradient-to-br from-muted/30 to-muted/50 space-y-2">
              {paginatedUsers.map((user, index) => {
                const isTodayRegistered = user.created_at && new Date(user.created_at).toDateString() === new Date().toDateString();
                return (
                  <div
                    key={user.id}
                    className={`flex flex-col p-3 sm:p-4 bg-gradient-to-r from-background to-muted/20 rounded-lg hover:shadow-lg transition-all border-2 border-border/50 hover:border-orange-400/50 animate-scale-in gap-3 ${isTodayRegistered ? 'ring-2 ring-green-500/50 ring-offset-2' : ''}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* 用户基本信息 */}
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-1.5 group">
                        <span className="font-bold text-base sm:text-lg truncate cursor-pointer hover:text-primary transition-colors" onClick={() => copyToClipboard(user.username, `username-${user.id}`)} title="点击复制用户名">
                          {user.username}
                        </span>
                        {isTodayRegistered && (
                          <Badge className="bg-green-500 text-white border-0 flex items-center gap-1 px-1.5 py-0 h-5 text-[10px]">
                            <Sparkles className="h-3 w-3" />
                            今日新注册
                          </Badge>
                        )}
                        {/* 显示用户标签 */}
                        {user.tags && user.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {user.tags.map((tag, idx) => (
                              <Badge key={idx} className={`${getTagColor(tag)} border-0 px-1.5 py-0 h-5 text-[10px]`}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(user.username, `username-${user.id}`)}
                          title="复制用户名"
                        >
                          {copiedField === `username-${user.id}` ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span className="text-muted-foreground font-mono flex items-center gap-1.5 group/password cursor-pointer hover:text-foreground transition-colors" onClick={() => copyToClipboard(user.password, `password-${user.id}`)} title="点击复制密码">
                          <span className="font-medium">密码:</span> 
                          <span>{user.password}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover/password:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(user.password, `password-${user.id}`);
                            }}
                            title="复制密码"
                          >
                            {copiedField === `password-${user.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </span>
                        {user.created_at && (
                          <span className="text-muted-foreground">
                            <span className="font-medium">注册时间:</span> {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 统计信息徽章 */}
                    <div className="flex gap-2 w-full">
                      <Badge variant="default" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                        <LogOut className="h-3 w-3" />
                        <span className="font-medium">登录: {user.remaining_logins}</span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                        <Coins className="h-3 w-3" />
                        <span className="font-medium">PDF: {user.pdf_limit}</span>
                      </Badge>
                    </div>

                    {/* 操作按钮 */}
                    <div className="grid grid-cols-2 sm:flex sm:gap-2 w-full gap-2">
                      {onImpersonateLogin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImpersonateLogin(user)}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 h-9 px-2 text-xs justify-center sm:flex-1"
                          title="直接登录（不消耗积分）"
                        >
                          <LogOut className="h-4 w-4 mr-1.5 shrink-0" />
                          <span className="truncate">登录</span>
                        </Button>
                      )}
                      {onUpdateTags && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTagDialog(user)}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 h-9 px-2 text-xs justify-center sm:flex-1"
                          title="管理标签"
                        >
                          <Tag className="h-4 w-4 mr-1.5 shrink-0" />
                          <span className="truncate">标签</span>
                        </Button>
                      )}
                      {onChangePassword && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenChangePassword(user)}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 h-9 px-2 text-xs justify-center sm:flex-1"
                          title="修改密码"
                        >
                          <KeyRound className="h-4 w-4 mr-1.5 shrink-0" />
                          <span className="truncate">改密</span>
                        </Button>
                      )}
                      {onDeleteUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(user)}
                          className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-9 px-2 text-xs justify-center sm:flex-1"
                          title="删除用户"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
                          <span className="truncate">删除</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  第 {currentPage} / {totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs sm:text-sm h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs sm:text-sm h-9"
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 rounded-lg">
            {searchQuery ? "未找到匹配的特别关注用户" : "暂无特别关注用户"}
          </div>
        )}
      </CardContent>

      {/* 修改密码对话框 */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>修改用户密码</DialogTitle>
            <DialogDescription>
              为用户 <span className="font-semibold text-primary">{selectedUser?.username}</span> 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                建议密码长度至少8位，包含字母和数字
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setChangePasswordDialogOpen(false)}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmChangePassword}
              disabled={isProcessing || !newPassword.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                "确认修改"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              删除用户确认
            </DialogTitle>
            <DialogDescription>
              此操作将彻底删除用户 <span className="font-semibold text-red-600">{selectedUser?.username}</span> 及其所有相关数据
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">⚠️ 警告：此操作不可恢复！</p>
              <ul className="text-xs text-red-600 dark:text-red-500 space-y-1 list-disc list-inside">
                <li>用户账户将被永久删除</li>
                <li>学历、学位将全部删除</li>
                <li>考研信息、学位信息将全部删除</li>
                <li>登录日志将全部删除</li>
                <li>充值卡使用记录将被清空</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              请确认您真的要删除用户 <span className="font-semibold">{selectedUser?.username}</span> 吗？
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  确认删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 标签编辑对话框 */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-600" />
              管理用户标签
            </DialogTitle>
            <DialogDescription>
              为用户 <span className="font-semibold text-primary">{selectedUser?.username}</span> 添加或删除标签
              <br />
              <span className="text-xs text-muted-foreground">移除"特别关注"标签将从本列表中消失</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 当前标签列表 */}
            <div>
              <Label className="mb-2 block">当前标签</Label>
              {currentTags.length > 0 ? (
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-muted/30 rounded-lg border">
                  {currentTags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      className={`${getTagColor(tag)} cursor-pointer hover:opacity-80 transition-opacity px-3 py-1`}
                      onClick={() => handleRemoveTag(tag)}
                      title="点击删除此标签"
                    >
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-muted/30 rounded-lg border text-sm text-muted-foreground text-center">
                  暂无标签，请添加新标签
                </div>
              )}
            </div>

            {/* 添加新标签 */}
            <div className="space-y-2">
              <Label htmlFor="new-tag">添加新标签</Label>
              <div className="flex gap-2">
                <Input
                  id="new-tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="输入标签名称（如：VIP、问题用户）"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim()}
                  variant="outline"
                  size="sm"
                >
                  添加
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                提示：按回车键可快速添加标签
              </p>
            </div>

            {/* 常用标签建议 */}
            <div>
              <Label className="mb-2 block">常用标签建议</Label>
              <div className="flex flex-wrap gap-2">
                {['VIP', '问题用户', '测试账号', '特别关注'].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => {
                      if (!currentTags.includes(suggestion)) {
                        setCurrentTags([...currentTags, suggestion]);
                      }
                    }}
                  >
                    + {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTagDialogOpen(false)}
              disabled={isProcessingTags}
              className="flex-1 sm:flex-none"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveTags}
              disabled={isProcessingTags}
              className="flex-1 sm:flex-none"
            >
              {isProcessingTags ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Tag className="h-4 w-4 mr-2" />
                  保存标签
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SpecialUsersManager;
