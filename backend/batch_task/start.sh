#!/bin/bash

# ============================================================================
# 批量任务调度器启动脚本
# ============================================================================
# 功能: 使用PM2启动批量任务调度器
# 用法: ./start.sh [environment]
# 示例: 
#   ./start.sh              # 默认生产环境
#   ./start.sh development  # 开发环境
# ============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROCESS_NAME="batch-task-scheduler"
SCRIPT_PATH="./scheduler.js"
ENVIRONMENT=${1:-production}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           批量任务调度器 - 启动脚本                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}\n"

# 检查是否在正确的目录
if [ ! -f "scheduler.js" ]; then
    echo -e "${RED}❌ 错误: 请在 backend/batch_task 目录下运行此脚本${NC}"
    exit 1
fi

# 检查是否已运行（仅检查online状态的进程）
if pm2 list | grep "$PROCESS_NAME" | grep -q "online"; then
    echo -e "${YELLOW}⚠️  警告: 批量任务调度器已在运行中${NC}"
    echo -e "${YELLOW}   如需重启，请使用: ./restart.sh${NC}\n"
    pm2 list
    exit 0
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: Node.js 未安装${NC}"
    exit 1
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ 错误: PM2 未安装${NC}"
    echo -e "${YELLOW}💡 提示: 运行 npm install -g pm2 安装PM2${NC}"
    exit 1
fi

# 检查依赖是否安装（检查父目录backend的node_modules）
if [ ! -d "../node_modules/node-cron" ]; then
    echo -e "${YELLOW}⚠️  检测到未安装依赖，正在安装...${NC}"
    cd .. && npm install node-cron
    cd batch_task
    echo -e "${GREEN}✅ 依赖安装完成${NC}\n"
fi

echo -e "${GREEN}🚀 正在启动批量任务调度器...${NC}"
echo -e "   环境: ${ENVIRONMENT}"
echo -e "   脚本: ${SCRIPT_PATH}\n"

# 设置环境变量
export NODE_ENV=$ENVIRONMENT

# 使用PM2启动
pm2 start $SCRIPT_PATH \
    --name $PROCESS_NAME \
    --instances 1 \
    --log-date-format "YYYY-MM-DD HH:mm:ss" \
    --merge-logs \
    --output "./logs/out.log" \
    --error "./logs/error.log"

# 检查启动结果
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 批量任务调度器启动成功！${NC}\n"
    echo -e "${BLUE}📋 常用命令:${NC}"
    echo -e "   查看状态: pm2 status"
    echo -e "   查看日志: pm2 logs $PROCESS_NAME"
    echo -e "   停止服务: ./stop.sh"
    echo -e "   重启服务: ./restart.sh"
    echo -e "   监控面板: pm2 monit\n"
    
    # 保存PM2进程列表
    pm2 save
    
    # 显示进程信息
    sleep 2
    pm2 list
else
    echo -e "\n${RED}❌ 启动失败，请检查日志${NC}"
    exit 1
fi
