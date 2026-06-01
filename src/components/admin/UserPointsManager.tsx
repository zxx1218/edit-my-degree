import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Minus, RotateCcw, LogIn, CreditCard, Loader2 } from "lucide-react";

interface UserPointsManagerProps {
  onAddLogins: (username: string, logins: number) => Promise<void>;
  onDecreaseLogins: (username: string, logins: number) => Promise<void>;
  onResetLogins: (username: string) => Promise<void>;
  onAddPdf: (username: string, amount: number) => Promise<void>;
  onDecreasePdf: (username: string, amount: number) => Promise<void>;
  onResetPdf: (username: string) => Promise<void>;
}

const UserPointsManager = ({
  onAddLogins,
  onDecreaseLogins,
  onResetLogins,
  onAddPdf,
  onDecreasePdf,
  onResetPdf,
}: UserPointsManagerProps) => {
  const [targetUsername, setTargetUsername] = useState("");
  const [addLogins, setAddLogins] = useState("");
  const [decreaseUsername, setDecreaseUsername] = useState("");
  const [decreaseLogins, setDecreaseLogins] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [pdfUsername, setPdfUsername] = useState("");
  const [pdfAmount, setPdfAmount] = useState("");
  const [decreasePdfUsername, setDecreasePdfUsername] = useState("");
  const [decreasePdfAmount, setDecreasePdfAmount] = useState("");
  const [resetPdfUsername, setResetPdfUsername] = useState("");
  const [isAddingLogins, setIsAddingLogins] = useState(false);
  const [isDecreasingLogins, setIsDecreasingLogins] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAddingPdf, setIsAddingPdf] = useState(false);
  const [isDecreasingPdf, setIsDecreasingPdf] = useState(false);
  const [isResettingPdf, setIsResettingPdf] = useState(false);

  const handleAddLogins = async () => {
    if (!targetUsername.trim()) return;
    const loginsToAdd = parseInt(addLogins);
    if (isNaN(loginsToAdd) || loginsToAdd <= 0) return;
    setIsAddingLogins(true);
    try {
      await onAddLogins(targetUsername, loginsToAdd);
      setTargetUsername("");
      setAddLogins("");
    } finally {
      setIsAddingLogins(false);
    }
  };

  const handleDecreaseLogins = async () => {
    if (!decreaseUsername.trim()) return;
    const loginsToDecrease = parseInt(decreaseLogins);
    if (isNaN(loginsToDecrease) || loginsToDecrease <= 0) return;
    setIsDecreasingLogins(true);
    try {
      await onDecreaseLogins(decreaseUsername, loginsToDecrease);
      setDecreaseUsername("");
      setDecreaseLogins("");
    } finally {
      setIsDecreasingLogins(false);
    }
  };

  const handleResetLogins = async () => {
    if (!resetUsername.trim()) return;
    setIsResetting(true);
    try {
      await onResetLogins(resetUsername);
      setResetUsername("");
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddPdf = async () => {
    if (!pdfUsername.trim()) return;
    const amountToAdd = parseInt(pdfAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;
    setIsAddingPdf(true);
    try {
      await onAddPdf(pdfUsername, amountToAdd);
      setPdfUsername("");
      setPdfAmount("");
    } finally {
      setIsAddingPdf(false);
    }
  };

  const handleDecreasePdf = async () => {
    if (!decreasePdfUsername.trim()) return;
    const amountToDecrease = parseInt(decreasePdfAmount);
    if (isNaN(amountToDecrease) || amountToDecrease <= 0) return;
    setIsDecreasingPdf(true);
    try {
      await onDecreasePdf(decreasePdfUsername, amountToDecrease);
      setDecreasePdfUsername("");
      setDecreasePdfAmount("");
    } finally {
      setIsDecreasingPdf(false);
    }
  };

  const handleResetPdf = async () => {
    if (!resetPdfUsername.trim()) return;
    setIsResettingPdf(true);
    try {
      await onResetPdf(resetPdfUsername);
      setResetPdfUsername("");
    } finally {
      setIsResettingPdf(false);
    }
  };

  return (
    <Card className="shadow-lg border-2 mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">用户积分管理</CardTitle>
        <CardDescription>管理用户登录次数与PDF积分</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
            <TabsTrigger value="login" className="text-base">
              <LogIn className="mr-2 h-4 w-4" />
              登录次数操作
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-base">
              <CreditCard className="mr-2 h-4 w-4" />
              PDF积分操作
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="add" className="text-sm">
                  <UserPlus className="mr-1 h-3 w-3" />
                  添加次数
                </TabsTrigger>
                <TabsTrigger value="decrease" className="text-sm">
                  <Minus className="mr-1 h-3 w-3" />
                  减少次数
                </TabsTrigger>
                <TabsTrigger value="reset" className="text-sm">
                  <RotateCcw className="mr-1 h-3 w-3" />
                  重置次数
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="mt-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    添加登录次数
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">为指定用户增加登录次数</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="target-username">用户名</Label>
                      <Input
                        id="target-username"
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-logins">添加登录次数</Label>
                      <Input
                        id="add-logins"
                        type="number"
                        min="1"
                        value={addLogins}
                        onChange={(e) => setAddLogins(e.target.value)}
                        placeholder="请输入要添加的次数"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleAddLogins}
                      disabled={isAddingLogins}
                      className="w-full h-11 text-base bg-green-600 hover:bg-green-700"
                    >
                      {isAddingLogins ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          添加中...
                        </>
                      ) : (
                        "确认添加"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="decrease" className="mt-4">
                <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Minus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    减少登录次数
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">为指定用户减少登录次数</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="decrease-username">用户名</Label>
                      <Input
                        id="decrease-username"
                        value={decreaseUsername}
                        onChange={(e) => setDecreaseUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decrease-logins">减少登录次数</Label>
                      <Input
                        id="decrease-logins"
                        type="number"
                        min="1"
                        value={decreaseLogins}
                        onChange={(e) => setDecreaseLogins(e.target.value)}
                        placeholder="请输入要减少的次数"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleDecreaseLogins}
                      disabled={isDecreasingLogins}
                      className="w-full h-11 text-base bg-orange-600 hover:bg-orange-700"
                    >
                      {isDecreasingLogins ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          减少中...
                        </>
                      ) : (
                        "确认减少"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reset" className="mt-4">
                <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
                    重置登录次数
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">将指定用户的登录次数重置为 0</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-username">用户名</Label>
                      <Input
                        id="reset-username"
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleResetLogins}
                      disabled={isResetting}
                      variant="destructive"
                      className="w-full h-11 text-base"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          重置中...
                        </>
                      ) : (
                        "确认重置为 0"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="pdf">
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="add" className="text-sm">
                  <UserPlus className="mr-1 h-3 w-3" />
                  添加积分
                </TabsTrigger>
                <TabsTrigger value="decrease" className="text-sm">
                  <Minus className="mr-1 h-3 w-3" />
                  减少积分
                </TabsTrigger>
                <TabsTrigger value="reset" className="text-sm">
                  <RotateCcw className="mr-1 h-3 w-3" />
                  重置积分
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="mt-4">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    添加PDF积分
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">为指定用户增加PDF积分</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdf-username">用户名</Label>
                      <Input
                        id="pdf-username"
                        value={pdfUsername}
                        onChange={(e) => setPdfUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdf-amount">添加积分数量</Label>
                      <Input
                        id="pdf-amount"
                        type="number"
                        min="1"
                        value={pdfAmount}
                        onChange={(e) => setPdfAmount(e.target.value)}
                        placeholder="请输入要添加的积分数量"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleAddPdf}
                      disabled={isAddingPdf}
                      className="w-full h-11 text-base bg-purple-600 hover:bg-purple-700"
                    >
                      {isAddingPdf ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          添加中...
                        </>
                      ) : (
                        "确认添加"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="decrease" className="mt-4">
                <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Minus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    减少PDF积分
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">为指定用户减少PDF积分</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="decrease-pdf-username">用户名</Label>
                      <Input
                        id="decrease-pdf-username"
                        value={decreasePdfUsername}
                        onChange={(e) => setDecreasePdfUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decrease-pdf-amount">减少积分数量</Label>
                      <Input
                        id="decrease-pdf-amount"
                        type="number"
                        min="1"
                        value={decreasePdfAmount}
                        onChange={(e) => setDecreasePdfAmount(e.target.value)}
                        placeholder="请输入要减少的积分数量"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleDecreasePdf}
                      disabled={isDecreasingPdf}
                      className="w-full h-11 text-base bg-orange-600 hover:bg-orange-700"
                    >
                      {isDecreasingPdf ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          减少中...
                        </>
                      ) : (
                        "确认减少"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reset" className="mt-4">
                <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
                    重置PDF积分
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">将指定用户的PDF积分重置为 0</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-pdf-username">用户名</Label>
                      <Input
                        id="reset-pdf-username"
                        value={resetPdfUsername}
                        onChange={(e) => setResetPdfUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={handleResetPdf}
                      disabled={isResettingPdf}
                      variant="destructive"
                      className="w-full h-11 text-base"
                    >
                      {isResettingPdf ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          重置中...
                        </>
                      ) : (
                        "确认重置为 0"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserPointsManager;
