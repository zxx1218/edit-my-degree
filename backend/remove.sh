#!/bin/bash

# ============================================================================
# 后端服务删除脚本
# 功能: 从PM2中删除后端服务进程（不可恢复）
# 使用方法: ./remove.sh
# ============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   后端服务删除脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ 错误: PM2 未安装${NC}"
    exit 1
fi

# 检查应用是否存在
if ! pm2 list | grep -q "edit_my_degree_backend"; then
    echo -e "${YELLOW}⚠️  后端服务不存在于PM2列表中${NC}"
    exit 0
fi

# 显示当前应用状态
echo -e "${BLUE}📊 当前应用状态:${NC}"
pm2 list | grep "edit_my_degree_backend"
echo ""

# 警告信息
echo -e "${RED}⚠️  警告: 此操作将从PM2中永久删除应用配置${NC}"
echo -e "${RED}⚠️  注意: 删除后需要重新使用 start.sh 启动服务${NC}"
echo ""

# 二次确认
read -p "$(echo -e "${YELLOW}确定要删除该应用吗？(yes/no): ${NC}")" confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ 操作已取消${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}正在删除应用...${NC}"

# 删除应用
pm2 delete edit_my_degree_backend

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 应用已从PM2中删除${NC}"
    echo ""
    echo -e "${BLUE}📊 当前进程列表:${NC}"
    pm2 list
    echo ""
    echo -e "${BLUE}💡 提示: 如需重新启动，请运行 ./start.sh${NC}"
else
    echo -e "${RED}❌ 删除失败${NC}"
    exit 1
fi
