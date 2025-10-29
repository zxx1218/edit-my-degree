import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EducationHeader from "@/components/EducationHeader";
import SectionHeader from "@/components/SectionHeader";
import EducationCard from "@/components/EducationCard";
import EditEducationDialog from "@/components/EditEducationDialog";
import ActionMenuDialog from "@/components/ActionMenuDialog";
import AddRecordDialog from "@/components/AddRecordDialog";
import { toast } from "sonner";
import { getUserData, updateData } from "@/lib/api";
import { sortByDegreeLevel, insertRecordAtCorrectPosition, DegreeLevel } from "@/lib/educationSort";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  const [studentStatus, setStudentStatus] = useState<EducationRecord[]>([]);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [degreeRecords, setDegreeRecords] = useState<EducationRecord[]>([]);
  const [examRecords, setExamRecords] = useState<any[]>([]);

  // 从数据库加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = localStorage.getItem("currentUser");
        if (!userStr) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);

        const data = await getUserData(user.id);
        
        // 转换数据格式以匹配前端接口
        const convertToEducationRecord = (item: any, type: string): EducationRecord => ({
          id: item.id,
          school: item.school,
          major: type === "exam" ? item.year : item.major,
          studyType: item.study_type || "",
          degreeLevel: item.degree_level || "",
          type: type as any,
        });

        // 排序后设置数据
        setStudentStatus(sortByDegreeLevel(data.studentStatus.map((item: any) => convertToEducationRecord(item, "student-status"))));
        setEducationRecords(sortByDegreeLevel(data.education.map((item: any) => convertToEducationRecord(item, "education"))));
        setDegreeRecords(sortByDegreeLevel(data.degree.map((item: any) => convertToEducationRecord(item, "degree"))));
        setExamRecords(data.exam.map((item: any) => ({ ...item, type: "exam" })));
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLongPress = (record: EducationRecord) => {
    setSelectedRecord(record);
    setIsActionMenuOpen(true);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    if (!selectedRecord) return;
    
    // 考研信息不需要选择学历层次
    if (selectedRecord.type === "exam") {
      handleAddWithLevel("本科"); // 考研默认使用本科
    } else {
      setIsAddDialogOpen(true);
    }
  };

  const handleAddWithLevel = async (degreeLevel: DegreeLevel) => {
    if (!selectedRecord) return;

    try {
      const tableMap: Record<string, string> = {
        "student-status": "student_status",
        "education": "education",
        "degree": "degree",
        "exam": "exam",
      };

      const table = tableMap[selectedRecord.type];
      const newData = {
        name: "新用户",
        school: "新学校",
        major: "新专业",
        study_type: selectedRecord.type === "degree" ? "" : "全日制",
        degree_level: degreeLevel,
      };

      const result = await updateData(table, "insert", currentUserId, newData);
      
      if (result.success && result.data) {
        const newRecord: EducationRecord = {
          id: result.data[0].id,
          school: result.data[0].school,
          major: selectedRecord.type === "exam" ? "" : result.data[0].major,
          studyType: result.data[0].study_type || "",
          degreeLevel: result.data[0].degree_level || "",
          type: selectedRecord.type,
        };

        // 使用智能插入函数在正确位置插入
        switch (selectedRecord.type) {
          case "student-status":
            setStudentStatus(insertRecordAtCorrectPosition(studentStatus, newRecord));
            break;
          case "education":
            setEducationRecords(insertRecordAtCorrectPosition(educationRecords, newRecord));
            break;
          case "degree":
            setDegreeRecords(insertRecordAtCorrectPosition(degreeRecords, newRecord));
            break;
          case "exam":
            setExamRecords([...examRecords, { ...result.data[0], type: "exam" }]);
            break;
        }

        toast.success("已添加新记录");
      }
    } catch (error) {
      console.error("Error adding record:", error);
      toast.error("添加记录失败");
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      const tableMap: Record<string, string> = {
        "student-status": "student_status",
        "education": "education",
        "degree": "degree",
        "exam": "exam",
      };

      const table = tableMap[selectedRecord.type];
      await updateData(table, "delete", currentUserId, undefined, selectedRecord.id);

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
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("删除记录失败");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

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
                major=""
                studyType={record.year || ""}
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
          {selectedRecord.type !== "exam" && (
            <AddRecordDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onConfirm={handleAddWithLevel}
              recordType={selectedRecord.type as "student-status" | "education" | "degree"}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Index;
