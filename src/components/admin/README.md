# 管理端组件拆分说明

## 概述

为了提升代码的可维护性和可读性，已将原本庞大的 `SuperAdd.tsx`（约1800+行）拆分为多个独立的组件。

## 目录结构

```
src/
├── pages/
│   └── SuperAdd.tsx - 主页面，负责组合所有子组件
└── components/
    └── admin/
        ├── index.ts - 组件导出索引
        ├── AdminLogin.tsx - 管理员登录验证组件
        ├── LoginStatsCard.tsx - 今日登录统计卡片
        ├── CardManager.tsx - 充值卡管理组件
        ├── UserList.tsx - 用户列表组件
        ├── StatsDashboard.tsx - 用户统计分析（热力图+登录统计+Top用户）
        ├── MessageList.tsx - 留言管理组件
        ├── TodayLoginList.tsx - 今日登录列表组件
        └── ProvinceMap.tsx - 省份登录分布地图组件
```

## 组件说明

### 1. AdminLogin.tsx
- **功能**: 管理员登录验证
- **Props**: 
  - `onVerify`: 验证成功后的回调函数

### 2. LoginStatsCard.tsx
- **功能**: 显示今日登录统计数据
- **Props**:
  - `todayLoginCount`: 今日登录次数
  - `distinctUsers`: 独立用户数
  - `isLoading`: 加载状态
  - `onRefresh`: 刷新数据的回调

### 3. CardManager.tsx
- **功能**: 充值卡的创建、查看和管理
- **Props**:
  - `cards`: 充值卡列表
  - `isFetchingCards`: 加载状态
  - `onFetchCards`: 获取充值卡列表的回调
  - `onCreateCards`: 创建充值卡的回调
  - `onCopyToClipboard`: 复制到剪贴板的回调
  - `copiedId`: 已复制的卡片ID

### 4. UserList.tsx
- **功能**: 显示用户列表，支持搜索、改密、删除、积分管理
- **Props**:
  - `users`: 用户列表
  - `searchQuery`: 搜索关键词
  - `onSearchChange`: 搜索关键词变化的回调
  - `isFetchingUsers`: 加载状态
  - `onFetchUsers`: 获取用户列表的回调
  - `onChangePassword`: 修改密码的回调
  - `onDeleteUser`: 删除用户的回调
  - `onAddLogins`: 添加登录次数的回调
  - `onDecreaseLogins`: 减少登录次数的回调
  - `onResetLogins`: 重置登录次数的回调
  - `onAddPdf`: 添加PDF积分的回调
  - `onDecreasePdf`: 减少PDF积分的回调
  - `onResetPdf`: 重置PDF积分的回调

### 5. StatsDashboard.tsx
- **功能**: 集成用户活跃度热力图、登录统计图表和Top活跃用户排行榜，使用Tab分栏展示
- **Props**:
  - `heatmapData`: 热力图数据
  - `isLoadingHeatmap`: 热力图加载状态
  - `onRefreshHeatmap`: 刷新热力图的回调
  - `hourlyStats`: 每小时统计数据
  - `dailyStats`: 每日统计数据
  - `rangeSummary`: 范围统计摘要
  - `isLoadingHourly`: 小时数据加载状态
  - `isLoadingRange`: 范围数据加载状态
  - `selectedDate`: 选中的日期
  - `statsViewMode`: 视图模式（day/week/month）
  - `onDateChange`: 日期变化的回调
  - `onViewModeChange`: 视图模式变化的回调
  - `onRefreshChart`: 刷新图表的回调
  - `topUsers`: Top活跃用户列表
  - `isLoadingTopUsers`: Top用户加载状态
  - `topUsersPeriod`: 统计周期（天数）
  - `onTopUsersPeriodChange`: 周期变化的回调
  - `onRefreshTopUsers`: 刷新Top用户的回调

### 6. MessageList.tsx
- **功能**: 留言管理组件
- **Props**:
  - `token`: 管理员认证token

### 8. TodayLoginList.tsx
- **功能**: 显示今日登录用户列表
- **Props**:
  - `loginDetails`: 登录详情列表
  - `isLoading`: 加载状态
  - `onRefresh`: 刷新数据的回调

### 9. ProvinceMap.tsx
- **功能**: 省份登录分布地图组件
- **Props**:
  - `token`: 管理员认证token

## 优势

1. **代码可维护性**: 每个组件职责单一，易于理解和修改
2. **代码复用性**: 组件可以在其他地方独立使用
3. **测试友好**: 可以单独测试每个组件
4. **性能优化**: 可以针对单个组件进行性能优化
5. **团队协作**: 不同开发者可以同时处理不同的组件

## 使用方法

主页面 `SuperAdd.tsx` 通过导入这些组件并传递相应的 props 来组合整个管理界面：

```typescript
import {
  AdminLogin,
  LoginStatsCard,
  StatsDashboard,
  // ... 其他组件
} from "@/components/admin";

// 在 JSX 中使用
<LoginStatsCard
  todayLoginCount={todayLoginCount}
  distinctUsers={distinctUsers}
  isLoading={isLoadingLoginCount}
  onRefresh={fetchTodayLoginCount}
/>
```

## 注意事项

- 所有组件都位于 `src/components/admin/` 目录下
- 通过 `index.ts` 统一导出，方便导入使用
- 组件之间通过 props 进行通信，保持单向数据流
- 状态管理和数据获取逻辑保留在主页面 `SuperAdd.tsx` 中

---

# 管理员组件

本目录包含用于管理员后台的各种组件。

## 组件列表

### AdminLogin
管理员登录组件，提供身份验证功能。

### LoginStatsCard
显示今日登录统计信息的卡片组件。

### CardManager
充值卡管理组件，用于创建和管理充值卡。

### UserList
用户列表组件，显示所有用户信息并支持搜索、改密、删除、积分管理。

### StatsDashboard
用户统计分析组件，集成活跃度热力图、登录统计图表和Top活跃用户排行榜，使用Tab分栏展示。

### MessageList
留言管理组件，用于查看和管理用户留言。

### TodayLoginList
今日登录详情组件，显示今天所有用户的登录记录。

### ProvinceMap
省份登录分布地图组件，使用中国地图展示各省份用户登录次数的热力图分布。

#### 功能特性
- 🗺️ 交互式中国地图，支持缩放和拖拽
- 🎨 渐变色热力图，登录次数越多颜色越深
- 📊 实时统计摘要（覆盖省份数、总登录次数）
- 🏆 Top 10 活跃省份排行榜
- 🔄 一键刷新数据
- ⏱️ 显示近1年的统计数据

#### 技术实现
- 使用 ECharts 渲染地图
- 从阿里云 DataV 获取中国地图 GeoJSON 数据
- 后端通过 IP 地理位置查询聚合省份数据
- 前端异步加载地图数据和统计数据

#### 使用方法
```tsx
import { ProvinceMap } from "@/components/admin";

<ProvinceMap token={adminToken} />
```
