import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMessages, addMessage, type Message } from "@/lib/api";

const MessageBoard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 10; // 每页显示10条留言

  // 获取留言列表
  const fetchMessages = async (page: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await getMessages(page, pageSize);
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

  // 页面加载时获取留言
  useEffect(() => {
    fetchMessages(1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登录
        </Button>

        {/* 留言板标题卡片 */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              客户留言板
            </CardTitle>
            <CardDescription>查看其他用户的留言和反馈，也可以留下您的宝贵意见</CardDescription>
          </CardHeader>
        </Card>

        {/* 留言列表 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="border rounded-lg p-4 bg-background max-h-[500px] overflow-y-auto">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">加载中...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">暂无留言，快来留下第一条吧！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="p-4 bg-card rounded border hover:shadow-md transition-shadow">
                      <p className="text-sm text-foreground mb-2 break-words whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">发表留言</CardTitle>
            <CardDescription>分享您的想法和建议</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="写下您的留言..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {newMessage.length}/500
              </span>
              <Button
                onClick={handleSubmitMessage}
                disabled={isSubmitting || !newMessage.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  "提交中..."
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
    </div>
  );
};

export default MessageBoard;
