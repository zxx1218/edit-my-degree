import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EducationHeader from "@/components/EducationHeader";
import ExamBanner from "@/components/ExamBanner";
import SectionHeader from "@/components/SectionHeader";
import EducationCard from "@/components/EducationCard";
import EditEducationDialog from "@/components/EditEducationDialog";
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

  const handleEdit = (record: EducationRecord) => {
    setSelectedRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleCardClick = (record: EducationRecord) => {
    if (record.type === "student-status") {
      navigate(`/student-status/${record.id}`);
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
      <ExamBanner />

      <div className="space-y-6">
        <section>
          <SectionHeader
            title="学籍信息"
            count={studentStatus.length}
            actionText="还有学籍没有显示出来？尝试绑定"
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
                onEdit={() => handleEdit(record)}
                onClick={() => handleCardClick(record)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="学历信息"
            count={educationRecords.length}
            actionText="还有学历没有显示出来？尝试绑定"
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
                onEdit={() => handleEdit(record)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="学位信息"
            count={degreeRecords.length}
            actionText="还有学位没有显示出来？尝试绑定"
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
                onEdit={() => handleEdit(record)}
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
                major={record.major}
                studyType={record.studyType}
                degreeLevel={record.degreeLevel}
                variant="exam"
                onEdit={() => handleEdit(record)}
              />
            ))}
          </div>
        </section>
      </div>

      {selectedRecord && (
        <EditEducationDialog
          key={selectedRecord.id}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          record={selectedRecord}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Index;
