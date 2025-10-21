import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EducationHeader from "@/components/EducationHeader";
import SectionHeader from "@/components/SectionHeader";
import EducationCard from "@/components/EducationCard";
import EditEducationDialog from "@/components/EditEducationDialog";
import ActionMenuDialog from "@/components/ActionMenuDialog";
import { toast } from "sonner";
import { useEducation, EducationRecord } from "@/contexts/EducationContext";

const Index = () => {
  const navigate = useNavigate();
  const { studentStatus, educationRecords, degreeRecords, examRecords, updateRecord, addRecord, deleteRecord } = useEducation();
  const [selectedRecord, setSelectedRecord] = useState<EducationRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

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

    addRecord(selectedRecord.type, newRecord);
    toast.success("已添加新记录");
  };

  const handleDelete = () => {
    if (!selectedRecord) return;
    deleteRecord(selectedRecord.id, selectedRecord.type);
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
    updateRecord(updatedRecord.id, updatedRecord.type, updatedRecord);
    toast.success("信息已更新");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <EducationHeader />

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
                major={record.major}
                studyType={record.studyType}
                degreeLevel={record.degreeLevel}
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
