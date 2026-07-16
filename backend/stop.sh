#!/bin/bash

# ============================================================================
# 后端服务停止脚本
# 功能: 使用PM2停止后端服务
# 使用方法: ./stop.sh
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
echo -e "${BLUE}   后端服务停止脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ 错误: PM2 未安装${NC}"
    exit 1
fi

# 检查应用是否在运行
if ! pm2 list | grep -q "edit_my_degree_backend"; then
    echo -e "${YELLOW}⚠️  后端服务未在运行${NC}"
    exit 0
fi

# 确认停止
echo -e "${YELLOW}⚠️  即将停止后端服务...${NC}"
echo ""

# 停止应用
pm2 stop edit_my_degree_backend

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 后端服务已停止${NC}"
    echo ""
    echo -e "${BLUE}📊 当前进程状态:${NC}"
    pm2 list
    echo ""
else
    echo -e "${RED}❌ 停止失败${NC}"
    exit 1
fi
