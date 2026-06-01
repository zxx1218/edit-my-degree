import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Loader2, LogIn, CreditCard, ChevronLeft, ChevronRight, Search } from "lucide-react";

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
}

const USERS_PER_PAGE = 10;

const UserList = ({ users, searchQuery, onSearchChange, isFetchingUsers, onFetchUsers }: UserListProps) => {
  const [currentPage, setCurrentPage] = useState(1);

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
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-background to-muted/20 rounded-lg hover:shadow-lg transition-all border-2 border-border/50 hover:border-primary/30 animate-scale-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="font-bold text-lg block truncate">{user.username}</span>
                      <span className="text-xs text-muted-foreground font-mono">密码: {user.password}</span>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Badge variant="default" className="flex items-center gap-1.5 px-3 py-1 justify-start">
                        <LogIn className="h-3.5 w-3.5" />
                        <span className="font-medium">登录次数: {user.remaining_logins}</span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 justify-start">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="font-medium">PDF积分: {user.pdf_limit}</span>
                      </Badge>
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
    </Card>
  );
};

export default UserList;
