import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Loader2, LogIn, CreditCard, ChevronLeft, ChevronRight, Search, KeyRound, Trash2, Coins, UserPlus, Minus, RotateCcw, History, Copy, Check, LogOut, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as adminApi from "@/lib/adminApi";
import { format } from "date-fns";

interface User {
  id: string;
  username: string;
  password: string;
  remaining_logins: number;
  pdf_limit: number;
  created_at?: string;
}

interface CardHistoryItem {
  id: string;
  type: string;
  values: number;
  used_at: string;
  card_type_label: string;
}

interface UserListProps {
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFetchingUsers: boolean;
  onFetchUsers: () => void;
  onChangePassword: (username: string, newPassword: string) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  // 积分管理回调
  onAddLogins?: (username: string, logins: number) => Promise<void>;
  onDecreaseLogins?: (username: string, logins: number) => Promise<void>;
  onResetLogins?: (username: string) => Promise<void>;
  onAddPdf?: (username: string, amount: number) => Promise<void>;
  onDecreasePdf?: (username: string, amount: number) => Promise<void>;
  onResetPdf?: (username: string) => Promise<void>;
  token?: string | null;
  // 直接登录回调
  onImpersonateLogin?: (username: string) => Promise<void>;
}

const USERS_PER_PAGE = 10;

const UserList = ({
  users,
  searchQuery,
  onSearchChange,
  isFetchingUsers,
  onFetchUsers,
  onChangePassword,
  onDeleteUser,
  onAddLogins,
  onDecreaseLogins,
  onResetLogins,
  onAddPdf,
  onDecreasePdf,
  onResetPdf,
  token,
  onImpersonateLogin,
}: UserListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 积分管理对话框状态
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [pointsTab, setPointsTab] = useState("login");
  const [loginOperation, setLoginOperation] = useState("add");
  const [pdfOperation, setPdfOperation] = useState("add");
  const [pointsAmount, setPointsAmount] = useState("");
  const [isProcessingPoints, setIsProcessingPoints] = useState(false);

  // 卡密历史记录状态
  const [cardHistory, setCardHistory] = useState<CardHistoryItem[]>([]);
  const [isLoadingCardHistory, setIsLoadingCardHistory] = useState(false);

  // 复制状态
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { toast } = useToast();

  // 复制文本到剪贴板（兼容 iOS Safari）
  const copyToClipboard = async (text: string, field: string) => {
    try {
      // 首先尝试使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级方案：使用 execCommand
        fallbackCopyTextToClipboard(text);
      }
      
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("复制失败:", error);
      // 如果 Clipboard API 失败，尝试降级方案
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

  // 降级复制方法（兼容 iOS Safari 等旧版浏览器）
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // 设置样式使 textarea 不可见
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

  // 直接登录用户（不消耗积分）
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

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // 当搜索条件变化时,重置到第一页
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleOpenChangePassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setChangePasswordDialogOpen(true);
  };

  const handleConfirmChangePassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
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
    } catch (error) {
      // 忽略错误，由调用方处理
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // 打开积分管理对话框
  const handleOpenPointsDialog = (user: User) => {
    setSelectedUser(user);
    setPointsAmount("");
    setPointsTab("login");
    setLoginOperation("add");
    setPdfOperation("add");
    setCardHistory([]); // 清空之前的历史记录
    setPointsDialogOpen(true);
    
    // 自动加载该用户的卡密历史记录
    if (token && user.username) {
      fetchCardHistory(user.username);
    }
  };

  // 获取用户卡密历史记录
  const fetchCardHistory = async (username: string) => {
    if (!token) return;
    
    setIsLoadingCardHistory(true);
    try {
      const data = await adminApi.getUserCardHistory(token, username);
      if (data.success) {
        setCardHistory(data.cards || []);
      } else {
        throw new Error(data.error || "获取卡密历史失败");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "获取失败",
        description: error.message || "无法加载卡密使用记录",
      });
    } finally {
      setIsLoadingCardHistory(false);
    }
  };

  // 处理积分操作
  const handlePointsOperation = async () => {
    if (!selectedUser) return;

    const amount = parseInt(pointsAmount);
    if ((loginOperation !== "reset" && pdfOperation !== "reset") && (isNaN(amount) || amount <= 0)) {
      toast({
        variant: "destructive",
        title: "输入错误",
        description: "请输入有效的数量",
      });
      return;
    }

    setIsProcessingPoints(true);
    try {
      if (pointsTab === "login") {
        // 登录次数操作
        if (loginOperation === "add" && onAddLogins) {
          await onAddLogins(selectedUser.username, amount);
          toast({ title: "添加成功", description: `已为用户 ${selectedUser.username} 添加 ${amount} 次登录` });
        } else if (loginOperation === "decrease" && onDecreaseLogins) {
          await onDecreaseLogins(selectedUser.username, amount);
          toast({ title: "减少成功", description: `已为用户 ${selectedUser.username} 减少 ${amount} 次登录` });
        } else if (loginOperation === "reset" && onResetLogins) {
          await onResetLogins(selectedUser.username);
          toast({ title: "重置成功", description: `已将用户 ${selectedUser.username} 的登录次数重置为 0` });
        }
      } else {
        // PDF积分操作
        if (pdfOperation === "add" && onAddPdf) {
          await onAddPdf(selectedUser.username, amount);
          toast({ title: "添加成功", description: `已为用户 ${selectedUser.username} 添加 ${amount} 积分` });
        } else if (pdfOperation === "decrease" && onDecreasePdf) {
          await onDecreasePdf(selectedUser.username, amount);
          toast({ title: "减少成功", description: `已为用户 ${selectedUser.username} 减少 ${amount} 积分` });
        } else if (pdfOperation === "reset" && onResetPdf) {
          await onResetPdf(selectedUser.username);
          toast({ title: "重置成功", description: `已将用户 ${selectedUser.username} 的PDF积分重置为 0` });
        }
      }
      setPointsDialogOpen(false);
      setPointsAmount("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: error.message || "请重试",
      });
    } finally {
      setIsProcessingPoints(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await onDeleteUser(selectedUser.username);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // 忽略错误，由调用方处理
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <List className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl">用户列表</CardTitle>
              <CardDescription>
                共 {users.length} 个用户 {searchQuery && `· 搜索结果 ${filteredUsers.length} 个`}
              </CardDescription>
            </div>
          </div>
          <Button onClick={onFetchUsers} variant="outline" size="sm" className="border-2" disabled={isFetchingUsers}>
            {isFetchingUsers ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <List className="h-4 w-4 mr-2" />
            )}
            刷新列表
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索用户名..."
            className="pl-10 h-10"
          />
        </div>

        {isFetchingUsers ? (
          <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在加载用户列表...</p>
            </div>
          </div>
        ) : paginatedUsers.length > 0 ? (
          <>
            <div className="border-2 rounded-lg p-3 max-h-80 overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
              <div className="space-y-2">
                {paginatedUsers.map((user, index) => {
                  const isTodayRegistered = user.created_at && new Date(user.created_at).toDateString() === new Date().toDateString();
                  return (
                  <div
                    key={user.id}
                    className={`flex flex-col p-3 sm:p-4 bg-gradient-to-r from-background to-muted/20 rounded-lg hover:shadow-lg transition-all border-2 border-border/50 hover:border-primary/30 animate-scale-in gap-3 ${isTodayRegistered ? 'ring-2 ring-green-500/50 ring-offset-2' : ''}`}
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

                    {/* 统计信息徽章 - 移动端横向排列 */}
                    <div className="flex gap-2 w-full">
                      <Badge variant="default" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                        <LogIn className="h-3 w-3" />
                        <span className="font-medium">登录: {user.remaining_logins}</span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                        <CreditCard className="h-3 w-3" />
                        <span className="font-medium">PDF: {user.pdf_limit}</span>
                      </Badge>
                    </div>

                    {/* 操作按钮 - 移动端两个一行排列，桌面端横向排列 */}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPointsDialog(user)}
                        className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 h-9 px-2 text-xs justify-center sm:flex-1"
                        title="管理积分"
                      >
                        <Coins className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">积分</span>
                      </Button>
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
                    </div>
                  </div>
                );
                })}
              </div>
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
            {searchQuery ? "未找到匹配的用户" : "暂无用户数据"}
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

      {/* 积分管理对话框 */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-600" />
              管理用户积分
            </DialogTitle>
            <DialogDescription>
              为用户 <span className="font-semibold text-primary">{selectedUser?.username}</span> 管理登录次数和PDF积分
              <br />
              当前登录次数: <span className="font-medium">{selectedUser?.remaining_logins}</span> |
              PDF积分: <span className="font-medium">{selectedUser?.pdf_limit}</span>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={pointsTab} onValueChange={setPointsTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11">
              <TabsTrigger value="login" className="text-sm">
                <LogIn className="mr-2 h-4 w-4" />
                登录次数
              </TabsTrigger>
              <TabsTrigger value="pdf" className="text-sm">
                <CreditCard className="mr-2 h-4 w-4" />
                PDF积分
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm">
                <History className="mr-2 h-4 w-4" />
                卡密记录
              </TabsTrigger>
            </TabsList>

            {/* 登录次数操作 */}
            <TabsContent value="login" className="mt-4">
              <Tabs value={loginOperation} onValueChange={setLoginOperation} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-10">
                  <TabsTrigger value="add" className="text-xs sm:text-sm">
                    <UserPlus className="mr-1 h-3 w-3" />
                    增加
                  </TabsTrigger>
                  <TabsTrigger value="decrease" className="text-xs sm:text-sm">
                    <Minus className="mr-1 h-3 w-3" />
                    减少
                  </TabsTrigger>
                  <TabsTrigger value="reset" className="text-xs sm:text-sm">
                    <RotateCcw className="mr-1 h-3 w-3" />
                    重置
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="mt-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-green-600" />
                      增加登录次数
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-logins-amount">增加数量</Label>
                        <Input
                          id="add-logins-amount"
                          type="number"
                          min="1"
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                          placeholder="请输入要增加的次数"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="decrease" className="mt-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Minus className="h-4 w-4 text-orange-600" />
                      减少登录次数
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="decrease-logins-amount">减少数量</Label>
                        <Input
                          id="decrease-logins-amount"
                          type="number"
                          min="1"
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                          placeholder="请输入要减少的次数"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reset" className="mt-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-red-600" />
                      重置登录次数
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      此操作将把用户登录次数重置为 0，当前剩余次数: {selectedUser?.remaining_logins}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* PDF积分操作 */}
            <TabsContent value="pdf" className="mt-4">
              <Tabs value={pdfOperation} onValueChange={setPdfOperation} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-10">
                  <TabsTrigger value="add" className="text-xs sm:text-sm">
                    <UserPlus className="mr-1 h-3 w-3" />
                    增加
                  </TabsTrigger>
                  <TabsTrigger value="decrease" className="text-xs sm:text-sm">
                    <Minus className="mr-1 h-3 w-3" />
                    减少
                  </TabsTrigger>
                  <TabsTrigger value="reset" className="text-xs sm:text-sm">
                    <RotateCcw className="mr-1 h-3 w-3" />
                    重置
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="mt-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      增加PDF积分
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-pdf-amount">增加数量</Label>
                        <Input
                          id="add-pdf-amount"
                          type="number"
                          min="1"
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                          placeholder="请输入要增加的积分数量"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="decrease" className="mt-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Minus className="h-4 w-4 text-orange-600" />
                      减少PDF积分
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="decrease-pdf-amount">减少数量</Label>
                        <Input
                          id="decrease-pdf-amount"
                          type="number"
                          min="1"
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                          placeholder="请输入要减少的积分数量"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reset" className="mt-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-red-600" />
                      重置PDF积分
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      此操作将把用户PDF积分重置为 0，当前剩余积分: {selectedUser?.pdf_limit}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* 卡密使用记录 */}
            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {isLoadingCardHistory ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">正在加载卡密记录...</p>
                  </div>
                ) : cardHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 rounded-lg bg-muted/30">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>该用户尚未使用过任何卡密</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-auto space-y-2">
                    {cardHistory.map((card, index) => (
                      <div
                        key={card.id}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-all animate-scale-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={card.type === 'login' ? 'default' : 'secondary'}
                                className="flex items-center gap-1.5"
                              >
                                {card.type === 'login' ? (
                                  <LogIn className="h-3 w-3" />
                                ) : (
                                  <CreditCard className="h-3 w-3" />
                                )}
                                {card.card_type_label}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                ID: {card.id.substring(0, 8)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">充值数量:</span>
                              <span className="text-primary font-bold">{card.values}</span>
                              <span className="text-muted-foreground">
                                {card.type === 'login' ? '次登录' : '积分'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>使用时间:</span>
                              <span className="font-mono">
                                {card.used_at ? format(new Date(card.used_at), 'yyyy-MM-dd HH:mm:ss') : '未知'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {cardHistory.length > 0 && (
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    共 {cardHistory.length} 条记录，按使用时间倒序排列
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPointsDialogOpen(false)}
              disabled={isProcessingPoints}
              className="flex-1 sm:flex-none"
            >
              取消
            </Button>
            <Button
              onClick={handlePointsOperation}
              disabled={isProcessingPoints || ((loginOperation !== "reset" && pdfOperation !== "reset") && !pointsAmount)}
              variant={loginOperation === "reset" || pdfOperation === "reset" ? "destructive" : "default"}
              className="flex-1 sm:flex-none"
            >
              {isProcessingPoints ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                "确认操作"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserList;
