import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Send, ChevronLeft, ChevronRight, User, ShieldCheck, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getMessages, addMessage, replyMessage, deleteMessage, type Message } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const MessageBoard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 回复对话框状态
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  
  const pageSize = 10; // 每页显示10条留言

  // 获取留言列表
  const fetchMessages = async (page: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await getMessages(page, pageSize);
      console.log('获取留言响应:', response); // 调试信息
      if (response.success) {
        console.log('留言数据:', response.messages); // 调试信息
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
      setIsLoadingMessages(false);
    }
  };

  // 提交新留言
  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("留言内容不能为空");
      return;
    }

    if (newMessage.length > 500) {
      toast.error("留言内容不能超过500个字符");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addMessage(newMessage);
      if (response.success) {
        toast.success("留言成功");
        setNewMessage("");
        // 刷新第一页的留言
        await fetchMessages(1);
      } else {
        toast.error(response.error || "留言失败");
      }
    } catch (error) {
      console.error("留言失败:", error);
      toast.error("留言失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
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

  // 页面加载时获取留言
  useEffect(() => {
    fetchMessages(1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="mb-6 gap-2 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登录
        </Button>

        {/* 留言板标题卡片 */}
        <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">用户留言板</CardTitle>
            <CardDescription className="text-white/80 text-base mt-2">
              查看其他用户的留言和反馈，也可以留下您的宝贵意见
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 留言列表 */}
        <Card className="mb-8 shadow-lg border-0 overflow-hidden">
          <CardContent className="pt-6">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-lg text-muted-foreground">暂无留言，快来留下第一条吧！</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="group relative bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950/30 rounded-xl p-5 border-2 border-gray-100 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xl transition-all duration-300 animate-fade-in backdrop-blur-sm"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* 装饰性元素 */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 dark:from-indigo-800/10 dark:to-purple-800/10 rounded-bl-full pointer-events-none"></div>
                    
                    {/* 用户信息头部 */}
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-700">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-base text-gray-800 dark:text-gray-100">{message.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                            {new Date(message.created_at).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 留言内容 */}
                    <div className="relative z-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-4 mb-3 border border-gray-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-shadow">
                      <div className="absolute -left-1 top-4 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full opacity-60"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap leading-relaxed pl-2">
                        {message.content}
                      </p>
                    </div>

                    {/* 调试信息 - 显示原始数据 */}
                    <div className="text-xs text-gray-400 mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      Debug: reply_content type={typeof message.reply_content}, value="{message.reply_content}", hasTrim={!!(message.reply_content && message.reply_content.trim())}
                    </div>

                    {/* 管理员回复 */}
                    {message.reply_content && message.reply_content.trim() && (
                      <div className="ml-4 sm:ml-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border-l-4 border-blue-500 shadow-md animate-fade-in">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full">
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">管理员回复</span>
                          </div>
                          {message.replied_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.replied_at).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap leading-relaxed">
                          {message.reply_content}
                        </p>
                      </div>
                    )}

                    {/* 操作按钮（仅管理员可见） */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReplyDialog(message)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        回复
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMessages(currentPage - 1)}
                  disabled={currentPage === 1 || isLoadingMessages}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {currentPage} / {totalPages} 页（共 {totalMessages} 条）
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMessages(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoadingMessages}
                  className="gap-1"
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 留言输入框 */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              发表留言
            </CardTitle>
            <CardDescription>分享您的想法和建议</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="写下您的留言..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none border-2 focus:border-indigo-500 transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {newMessage.length}/500
              </span>
              <Button
                onClick={handleSubmitMessage}
                disabled={isSubmitting || !newMessage.trim()}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    提交留言
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
};

export default MessageBoard;
