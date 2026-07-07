import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Loader2, LogIn, CreditCard, ChevronLeft, ChevronRight, Search, KeyRound, Trash2, Coins, UserPlus, Minus, RotateCcw } from "lucide-react";
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

interface User {
  id: string;
  username: string;
  password: string;
  remaining_logins: number;
  pdf_limit: number;
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

  const { toast } = useToast();

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
      console.error("修改密码失败:", error);
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
    setPointsDialogOpen(true);
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
      console.error("删除用户失败:", error);
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
                {paginatedUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gradient-to-r from-background to-muted/20 rounded-lg hover:shadow-lg transition-all border-2 border-border/50 hover:border-primary/30 animate-scale-in gap-3 sm:gap-0"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex-1 min-w-0 space-y-1 w-full sm:w-auto">
                      <span className="font-bold text-lg block truncate">{user.username}</span>
                      <span className="text-xs text-muted-foreground font-mono">密码: {user.password}</span>
                    </div>
                    <div className="ml-0 sm:ml-4 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Badge variant="default" className="flex items-center gap-1.5 px-3 py-1 justify-start">
                        <LogIn className="h-3.5 w-3.5" />
                        <span className="font-medium">登录次数: {user.remaining_logins}</span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 justify-start">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="font-medium">PDF积分: {user.pdf_limit}</span>
                      </Badge>
                    </div>
                    <div className="ml-0 sm:ml-4 flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPointsDialog(user)}
                        className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 flex-1 sm:flex-none px-2 sm:px-3"
                        title="管理积分"
                      >
                        <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">积分</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChangePassword(user)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 flex-1 sm:flex-none px-2 sm:px-3"
                        title="修改密码"
                      >
                        <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">改密</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(user)}
                        className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex-1 sm:flex-none px-2 sm:px-3"
                        title="删除用户"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">删除</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
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
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="login" className="text-sm">
                <LogIn className="mr-2 h-4 w-4" />
                登录次数
              </TabsTrigger>
              <TabsTrigger value="pdf" className="text-sm">
                <CreditCard className="mr-2 h-4 w-4" />
                PDF积分
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
