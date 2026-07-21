import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Users, MessageSquare, Reply, Trash2, ChevronLeft, ChevronRight, Loader2, Send, Pin } from "lucide-react";
import { toast } from "sonner";
import * as adminApi from "@/lib/adminApi";
import { getMessages, replyMessage, deleteMessage, setPriority, type Message } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MessageListProps {
  token: string | null;
}

const MESSAGES_PER_PAGE = 10;

const MessageList = ({ token }: MessageListProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // 回复对话框状态
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // 设置优先级对话框状态
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [priorityMessage, setPriorityMessage] = useState<Message | null>(null);
  const [priorityValue, setPriorityValue] = useState<string>("");
  const [isSettingPriority, setIsSettingPriority] = useState(false);

  // 获取留言列表
  const fetchMessages = async (page: number) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await getMessages(page, MESSAGES_PER_PAGE);
      if (response.success) {
        setMessages(response.messages);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
        setTotalMessages(response.total);
      } else {
        toast.error(response.error || "获取留言失败");
      }
    } catch (error) {
      console.error("获取留言失败:", error);
      toast.error("获取留言失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 打开回复对话框
  const handleOpenReplyDialog = (message: Message) => {
    setSelectedMessage(message);
    setReplyContent(message.reply_content || "");
    setReplyDialogOpen(true);
  };

  // 提交回复
  const handleSubmitReply = async () => {
    if (!selectedMessage || !replyContent.trim()) {
      toast.error("回复内容不能为空");
      return;
    }

    if (replyContent.length > 1000) {
      toast.error("回复内容不能超过1000个字符");
      return;
    }

    setIsReplying(true);
    try {
      const response = await replyMessage(selectedMessage.id, replyContent);
      if (response.success) {
        toast.success("回复成功");
        setReplyDialogOpen(false);
        setSelectedMessage(null);
        setReplyContent("");
        // 刷新当前页的留言
        await fetchMessages(currentPage);
      } else {
        toast.error(response.error || "回复失败");
      }
    } catch (error) {
      console.error("回复失败:", error);
      toast.error("回复失败，请稍后重试");
    } finally {
      setIsReplying(false);
    }
  };

  // 删除留言
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("确定要删除这条留言吗？此操作不可恢复！")) {
      return;
    }

    try {
      const response = await deleteMessage(messageId);
      if (response.success) {
        toast.success("删除成功");
        // 刷新当前页的留言
        await fetchMessages(currentPage);
      } else {
        toast.error(response.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败，请稍后重试");
    }
  };

  // 打开设置优先级对话框
  const handleOpenPriorityDialog = (message: Message) => {
    setPriorityMessage(message);
    setPriorityValue(message.priority?.toString() || "");
    setPriorityDialogOpen(true);
  };

  // 提交设置优先级
  const handleSubmitPriority = async () => {
    if (!priorityMessage) return;

    // 验证输入
    const priority = priorityValue.trim() === "" ? null : parseInt(priorityValue);
    
    if (priority !== null && (isNaN(priority) || priority < 1)) {
      toast.error("优先级必须为正整数或留空");
      return;
    }

    setIsSettingPriority(true);
    try {
      const response = await setPriority(priorityMessage.id, priority);
      if (response.success) {
        toast.success(priority === null ? "已清除优先级" : `优先级设置为 ${priority}`);
        setPriorityDialogOpen(false);
        setPriorityMessage(null);
        setPriorityValue("");
        // 刷新当前页的留言
        await fetchMessages(currentPage);
      } else {
        toast.error(response.error || "设置优先级失败");
      }
    } catch (error) {
      console.error("设置优先级失败:", error);
      toast.error("设置优先级失败，请稍后重试");
    } finally {
      setIsSettingPriority(false);
    }
  };

  // 当token变化或页面加载时获取数据
  useEffect(() => {
    if (token) {
      fetchMessages(1);
    }
  }, [token]);

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">留言管理</CardTitle>
              <CardDescription>
                共 {totalMessages} 条留言
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => fetchMessages(currentPage)} variant="outline" size="sm" className="border-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            刷新列表
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在加载留言列表...</p>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <>
            <div className="border-2 rounded-lg p-3 max-h-[500px] overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isPinned = message.priority === 1;
                  
                  return (
                    <div
                      key={message.id}
                      className={`bg-gradient-to-r rounded-lg p-4 hover:shadow-lg transition-all border-2 animate-scale-in ${
                        isPinned 
                          ? 'from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-yellow-400 hover:border-yellow-500' 
                          : 'from-background to-muted/20 border-border/50 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* 置顶徽章 */}
                      {isPinned && (
                        <div className="mb-2">
                          <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white animate-pulse shadow-lg">
                            <Pin className="h-3 w-3 mr-1" />
                            置顶留言
                          </Badge>
                        </div>
                      )}

                      {/* 用户信息和时间 - 移动端优化布局 */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{message.username}</span>
                          {message.priority !== null && message.priority !== undefined && (
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                              优先级: {message.priority}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(message.created_at).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {/* 操作按钮组 - 移动端美化版 */}
                        <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleOpenPriorityDialog(message)}
                            className="group relative overflow-hidden rounded-lg border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/40 dark:hover:to-indigo-900/40 transition-all duration-200 h-14 sm:h-8 px-2 sm:px-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-1.5 shadow-sm hover:shadow-md active:scale-95"
                          >
                            <Pin className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 sm:hidden">优先级</span>
                          </button>
                          
                          <button
                            onClick={() => handleOpenReplyDialog(message)}
                            className="group relative overflow-hidden rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/40 transition-all duration-200 h-14 sm:h-8 px-2 sm:px-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-1.5 shadow-sm hover:shadow-md active:scale-95"
                          >
                            <Reply className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 sm:hidden">回复</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="group relative overflow-hidden rounded-lg border-2 border-red-500 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/40 dark:hover:to-pink-900/40 transition-all duration-200 h-14 sm:h-8 px-2 sm:px-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-1.5 shadow-sm hover:shadow-md active:scale-95"
                          >
                            <Trash2 className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-red-700 dark:text-red-300 sm:hidden">删除</span>
                          </button>
                        </div>
                      </div>

                      {/* 留言内容 */}
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded p-3 mb-2 border">
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap line-clamp-3">
                          {message.content}
                        </p>
                      </div>

                      {/* 管理员回复 */}
                      {message.reply_content && (
                        <div className="ml-4 bg-blue-50 dark:bg-blue-900/20 rounded p-3 border-l-4 border-blue-500">
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              已回复
                            </Badge>
                            {message.replied_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.replied_at).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap line-clamp-2">
                            {message.reply_content}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      fetchMessages(newPage);
                    }}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.min(totalPages, currentPage + 1);
                      fetchMessages(newPage);
                    }}
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
            暂无留言数据
          </div>
        )}
      </CardContent>

      {/* 回复对话框 */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-blue-600" />
              回复留言
            </DialogTitle>
            <DialogDescription>
              为用户 <span className="font-semibold text-primary">{selectedMessage?.username}</span> 的留言进行回复
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 原留言内容 */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border">
              <p className="text-xs text-muted-foreground mb-2">原留言：</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                {selectedMessage?.content}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reply-content">回复内容</Label>
              <Textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="请输入回复内容..."
                maxLength={1000}
                rows={6}
                className="resize-none"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right">
                {replyContent.length}/1000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReplyDialogOpen(false)}
              disabled={isReplying}
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmitReply}
              disabled={isReplying || !replyContent.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isReplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  提交回复
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置优先级对话框 */}
      <Dialog open={priorityDialogOpen} onOpenChange={setPriorityDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-purple-600" />
              设置留言优先级
            </DialogTitle>
            <DialogDescription>
              为用户 <span className="font-semibold text-primary">{priorityMessage?.username}</span> 的留言设置展示优先级
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 原留言内容 */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border">
              <p className="text-xs text-muted-foreground mb-2">留言内容：</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap line-clamp-3">
                {priorityMessage?.content}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority-value">
                优先级数字（留空表示无优先级，按时间排序）
              </Label>
              <Input
                id="priority-value"
                type="number"
                min="1"
                value={priorityValue}
                onChange={(e) => setPriorityValue(e.target.value)}
                placeholder="输入正整数，例如：1（置顶）、2、3..."
                autoFocus
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 数字越小，排名越靠前</p>
                <p>• priority = 1 为置顶留言，会有特殊视觉效果</p>
                <p>• 留空或清除则按留言时间倒序排列</p>
                <p>• 当前优先级：{priorityMessage?.priority !== null && priorityMessage?.priority !== undefined ? `优先级 ${priorityMessage.priority}` : '无优先级（按时间排序）'}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPriorityDialogOpen(false)}
              disabled={isSettingPriority}
            >
              取消
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setPriorityValue("");
                handleSubmitPriority();
              }}
              disabled={isSettingPriority}
              className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
            >
              清除优先级
            </Button>
            <Button 
              onClick={handleSubmitPriority}
              disabled={isSettingPriority || (priorityValue.trim() !== "" && (isNaN(parseInt(priorityValue)) || parseInt(priorityValue) < 1))}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isSettingPriority ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  设置中...
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-2" />
                  确认设置
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessageList;
