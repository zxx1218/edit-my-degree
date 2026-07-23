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
  FileText, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Clock,
  QrCode,
  Eye,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as adminApi from "@/lib/adminApi";
import { format } from "date-fns";

interface PdfGenerationRecord {
  id: string;
  short_code: string;
  pdf_type: string;
  pdf_type_label: string;
  created_at: string;
  expires_at: string;
  scan_count: number;
  last_scanned_at: string | null;
  username: string | null;
  name: string | null;
  is_expired: boolean;
  remaining_days: number | null;
}

interface PdfGenerationManagerProps {
  token: string | null;
}

const ITEMS_PER_PAGE = 10;

const PdfGenerationManager = ({ token }: PdfGenerationManagerProps) => {
  const [records, setRecords] = useState<PdfGenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PdfGenerationRecord | null>(null);
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { toast } = useToast();

  // 获取PDF生成记录列表
  const fetchRecords = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await adminApi.managePdfGeneration(token, { action: 'list' });
      if (data.success) {
        setRecords(data.records || []);
      } else {
        throw new Error(data.error || "获取PDF生成记录失败");
      }
    } catch (error: any) {
      console.error("获取PDF生成记录时出错:", error);
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
      fetchRecords();
    }
  }, [token]);

  // 过滤和分页
  const filteredRecords = records.filter(item => {
    const matchesSearch = 
      (item.username?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      item.short_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.pdf_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 打开编辑对话框
  const handleEditClick = (record: PdfGenerationRecord) => {
    setSelectedRecord(record);
    // 将ISO日期转换为datetime-local格式
    const date = new Date(record.expires_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setEditExpiresAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    setIsEditDialogOpen(true);
  };

  // 更新二维码过期时间
  const handleUpdate = async () => {
    if (!token || !selectedRecord) return;

    if (!editExpiresAt) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "过期时间不能为空",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const data = await adminApi.managePdfGeneration(token, {
        action: 'update',
        id: selectedRecord.id,
        expiresAt: new Date(editExpiresAt).toISOString(),
      });

      if (data.success) {
        toast({
          title: "更新成功",
          description: `已更新二维码 ${selectedRecord.short_code} 的过期时间`,
        });
        setIsEditDialogOpen(false);
        fetchRecords();
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

  // 格式化日期时间
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy-MM-dd HH:mm:ss");
    } catch (error) {
      return dateString;
    }
  };

  // 获取状态徽章
  const getStatusBadge = (record: PdfGenerationRecord) => {
    if (record.is_expired) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    
    if (record.remaining_days !== null && record.remaining_days <= 3) {
      return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">即将过期</Badge>;
    }
    
    return <Badge variant="outline" className="text-green-600 border-green-600">有效</Badge>;
  };

  // 获取类型徽章颜色
  const getTypeBadgeColor = (pdfType: string) => {
    switch (pdfType) {
      case 'degree':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'education':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'student_status':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // 重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  return (
    <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm animate-scale-in">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">PDF生成管理</CardTitle>
              <CardDescription>查看和管理PDF生成记录及二维码信息</CardDescription>
            </div>
          </div>
          <Button
            onClick={fetchRecords}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <Clock className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">刷新</span>
            <span className="sm:hidden">刷新</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索和筛选 */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索用户名、姓名或短码..."
              className="pl-10 h-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
              className="flex-1 sm:flex-none min-w-[60px]"
            >
              全部
            </Button>
            <Button
              variant={typeFilter === "degree" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("degree")}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              <span className="hidden sm:inline">学位验证</span>
              <span className="sm:hidden">学位</span>
            </Button>
            <Button
              variant={typeFilter === "education" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("education")}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              <span className="hidden sm:inline">学历验证</span>
              <span className="sm:hidden">学历</span>
            </Button>
            <Button
              variant={typeFilter === "student_status" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("student_status")}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              <span className="hidden sm:inline">学籍验证</span>
              <span className="sm:hidden">学籍</span>
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{records.length}</div>
            <div className="text-xs text-muted-foreground">总记录数</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {records.filter(r => !r.is_expired).length}
            </div>
            <div className="text-xs text-muted-foreground">有效二维码</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {records.filter(r => r.is_expired).length}
            </div>
            <div className="text-xs text-muted-foreground">已过期</div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800 text-center col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {records.filter(r => r.remaining_days !== null && r.remaining_days <= 3 && !r.is_expired).length}
            </div>
            <div className="text-xs text-muted-foreground">即将过期</div>
          </div>
        </div>

        {/* 表格 */}
        <div className="border-2 rounded-lg overflow-hidden">
          <div className="max-h-[600px] overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">短码</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:table-cell">类型</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">用户</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap hidden md:table-cell">生成时间</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">过期时间</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap hidden lg:table-cell">扫码</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">状态</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-medium whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      {filteredRecords.length === 0 ? "没有找到匹配的记录" : "当前页没有数据"}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                          {record.short_code}
                        </code>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <Badge className={`${getTypeBadgeColor(record.pdf_type)} text-xs`}>
                          <span className="hidden sm:inline">{record.pdf_type_label}</span>
                          <span className="sm:hidden">{record.pdf_type_label.charAt(0)}</span>
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs sm:text-sm">
                          <div className="font-medium truncate max-w-[100px] sm:max-w-none" title={record.name || "-"}>
                            {record.name || "-"}
                          </div>
                          {record.username && (
                            <div className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-none" title={record.username}>
                              {record.username}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs sm:text-sm hidden md:table-cell whitespace-nowrap">
                        {formatDateTime(record.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs sm:text-sm">
                          <div className="whitespace-nowrap">{formatDateTime(record.expires_at)}</div>
                          {record.remaining_days !== null && !record.is_expired && (
                            <div className="text-xs text-muted-foreground mt-1">
                              剩{record.remaining_days}天
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span>{record.scan_count}</span>
                          </div>
                          {record.last_scanned_at && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                              {formatDateTime(record.last_scanned_at)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {getStatusBadge(record)}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(record)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              第 {currentPage} / {totalPages} 页，共 {filteredRecords.length} 条记录
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">上一页</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline mr-1">下一页</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

      </CardContent>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>修改二维码过期时间</DialogTitle>
            <DialogDescription>
              为短码 <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{selectedRecord?.short_code}</code> 设置新的过期时间
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiresAt">过期时间</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                请选择一个新的过期日期和时间
              </p>
            </div>
            
            {selectedRecord && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">当前过期时间：</span>
                  <span className="font-medium">{formatDateTime(selectedRecord.expires_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">扫码次数：</span>
                  <span className="font-medium">{selectedRecord.scan_count} 次</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">PDF类型：</span>
                  <Badge className={getTypeBadgeColor(selectedRecord.pdf_type)}>
                    {selectedRecord.pdf_type_label}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "确认更新"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PdfGenerationManager;
