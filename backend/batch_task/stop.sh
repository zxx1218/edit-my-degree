#!/bin/bash

# ============================================================================
# 批量任务调度器停止脚本
# ============================================================================
# 功能: 使用PM2停止批量任务调度器
# 用法: ./stop.sh
# ============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROCESS_NAME="batch-task-scheduler"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           批量任务调度器 - 停止脚本                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}\n"

# 检查是否在正确的目录
if [ ! -f "scheduler.js" ]; then
    echo -e "${RED}❌ 错误: 请在 backend/batch_task 目录下运行此脚本${NC}"
    exit 1
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ 错误: PM2 未安装${NC}"
    exit 1
fi

# 检查进程是否运行（包括stopped状态）
if ! pm2 list | grep -q "$PROCESS_NAME"; then
    echo -e "${YELLOW}⚠️  提示: 批量任务调度器未在运行${NC}\n"
    pm2 list
    exit 0
fi

echo -e "${YELLOW}🛑 正在停止批量任务调度器...${NC}\n"

# 停止PM2进程
pm2 stop $PROCESS_NAME

# 检查停止结果
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 批量任务调度器已停止${NC}\n"
    
    # 显示当前状态
    pm2 list
else
    echo -e "\n${RED}❌ 停止失败，请手动检查${NC}"
    exit 1
fi
