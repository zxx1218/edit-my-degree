import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EducationHeader from "@/components/EducationHeader";
import SectionHeader from "@/components/SectionHeader";
import EducationCard from "@/components/EducationCard";
import EditEducationDialog from "@/components/EditEducationDialog";
import ActionMenuDialog from "@/components/ActionMenuDialog";
import { toast } from "sonner";

interface EducationRecord {
  id: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  type: "student-status" | "education" | "degree" | "exam";
}

const Index = () => {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<EducationRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  const [studentStatus, setStudentStatus] = useState<EducationRecord[]>([
    {
      id: "ss1",
      school: "浙江大学",
      major: "计算机技术",
      studyType: "全日制",
      degreeLevel: "硕士研究生",
      type: "student-status",
    },
    {
      id: "ss2",
      school: "浙江大学",
      major: "计算机科学与技术",
      studyType: "普通全日制",
      degreeLevel: "本科",
      type: "student-status",
    },
  ]);

  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([
    {
      id: "ed1",
      school: "浙江大学",
      major: "计算机技术",
      studyType: "全日制",
      degreeLevel: "硕士研究生",
      type: "education",
    },
    {
      id: "ed2",
      school: "浙江大学",
      major: "计算机科学与技术",
      studyType: "普通全日制",
      degreeLevel: "本科",
      type: "education",
    },
  ]);

  const [degreeRecords, setDegreeRecords] = useState<EducationRecord[]>([
    {
      id: "dg1",
      school: "浙江大学",
      major: "电子信息硕士专业学位",
      studyType: "",
      degreeLevel: "硕士",
      type: "degree",
    },
    {
      id: "dg2",
      school: "浙江大学",
      major: "工学学士学位",
      studyType: "",
      degreeLevel: "学士",
      type: "degree",
    },
  ]);

  const [examRecords, setExamRecords] = useState<any[]>([
    {
      id: "ex1",
      name: "浆果儿",
      school: "浙江大学",
      year: "2022",
      photo: "",
      examLocation: "3306",
      registrationNumber: "330695769",
      examUnit: "10335",
      department: "无",
      major: "085400",
      researchDirection: "无",
      examType: "全国统考",
      specialProgram: "非专项计划",
      politicsName: "思想政治理论",
      foreignLanguageName: "英语（一）",
      businessCourse1Name: "数学（一）",
      businessCourse2Name: "数据结构与计算机网络",
      politicsScore: "78",
      foreignLanguageScore: "60",
      businessCourse1Score: "139",
      businessCourse2Score: "129",
      totalScore: "406.0",
      admissionUnit: "浙江大学",
      admissionMajor: "电子信息",
      note: "系统提供2006年以来入学的硕士研究生报名和成绩数据。",
      type: "exam",
    },
  ]);

  const handleLongPress = (record: EducationRecord) => {
    setSelectedRecord(record);
    setIsActionMenuOpen(true);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    if (!selectedRecord) return;

    const newRecord: EducationRecord = {
      id: `${selectedRecord.type}-${Date.now()}`,
      school: "新学校",
      major: "新专业",
      studyType: selectedRecord.type === "degree" ? "" : "全日制",
      degreeLevel: selectedRecord.type === "degree" ? "学士" : "本科",
      type: selectedRecord.type,
    };

    switch (selectedRecord.type) {
      case "student-status":
        setStudentStatus([...studentStatus, newRecord]);
        break;
      case "education":
        setEducationRecords([...educationRecords, newRecord]);
        break;
      case "degree":
        setDegreeRecords([...degreeRecords, newRecord]);
        break;
      case "exam":
        setExamRecords([...examRecords, newRecord]);
        break;
    }

    toast.success("已添加新记录");
  };

  const handleDelete = () => {
    if (!selectedRecord) return;

    const deleteFromList = (list: EducationRecord[]) =>
      list.filter((r) => r.id !== selectedRecord.id);

    switch (selectedRecord.type) {
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

    toast.success("已删除记录");
  };

  const handleCardClick = (record: EducationRecord) => {
    if (record.type === "student-status") {
      navigate(`/student-status/${record.id}`, { state: { record } });
    } else if (record.type === "education") {
      navigate(`/education/${record.id}`, { state: { record } });
    } else if (record.type === "degree") {
      navigate(`/degree/${record.id}`, { state: { record } });
    } else if (record.type === "exam") {
      navigate(`/exam/${record.id}`, { state: { record } });
    }
  };

  const handleSave = (updatedRecord: EducationRecord) => {
    const updateList = (list: EducationRecord[]) =>
      list.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));

    switch (updatedRecord.type) {
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

    toast.success("信息已更新");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <EducationHeader />

      <div className="space-y-6 mt-4">
        <section>
          <SectionHeader
            title="学籍信息"
            count={studentStatus.length}
            promptText="还有学籍没有显示出来？"
            actionText="尝试绑定"
          />
          <div className="px-4 space-y-3">
            {studentStatus.map((record) => (
              <EducationCard
                key={record.id}
                school={record.school}
                major={record.major}
                studyType={record.studyType}
                degreeLevel={record.degreeLevel}
                variant="student-status"
                onEdit={() => handleLongPress(record)}
                onClick={() => handleCardClick(record)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="学历信息"
            count={educationRecords.length}
            promptText="还有学历没有显示出来？"
            actionText="尝试绑定"
          />
          <div className="px-4 space-y-3">
            {educationRecords.map((record) => (
              <EducationCard
                key={record.id}
                school={record.school}
                major={record.major}
                studyType={record.studyType}
                degreeLevel={record.degreeLevel}
                variant="education"
                onEdit={() => handleLongPress(record)}
                onClick={() => handleCardClick(record)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="学位信息"
            count={degreeRecords.length}
            promptText="还有学位没有显示出来？"
            actionText="尝试绑定"
          />
          <div className="px-4 space-y-3">
            {degreeRecords.map((record) => (
              <EducationCard
                key={record.id}
                school={record.school}
                major={record.major}
                studyType={record.studyType}
                degreeLevel={record.degreeLevel}
                variant="degree"
                onEdit={() => handleLongPress(record)}
                onClick={() => handleCardClick(record)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="考研信息" count={examRecords.length} />
          <div className="px-4 space-y-3">
            {examRecords.map((record) => (
              <EducationCard
                key={record.id}
                school={record.school}
                major={record.year}
                studyType=""
                degreeLevel=""
                variant="exam"
                onEdit={() => handleLongPress(record)}
                onClick={() => handleCardClick(record)}
              />
            ))}
          </div>
        </section>
      </div>

      {selectedRecord && (
        <>
          <ActionMenuDialog
            open={isActionMenuOpen}
            onOpenChange={setIsActionMenuOpen}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
            recordType={selectedRecord.type}
          />
          <EditEducationDialog
            key={selectedRecord.id}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            record={selectedRecord}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  );
};

export default Index;
