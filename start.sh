#!/usr/bin/env bash
# AI志愿师 一键启动脚本 (Ubuntu)
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── 依赖检查 ──────────────────────────────────────────────────
info "检查运行环境..."

command -v python3 >/dev/null 2>&1 || error "未找到 python3，请先安装：sudo apt install python3 python3-pip python3-venv"
command -v node   >/dev/null 2>&1 || error "未找到 node，请先安装：https://nodejs.org 或 sudo apt install nodejs npm"
command -v npm    >/dev/null 2>&1 || error "未找到 npm，请先安装：sudo apt install npm"

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
NODE_VERSION=$(node -v)
info "Python $PYTHON_VERSION | Node $NODE_VERSION"

# ── 环境变量 ──────────────────────────────────────────────────
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    cp "$BACKEND_DIR/.env.example" "$ENV_FILE"
    warn ".env 文件已从 .env.example 创建，请填写 ANTHROPIC_API_KEY 后重新运行。"
    warn "编辑命令：nano $ENV_FILE"
    exit 1
fi

if grep -q "your_api_key_here" "$ENV_FILE"; then
    warn "检测到 .env 中 ANTHROPIC_API_KEY 尚未填写，请编辑：nano $ENV_FILE"
    read -rp "是否仍要继续启动？(y/N) " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 1
fi

# ── 后端初始化 ────────────────────────────────────────────────
info "初始化后端 Python 虚拟环境..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    info "虚拟环境已创建"
fi

source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
info "后端依赖安装完成"

# ── 前端初始化 ────────────────────────────────────────────────
info "初始化前端依赖..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    npm install --silent
    info "前端依赖安装完成"
else
    info "前端 node_modules 已存在，跳过安装"
fi

# ── 启动后端 (后台) ───────────────────────────────────────────
info "启动后端服务（端口 8000）..."
cd "$BACKEND_DIR"
source venv/bin/activate

BACKEND_LOG="$PROJECT_DIR/backend.log"
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload \
    > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"
info "后端 PID: $BACKEND_PID  日志: $BACKEND_LOG"

# 等待后端就绪
info "等待后端启动..."
for i in $(seq 1 15); do
    if curl -sf http://localhost:8000/ >/dev/null 2>&1; then
        info "后端已就绪 ✓"
        break
    fi
    sleep 1
    if [ $i -eq 15 ]; then
        warn "后端 15s 内未响应，请检查日志：tail -f $BACKEND_LOG"
    fi
done

# ── 启动前端 (前台) ───────────────────────────────────────────
info "启动前端服务（端口 3000）..."
cd "$FRONTEND_DIR"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  AI志愿师 启动成功！${NC}"
echo -e "${GREEN}  前端地址：http://localhost:3000${NC}"
echo -e "${GREEN}  后端地址：http://localhost:8000${NC}"
echo -e "${GREEN}  API 文档：http://localhost:8000/docs${NC}"
echo -e "${GREEN}  按 Ctrl+C 可停止前端（后端会继续运行）${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

# 捕获 Ctrl+C，顺手停掉后端
trap 'info "正在关闭后端..."; kill $BACKEND_PID 2>/dev/null; rm -f "$PROJECT_DIR/.backend.pid"; exit 0' INT TERM

npm run dev
