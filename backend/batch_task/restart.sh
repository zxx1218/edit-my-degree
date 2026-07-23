#!/bin/bash

# ============================================================================
# 批量任务调度器重启脚本
# ============================================================================
# 功能: 使用PM2重启批量任务调度器
# 用法: ./restart.sh [environment]
# 示例: 
#   ./restart.sh              # 默认生产环境
#   ./restart.sh development  # 开发环境
# ============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROCESS_NAME="batch-task-scheduler"
ENVIRONMENT=${1:-production}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           批量任务调度器 - 重启脚本                      ║${NC}"
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

# 检查进程是否运行
if ! pm2 list | grep -q "$PROCESS_NAME"; then
    echo -e "${YELLOW}⚠️  提示: 批量任务调度器未在运行，将直接启动${NC}\n"
    ./start.sh $ENVIRONMENT
    exit $?
fi

echo -e "${YELLOW}🔄 正在重启批量任务调度器...${NC}"
echo -e "   环境: ${ENVIRONMENT}\n"

# 设置环境变量
export NODE_ENV=$ENVIRONMENT

# 重启PM2进程
pm2 restart $PROCESS_NAME

# 检查重启结果
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 批量任务调度器重启成功！${NC}\n"
    echo -e "${BLUE}📋 常用命令:${NC}"
    echo -e "   查看状态: pm2 status"
    echo -e "   查看日志: pm2 logs $PROCESS_NAME --lines 50"
    echo -e "   实时监控: pm2 monit\n"
    
    # 等待片刻后显示状态
    sleep 2
    pm2 list
else
    echo -e "\n${RED}❌ 重启失败，请检查日志${NC}"
    exit 1
fi
