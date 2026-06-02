import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Loader2, LogIn, CreditCard, ChevronLeft, ChevronRight, Search, KeyRound, Trash2 } from "lucide-react";
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
}

const USERS_PER_PAGE = 10;

const UserList = ({ 
  users, 
  searchQuery, 
  onSearchChange, 
  isFetchingUsers, 
  onFetchUsers,
  onChangePassword,
  onDeleteUser
}: UserListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
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
                    <div className="ml-0 sm:ml-4 flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChangePassword(user)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 flex-1 sm:flex-none"
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        改密
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(user)}
                        className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
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
    </Card>
  );
};

export default UserList;
