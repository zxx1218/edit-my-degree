import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, MessageSquare, Reply, Trash2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import * as adminApi from "@/lib/adminApi";
import { getMessages, replyMessage, deleteMessage, type Message } from "@/lib/api";
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
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="bg-gradient-to-r from-background to-muted/20 rounded-lg p-4 hover:shadow-lg transition-all border-2 border-border/50 hover:border-green-300 dark:hover:border-green-700 animate-scale-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* 用户信息和时间 */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-semibold text-sm">{message.username}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(message.created_at).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReplyDialog(message)}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 h-8 px-2"
                        >
                          <Reply className="h-3.5 w-3.5 mr-1" />
                          回复
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-8 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
    </Card>
  );
};

export default MessageList;
