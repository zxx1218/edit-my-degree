// 学历层次排序工具

export const DEGREE_LEVEL_ORDER = {
  "博士研究生": 1,
  "硕士研究生": 2,
  "本科": 3,
  "专科": 4,
};

export type DegreeLevel = keyof typeof DEGREE_LEVEL_ORDER;

export const DEGREE_LEVELS: DegreeLevel[] = [
  "博士研究生",
  "硕士研究生",
  "本科",
  "专科",
];

// 学位类型排序工具
export const DEGREE_TYPE_ORDER = {
  "博士": 1,
  "硕士": 2,
  "学士": 3,
};

export type DegreeType = keyof typeof DEGREE_TYPE_ORDER;

export const DEGREE_TYPES: DegreeType[] = [
  "博士",
  "硕士",
  "学士",
];

/**
 * 从学位信息文本中提取学位类型关键词
 */
export const extractDegreeType = (degreeText: string): string => {
  if (!degreeText) return "";
  
  if (degreeText.includes("博士")) return "博士";
  if (degreeText.includes("硕士")) return "硕士";
  if (degreeText.includes("学士")) return "学士";
  
  return degreeText;
};

export interface SortableRecord {
  id: string;
  degreeLevel: string;
  created_at?: string;
  [key: string]: any;
}

export interface SortableDegreeRecord {
  id: string;
  degreeType?: string;
  created_at?: string;
  [key: string]: any;
}

/**
 * 按照学历层次排序记录
 * 同等级按创建时间降序（最新的在前）
 */
export const sortByDegreeLevel = <T extends SortableRecord>(records: T[]): T[] => {
  return [...records].sort((a, b) => {
    const orderA = DEGREE_LEVEL_ORDER[a.degreeLevel as DegreeLevel] || 999;
    const orderB = DEGREE_LEVEL_ORDER[b.degreeLevel as DegreeLevel] || 999;
    
    // 如果层次相同，按创建时间降序排列（最新的在前）
    if (orderA === orderB) {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    }
    
    return orderA - orderB;
  });
};

/**
 * 按照学位类型排序记录
 * 同等级按创建时间降序（最新的在前）
 */
export const sortByDegreeType = <T extends SortableDegreeRecord>(records: T[]): T[] => {
  return [...records].sort((a, b) => {
    const orderA = DEGREE_TYPE_ORDER[(a.degreeType || "") as DegreeType] || 999;
    const orderB = DEGREE_TYPE_ORDER[(b.degreeType || "") as DegreeType] || 999;
    
    // 如果类型相同，按创建时间降序排列（最新的在前）
    if (orderA === orderB) {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    }
    
    return orderA - orderB;
  });
};

/**
 * 在正确位置插入新记录（学历层次）
 */
export const insertRecordAtCorrectPosition = <T extends SortableRecord>(
  records: T[],
  newRecord: T
): T[] => {
  const newDegreeLevel = newRecord.degreeLevel as DegreeLevel;
  const newOrder = DEGREE_LEVEL_ORDER[newDegreeLevel] || 999;

  // 找到应该插入的位置：同等级的最后一个位置
  let insertIndex = records.length;
  
  for (let i = 0; i < records.length; i++) {
    const currentLevel = records[i].degreeLevel as DegreeLevel;
    const currentOrder = DEGREE_LEVEL_ORDER[currentLevel] || 999;
    
    if (currentOrder > newOrder) {
      insertIndex = i;
      break;
    }
  }

  // 在指定位置插入
  const newRecords = [...records];
  newRecords.splice(insertIndex, 0, newRecord);
  return newRecords;
};

/**
 * 在正确位置插入新记录（学位类型）
 */
export const insertDegreeRecordAtCorrectPosition = <T extends SortableDegreeRecord>(
  records: T[],
  newRecord: T
): T[] => {
  const newDegreeType = (newRecord.degreeType || "") as DegreeType;
  const newOrder = DEGREE_TYPE_ORDER[newDegreeType] || 999;

  // 找到应该插入的位置：同等级的最后一个位置
  let insertIndex = records.length;
  
  for (let i = 0; i < records.length; i++) {
    const currentType = (records[i].degreeType || "") as DegreeType;
    const currentOrder = DEGREE_TYPE_ORDER[currentType] || 999;
    
    if (currentOrder > newOrder) {
      insertIndex = i;
      break;
    }
  }

  // 在指定位置插入
  const newRecords = [...records];
  newRecords.splice(insertIndex, 0, newRecord);
  return newRecords;
};
