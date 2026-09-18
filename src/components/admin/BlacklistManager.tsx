import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, UserX, RotateCcw } from "lucide-react";
import IpBlacklistManager from "./IpBlacklistManager";
import UserBlacklistManager from "./UserBlacklistManager";

interface BlacklistManagerProps {
  token: string | null;
}

const BlacklistManager = ({ token }: BlacklistManagerProps) => {
  const [activeTab, setActiveTab] = useState("ip");

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-red-600" />
              黑名单管理
            </CardTitle>
            <CardDescription>管理IP黑名单和用户账号黑名单</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 mb-6">
            <TabsTrigger value="ip" className="text-sm">
              <Shield className="mr-1 h-4 w-4" />
              IP黑名单
            </TabsTrigger>
            <TabsTrigger value="user" className="text-sm">
              <UserX className="mr-1 h-4 w-4" />
              用户黑名单
            </TabsTrigger>
          </TabsList>

          {/* IP黑名单分栏 */}
          <TabsContent value="ip" className="mt-0">
            <IpBlacklistManager token={token} />
          </TabsContent>

          {/* 用户黑名单分栏 */}
          <TabsContent value="user" className="mt-0">
            <UserBlacklistManager token={token} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BlacklistManager;
