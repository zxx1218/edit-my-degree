#!/bin/bash

# ============================================================================
# 后端服务启动脚本
# 功能: 使用PM2启动后端服务
# 使用方法: ./start.sh [development|production]
# 默认环境: production
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

# 环境参数（默认为production）
ENV=${1:-production}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   后端服务启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: Node.js 未安装${NC}"
    exit 1
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ 错误: PM2 未安装${NC}"
    echo -e "${YELLOW}💡 提示: 请运行 'npm install -g pm2' 安装PM2${NC}"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  检测到未安装依赖，正在安装...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
    echo ""
fi

# 检查应用是否已经在运行
if pm2 list | grep -q "edit_my_degree_backend.*online"; then
    echo -e "${YELLOW}⚠️  后端服务已在运行中${NC}"
    echo -e "${YELLOW}💡 如需重启，请使用: ./restart.sh${NC}"
    echo ""
    pm2 list
    exit 0
fi

# 启动应用
echo -e "${GREEN}🚀 正在启动后端服务 (环境: ${ENV})...${NC}"
echo ""

if [ "$ENV" == "development" ]; then
    pm2 start ecosystem.config.js --env development
else
    pm2 start ecosystem.config.js --env production
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 后端服务启动成功！${NC}"
    echo ""
    echo -e "${BLUE}📊 服务状态:${NC}"
    pm2 list
    echo ""
    echo -e "${BLUE}📝 常用命令:${NC}"
    echo -e "  查看日志:     ${YELLOW}pm2 logs edit_my_degree_backend${NC}"
    echo -e "  监控状态:     ${YELLOW}pm2 monit${NC}"
    echo -e "  停止服务:     ${YELLOW}./stop.sh${NC}"
    echo -e "  重启服务:     ${YELLOW}./restart.sh${NC}"
    echo ""
    
    # 提示保存进程列表
    if ! pm2 saved &> /dev/null; then
        echo -e "${YELLOW}💡 提示: 如需开机自启，请运行:${NC}"
        echo -e "  ${YELLOW}pm2 save${NC}"
        echo -e "  ${YELLOW}pm2 startup systemd -u \$USER --hp /home/\$USER${NC}"
        echo ""
    fi
else
    echo -e "${RED}❌ 启动失败，请检查日志${NC}"
    pm2 logs edit_my_degree_backend --lines 20
    exit 1
fi
