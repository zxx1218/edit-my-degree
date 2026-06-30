# Banner图片每日自动轮换说明

## 功能介绍
Index页面顶部的banner图片会根据每天0:00自动更换，从`public/banner_img/`目录中选择不同的图片显示。

## 使用步骤

### 1. 准备图片
将banner图片放入 `public/banner_img/` 目录，并按照以下格式命名：
- `banner_0.png` (或 .jpg)
- `banner_1.png`
- `banner_2.png`
- ...以此类推

**建议：**
- 图片尺寸：2649px × 599px（与原有banner保持一致）
- 图片格式：PNG 或 JPG
- 图片数量：建议3-7张，形成一周的轮换周期

### 2. 配置图片总数
打开 `src/lib/utils.ts` 文件，找到 `getTotalBannerImages()` 函数，修改返回值为实际图片数量：

```typescript
export const getTotalBannerImages = (): number => {
  // 根据实际放入banner_img目录的图片数量修改此值
  return 5; // 例如：如果有5张图片，就返回5
};
```

### 3. 重启开发服务器
修改配置后，需要重启开发服务器使更改生效：
```bash
npm run dev
```

## 工作原理

1. **轮换算法**：使用当前日期计算应该显示哪张图片
   - 计算公式：`天数 % 图片总数 = 图片索引`
   - 例如：如果有5张图片，第1天显示banner_0，第2天显示banner_1，...，第6天又回到banner_0

2. **自动更新**：每天0:00后，页面刷新会自动显示新的banner图片

3. **容错机制**：
   - 如果banner_img目录为空，会显示默认的 `/certification-banner.png`
   - 如果某张图片加载失败，也会回退到默认图片

## 示例

假设你有5张banner图片：
- banner_0.png - 周一显示
- banner_1.png - 周二显示
- banner_2.png - 周三显示
- banner_3.png - 周四显示
- banner_4.png - 周五显示

周末会继续循环：
- 周六显示 banner_0.png
- 周日显示 banner_1.png
- 下周一又显示 banner_2.png
- ...以此类推

## 注意事项

1. 图片命名必须严格按照 `banner_数字.扩展名` 的格式
2. 修改图片数量后，务必更新 `getTotalBannerImages()` 函数的返回值
3. 所有图片建议使用相同的尺寸和格式，以保持页面视觉效果一致
