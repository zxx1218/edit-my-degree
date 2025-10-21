import { createContext, useContext, useState, ReactNode } from "react";

export interface EducationRecord {
  id: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  type: "student-status" | "education" | "degree" | "exam";
  [key: string]: any; // 允许额外的字段
}

interface EducationContextType {
  studentStatus: EducationRecord[];
  educationRecords: EducationRecord[];
  degreeRecords: EducationRecord[];
  examRecords: EducationRecord[];
  updateRecord: (id: string, type: string, data: any) => void;
  addRecord: (type: string, record: EducationRecord) => void;
  deleteRecord: (id: string, type: string) => void;
}

const EducationContext = createContext<EducationContextType | undefined>(undefined);

export const EducationProvider = ({ children }: { children: ReactNode }) => {
  const [studentStatus, setStudentStatus] = useState<EducationRecord[]>([
    {
      id: "ss1",
      school: "湖州师范学院",
      major: "计算机技术",
      studyType: "全日制",
      degreeLevel: "硕士研究生",
      type: "student-status",
    },
    {
      id: "ss2",
      school: "浙江工业大学之江学院",
      major: "计算机科学与技术",
      studyType: "普通全日制",
      degreeLevel: "本科",
      type: "student-status",
    },
  ]);

  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([
    {
      id: "ed1",
      school: "湖州师范学院",
      major: "计算机技术",
      studyType: "全日制",
      degreeLevel: "硕士研究生",
      type: "education",
    },
    {
      id: "ed2",
      school: "浙江工业大学之江学院",
      major: "计算机科学与技术",
      studyType: "普通全日制",
      degreeLevel: "本科",
      type: "education",
    },
  ]);

  const [degreeRecords, setDegreeRecords] = useState<EducationRecord[]>([
    {
      id: "dg1",
      school: "湖州师范学院",
      major: "电子信息硕士专业学位",
      studyType: "",
      degreeLevel: "硕士",
      type: "degree",
    },
    {
      id: "dg2",
      school: "浙江工业大学之江学院",
      major: "工学学士学位",
      studyType: "",
      degreeLevel: "学士",
      type: "degree",
    },
  ]);

  const [examRecords, setExamRecords] = useState<EducationRecord[]>([
    {
      id: "ex1",
      school: "湖州师范学院",
      major: "2022年",
      studyType: "",
      degreeLevel: "",
      type: "exam",
    },
  ]);

  const updateRecord = (id: string, type: string, data: any) => {
    const updateList = (list: EducationRecord[]) =>
      list.map((r) => (r.id === id ? { ...r, ...data } : r));

    switch (type) {
      case "student-status":
        setStudentStatus(updateList(studentStatus));
        break;
      case "education":
        setEducationRecords(updateList(educationRecords));
        break;
      case "degree":
        setDegreeRecords(updateList(degreeRecords));
        break;
      case "exam":
        setExamRecords(updateList(examRecords));
        break;
    }
  };

  const addRecord = (type: string, record: EducationRecord) => {
    switch (type) {
      case "student-status":
        setStudentStatus([...studentStatus, record]);
        break;
      case "education":
        setEducationRecords([...educationRecords, record]);
        break;
      case "degree":
        setDegreeRecords([...degreeRecords, record]);
        break;
      case "exam":
        setExamRecords([...examRecords, record]);
        break;
    }
  };

  const deleteRecord = (id: string, type: string) => {
    const deleteFromList = (list: EducationRecord[]) =>
      list.filter((r) => r.id !== id);

    switch (type) {
      case "student-status":
        setStudentStatus(deleteFromList(studentStatus));
        break;
      case "education":
        setEducationRecords(deleteFromList(educationRecords));
        break;
      case "degree":
        setDegreeRecords(deleteFromList(degreeRecords));
        break;
      case "exam":
        setExamRecords(deleteFromList(examRecords));
        break;
    }
  };

  return (
    <EducationContext.Provider
      value={{
        studentStatus,
        educationRecords,
        degreeRecords,
        examRecords,
        updateRecord,
        addRecord,
        deleteRecord,
      }}
    >
      {children}
    </EducationContext.Provider>
  );
};

export const useEducation = () => {
  const context = useContext(EducationContext);
  if (!context) {
    throw new Error("useEducation must be used within EducationProvider");
  }
  return context;
};
