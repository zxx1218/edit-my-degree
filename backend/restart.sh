#!/bin/bash

# ============================================================================
# 后端服务重启脚本
# 功能: 使用PM2重启后端服务
# 使用方法: ./restart.sh [development|production]
# 默认环境: production（保持当前运行环境）
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

# 环境参数
ENV=${1:-}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   后端服务重启脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ 错误: PM2 未安装${NC}"
    exit 1
fi

# 检查应用是否在运行
if ! pm2 list | grep -q "edit_my_degree_backend"; then
    echo -e "${YELLOW}⚠️  后端服务未在运行，正在启动...${NC}"
    echo ""
    
    if [ -n "$ENV" ]; then
        ./start.sh "$ENV"
    else
        ./start.sh
    fi
    exit $?
fi

# 检测当前运行环境
CURRENT_ENV="production"
if pm2 show edit_my_degree_backend | grep -q "NODE_ENV.*development"; then
    CURRENT_ENV="development"
fi

# 如果指定了环境参数，使用指定的；否则保持当前环境
if [ -n "$ENV" ]; then
    TARGET_ENV="$ENV"
else
    TARGET_ENV="$CURRENT_ENV"
fi

echo -e "${YELLOW}🔄 当前环境: ${CURRENT_ENV}${NC}"
echo -e "${YELLOW}🔄 目标环境: ${TARGET_ENV}${NC}"
echo ""

# 如果环境改变，需要先停止再启动
if [ "$CURRENT_ENV" != "$TARGET_ENV" ]; then
    echo -e "${YELLOW}⚠️  环境已改变，将先停止再启动...${NC}"
    echo ""
    
    # 停止服务
    pm2 stop edit_my_degree_backend
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 停止失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 服务已停止${NC}"
    echo ""
    
    # 启动服务
    if [ "$TARGET_ENV" == "development" ]; then
        pm2 start ecosystem.config.js --env development
    else
        pm2 start ecosystem.config.js --env production
    fi
else
    # 环境未改变，直接重启
    echo -e "${GREEN}🔄 正在重启后端服务...${NC}"
    echo ""
    
    pm2 restart edit_my_degree_backend
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 后端服务重启成功！${NC}"
    echo ""
    echo -e "${BLUE}📊 服务状态:${NC}"
    pm2 list
    echo ""
    echo -e "${BLUE}📝 常用命令:${NC}"
    echo -e "  查看日志:     ${YELLOW}pm2 logs edit_my_degree_backend${NC}"
    echo -e "  监控状态:     ${YELLOW}pm2 monit${NC}"
    echo -e "  停止服务:     ${YELLOW}./stop.sh${NC}"
    echo -e "  启动服务:     ${YELLOW}./start.sh${NC}"
    echo ""
else
    echo -e "${RED}❌ 重启失败，请检查日志${NC}"
    pm2 logs edit_my_degree_backend --lines 20
    exit 1
fi
