# 教育背景页面组件

本目录包含教育背景页面（EducationBackground）的所有子组件，用于展示学籍、学历、学位和考研信息。

## 组件列表

### 1. StudentStatusCard.tsx
**学籍信息卡片组件**

展示学生的学籍详细信息，包括：
- 录取照片和学历照片
- 个人基本信息（姓名、性别、出生日期等）
- 学校和专业信息
- 学籍状态和日期信息

**Props:**
```typescript
interface StudentStatusCardProps {
  record: StudentStatusRecord;
}
```

### 2. EducationInfoCard.tsx
**学历信息卡片组件**

展示学历详细信息，包括：
- 学历照片
- 个人基本信息
- 入学和毕业日期
- 学校、专业、层次信息
- 证书编号

**Props:**
```typescript
interface EducationInfoCardProps {
  record: EducationRecord;
}
```

### 3. DegreeInfoCard.tsx
**学位信息卡片组件**

展示学位授予信息，包括：
- 学位照片
- 个人基本信息
- 学位授予单位和日期
- 所授学位类型
- 学位证书编号

**Props:**
```typescript
interface DegreeInfoCardProps {
  record: DegreeRecord;
}
```

### 4. ExamInfoCard.tsx
**考研信息卡片组件**

展示考研相关信息，包括：
- 考生照片
- 报考信息（报考点、考试方式、报名号等）
- 成绩信息（各科成绩和总分）
- 录取信息（录取单位和專業）

**Props:**
```typescript
interface ExamInfoCardProps {
  record: ExamRecord;
}
```

### 5. RecommendationCard.tsx
**右侧推荐卡片组件**

展示专业推荐和满意度评价功能，包括：
- 专业推荐模块
- 专业满意度评价
- 院校满意度评价
- 毕业论文查重入口

**Props:**
```typescript
interface RecommendationCardProps {
  index: number;
}
```

### 6. JobRecommendationCard.tsx
**职位推荐卡片组件**

展示求职职位推荐，包括：
- 职位标题
- 薪资范围
- 学历要求

**Props:**
```typescript
interface JobRecommendationCardProps {
  jobs?: JobItem[];
}
```

## 使用示例

```typescript
import { 
  StudentStatusCard, 
  EducationInfoCard, 
  DegreeInfoCard, 
  ExamInfoCard,
  RecommendationCard,
  JobRecommendationCard
} from "@/components/educationBackground_comp";

// 在页面中使用
<StudentStatusCard record={studentStatusRecord} />
<EducationInfoCard record={educationRecord} />
<DegreeInfoCard record={degreeRecord} />
<ExamInfoCard record={examRecord} />
<RecommendationCard index={0} />
<JobRecommendationCard />
```

## 设计规范

所有组件遵循以下设计规范：

1. **容器样式统一**
   - 使用 `p-0 rounded-none shadow-sm bg-white border border-gray-200`
   - 保持直角设计和轻微阴影

2. **标题栏规范**
   - 背景色：`#66cdab`
   - 内边距：`px-4 py-3`
   - 字体大小：`text-sm`

3. **内容区域布局**
   - 统一使用 `p-6 flex gap-4`
   - 左侧固定元素宽度：`w-[100px]`
   - 右侧内容使用竖线分隔：`border-l border-gray-200 pl-6`

4. **字段对齐规则**
   - 标签宽度：`w-20` 并右对齐
   - 标签右边距：`mr-3`
   - 网格间距：`gap-x-8 gap-y-5`

5. **响应式设计**
   - 支持不同屏幕尺寸
   - 保持视觉一致性

## 维护说明

- 所有组件均为纯展示组件，不包含业务逻辑
- 数据获取和处理应在父组件中完成
- 如需修改样式，请确保保持与其他组件的一致性
- 新增字段时，请在对应的 TypeScript 接口中添加定义
