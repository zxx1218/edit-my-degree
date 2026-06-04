# 已移除的功能说明

## 异常登录检测功能（已移除）

以下文件与异常登录检测功能相关，已从项目中移除：

### 后端文件
- `backend/src/get-anomaly-login-detection.js` - 异常登录检测接口实现

### 前端文件
- `src/components/admin/AnomalyDetection.tsx` - 异常登录检测UI组件

### 移除原因
该功能不再需要，已从前后端完全移除。

### 影响范围
- 后端路由 `backend/src/routes/index.js` 中已移除相关接口注册
- 前端API `src/lib/adminApi.ts` 中已移除 `getAnomalyLoginDetection` 函数
- 主页面 `src/pages/SuperAdd.tsx` 中已移除相关状态和组件引用
- 组件索引 `src/components/admin/index.ts` 中已移除导出

---

最后更新时间：2026-06-04
