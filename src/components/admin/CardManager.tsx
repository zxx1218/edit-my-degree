import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserPlus, List, Loader2, Ticket, Copy, Check, Download, ChevronLeft, ChevronRight, Search, Gift } from "lucide-react";

interface CardItem {
  id: string;
  type: string;
  values: number;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

interface CardManagerProps {
  cards: CardItem[];
  isFetchingCards: boolean;
  onFetchCards: () => void;
  onCreateCards: (type: string, values: number, count: number) => Promise<void>;
  onCopyToClipboard: (text: string) => void;
  copiedId: string | null;
}

const CARDS_PER_PAGE = 10;

const CardManager = ({
  cards,
  isFetchingCards,
  onFetchCards,
  onCreateCards,
  onCopyToClipboard,
  copiedId,
}: CardManagerProps) => {
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardCurrentPage, setCardCurrentPage] = useState(1);
  const [newCardType, setNewCardType] = useState<string>("login");
  const [newCardValues, setNewCardValues] = useState("");
  const [newCardCount, setNewCardCount] = useState("");
  const [isCreatingCards, setIsCreatingCards] = useState(false);
  const [exportCardType, setExportCardType] = useState<string>("all");

  const filteredCards = useMemo(() => {
    if (!cardSearchQuery.trim()) return cards;
    return cards.filter(
      (card) =>
        card.id.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
        card.used_by?.toLowerCase().includes(cardSearchQuery.toLowerCase()),
    );
  }, [cards, cardSearchQuery]);

  const cardTotalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);

  const paginatedCards = useMemo(() => {
    const startIndex = (cardCurrentPage - 1) * CARDS_PER_PAGE;
    return filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [filteredCards, cardCurrentPage]);

  const handleCreateCards = async () => {
    const values = parseInt(newCardValues);
    const count = parseInt(newCardCount);
    if (!newCardType) return;
    if (isNaN(values) || values <= 0) return;
    if (isNaN(count) || count <= 0 || count > 200) return;

    setIsCreatingCards(true);
    try {
      await onCreateCards(newCardType, values, count);
      setNewCardValues("");
      setNewCardCount("");
    } finally {
      setIsCreatingCards(false);
    }
  };

  const exportCardsToCSV = (exportAll: boolean = true) => {
    let cardsToExport = cards;

    // 根据使用状态筛选
    if (!exportAll) {
      cardsToExport = cardsToExport.filter((c) => !c.used);
    }

    // 根据卡种类型筛选
    if (exportCardType !== "all") {
      cardsToExport = cardsToExport.filter((c) => c.type === exportCardType);
    }

    if (cardsToExport.length === 0) {
      alert("没有符合条件的充值卡可导出");
      return;
    }

    const headers = ["卡密ID", "类型", "充值数量", "状态", "使用者", "使用时间", "创建时间"];
    const csvContent = [
      headers.join(","),
      ...cardsToExport.map((card) =>
        [
          card.id,
          card.type === "login" ? "登录次数" : "PDF积分",
          card.values,
          card.used ? "已使用" : "未使用",
          card.used_by || "",
          card.used_at || "",
          card.created_at || "",
        ].join(","),
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const typeLabel = exportCardType === "all" ? "全部类型" : exportCardType === "login" ? "登录卡" : "PDF卡";
    const statusLabel = exportAll ? "全部" : "未使用";
    link.download = `充值卡_${typeLabel}_${statusLabel}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Ticket className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-xl">充值卡管理</CardTitle>
              <CardDescription>创建和查看充值卡</CardDescription>
            </div>
          </div>
          <Button onClick={onFetchCards} variant="outline" size="sm" className="border-2" disabled={isFetchingCards}>
            {isFetchingCards ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <List className="h-4 w-4 mr-2" />
            )}
            刷新列表
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="create" className="text-base">
              <UserPlus className="mr-2 h-4 w-4" />
              批量创建
            </TabsTrigger>
            <TabsTrigger value="list" className="text-base">
              <List className="mr-2 h-4 w-4" />
              查看列表
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-6">
            <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-lg border-2 border-teal-200 dark:border-teal-800">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                批量创建充值卡
              </h3>
              <p className="text-sm text-muted-foreground mb-4">批量生成充值卡密（最多200张）</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>卡类型</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewCardType("login")}
                      className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                        newCardType === "login"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-[1.02] ring-2 ring-blue-300 dark:ring-blue-700"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                      }`}
                    >
                      {newCardType === "login" && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                      <div className="flex items-center justify-center gap-1.5">
                        <span>登录次数卡</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCardType("pdf")}
                      className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                        newCardType === "pdf"
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md scale-[1.02] ring-2 ring-emerald-300 dark:ring-emerald-700"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm"
                      }`}
                    >
                      {newCardType === "pdf" && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                      <div className="flex items-center justify-center gap-1.5">
                        <span>PDF积分卡</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-values">充值数量（每张卡）</Label>
                  <Input
                    id="card-values"
                    type="number"
                    min="1"
                    value={newCardValues}
                    onChange={(e) => setNewCardValues(e.target.value)}
                    placeholder="请输入每张卡的充值数量"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-count">生成张数</Label>
                  <Input
                    id="card-count"
                    type="number"
                    min="1"
                    max="200"
                    value={newCardCount}
                    onChange={(e) => setNewCardCount(e.target.value)}
                    placeholder="请输入要生成的张数（1-200）"
                    className="h-10"
                  />
                </div>
                <Button
                  onClick={handleCreateCards}
                  disabled={isCreatingCards}
                  className="w-full h-11 text-base bg-teal-600 hover:bg-teal-700"
                >
                  {isCreatingCards ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    "确认创建"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4 mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                placeholder="搜索卡密ID或使用者..."
                className="pl-10 h-10"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800 text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{cards.length}</div>
                <div className="text-xs text-muted-foreground">总数</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {cards.filter((c) => !c.used).length}
                </div>
                <div className="text-xs text-muted-foreground">未使用</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800 text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {cards.filter((c) => c.used).length}
                </div>
                <div className="text-xs text-muted-foreground">已使用</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>导出卡种类型</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportCardType("all")}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                      exportCardType === "all"
                        ? "bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-md scale-105 ring-2 ring-slate-400 dark:ring-slate-600"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    全部类型
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportCardType("login")}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                      exportCardType === "login"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-105 ring-2 ring-blue-300 dark:ring-blue-700"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    登录次数卡
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportCardType("pdf")}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                      exportCardType === "pdf"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md scale-105 ring-2 ring-emerald-300 dark:ring-emerald-700"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700"
                    }`}
                  >
                    PDF积分卡
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => exportCardsToCSV(true)} variant="outline" size="sm" className="flex-1 border-2">
                  <Download className="h-4 w-4 mr-2" />
                  导出全部CSV
                </Button>
                <Button onClick={() => exportCardsToCSV(false)} variant="outline" size="sm" className="flex-1 border-2">
                  <Download className="h-4 w-4 mr-2" />
                  导出未使用CSV
                </Button>
              </div>
            </div>

            {isFetchingCards ? (
              <div className="border-2 rounded-lg p-8 bg-muted/50 animate-pulse">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">正在加载充值卡列表...</p>
                </div>
              </div>
            ) : paginatedCards.length > 0 ? (
              <div className="border-2 rounded-lg p-3 max-h-96 overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
                <div className="space-y-2">
                  {paginatedCards.map((card, index) => (
                    <div
                      key={card.id}
                      className={`flex justify-between items-center p-4 rounded-lg hover:shadow-lg transition-all border-2 animate-scale-in ${
                        card.used
                          ? "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-300 dark:border-gray-700"
                          : "bg-gradient-to-r from-background to-muted/20 border-border/50 hover:border-teal-300"
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate">{card.id}</span>
                          {card.values === 9999999 && (
                            <Gift className="h-4 w-4 text-pink-500 animate-pulse" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onCopyToClipboard(card.id)}
                          >
                            {copiedId === card.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{card.type === "login" ? "登录次数" : "PDF积分"}</span>
                          <span>·</span>
                          <span>{card.values} 点</span>
                          {card.used && card.used_by && (
                            <>
                              <span>·</span>
                              <span>使用者: {card.used_by}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={card.used ? "secondary" : "default"}
                        className={card.used ? "" : "bg-teal-600"}
                      >
                        {card.used ? "已使用" : "未使用"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 rounded-lg">
                {cardSearchQuery ? "未找到匹配的充值卡" : "暂无充值卡数据"}
              </div>
            )}

            {cardTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  第 {cardCurrentPage} / {cardTotalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCardCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={cardCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCardCurrentPage((p) => Math.min(cardTotalPages, p + 1))}
                    disabled={cardCurrentPage === cardTotalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CardManager;
