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

export interface SortableRecord {
  id: string;
  degreeLevel: string;
  [key: string]: any;
}

/**
 * 按照学历层次排序记录
 */
export const sortByDegreeLevel = <T extends SortableRecord>(records: T[]): T[] => {
  return [...records].sort((a, b) => {
    const orderA = DEGREE_LEVEL_ORDER[a.degreeLevel as DegreeLevel] || 999;
    const orderB = DEGREE_LEVEL_ORDER[b.degreeLevel as DegreeLevel] || 999;
    return orderA - orderB;
  });
};

/**
 * 在正确位置插入新记录
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
