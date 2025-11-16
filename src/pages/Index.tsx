import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EducationHeader from "@/components/EducationHeader";
import SectionHeader from "@/components/SectionHeader";
import EducationCard from "@/components/EducationCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import EditEducationDialog from "@/components/EditEducationDialog";
import ActionMenuDialog from "@/components/ActionMenuDialog";
import AddRecordDialog from "@/components/AddRecordDialog";
import { toast } from "sonner";
import { getUserData, updateData } from "@/lib/api";
import { 
  sortByDegreeLevel, 
  sortByDegreeType, 
  insertRecordAtCorrectPosition, 
  insertDegreeRecordAtCorrectPosition,
  extractDegreeType,
  DegreeLevel,
  DegreeType 
} from "@/lib/educationSort";

interface EducationRecord {
  id: string;
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  degreeType?: string;
  type: "student-status" | "education" | "degree" | "exam";
  created_at?: string;
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
          degreeType: item.degree_type || "",
          type: type as any,
          created_at: item.created_at,
        });

        // 检查学籍信息是否为空，如果为空则创建默认记录
        if (data.studentStatus.length === 0) {
          try {
            const defaultData = {
              name: "新用户",
              school: "清华大学",
              major: "汉语言文学",
              study_type: "全日制",
              degree_level: "本科",
            };
            
            const result = await updateData("student_status", "insert", user.id, defaultData);
            
            if (result.success && result.data) {
              data.studentStatus = result.data;
            }
          } catch (error) {
            console.error("Error creating default student status:", error);
          }
        }

        // 排序后设置数据
        setStudentStatus(sortByDegreeLevel(data.studentStatus.map((item: any) => convertToEducationRecord(item, "student-status"))));
        setEducationRecords(sortByDegreeLevel(data.education.map((item: any) => convertToEducationRecord(item, "education"))));
        setDegreeRecords(sortByDegreeType(data.degree.map((item: any) => convertToEducationRecord(item, "degree"))));
        setExamRecords(data.exam.map((item: any) => ({ ...item, type: "exam" })));
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("加载数据失败", { duration: 1500 });
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

  const handleAddWithLevel = async (level: DegreeLevel | DegreeType) => {
    if (!selectedRecord) return;

    try {
      const tableMap: Record<string, string> = {
        "student-status": "student_status",
        "education": "education",
        "degree": "degree",
        "exam": "exam",
      };

      const table = tableMap[selectedRecord.type];
      
      // 根据类型构建不同的数据
      let newData;
      
      if (selectedRecord.type === "degree") {
        newData = {
          name: "新用户",
          school: "新学校",
          degree_type: level, // 学位使用 degree_type
          degree_level: "", // 学位的 degree_level 可以为空
          major: "新专业",
        };
      } else if (selectedRecord.type === "exam") {
        // 考研信息不需要 degree_level 字段，使用当前年份作为默认值
        const currentYear = new Date().getFullYear();
        newData = {
          name: "新用户",
          school: "新学校",
          year: currentYear.toString(),
          note: "系统提供2006年以来入学的硕士研究生报名和成绩数据。",
        };
      } else {
        // 学历/学籍使用 degree_level
        newData = {
          name: "新用户",
          school: "新学校",
          major: "新专业",
          study_type: "全日制",
          degree_level: level,
        };
      }

      const result = await updateData(table, "insert", currentUserId, newData);
      
      if (result.success && result.data) {
        const newRecord: EducationRecord = {
          id: result.data[0].id,
          school: result.data[0].school,
          major: selectedRecord.type === "exam" ? "" : (result.data[0].major || ""),
          studyType: result.data[0].study_type || "",
          degreeLevel: result.data[0].degree_level || "",
          degreeType: result.data[0].degree_type || "",
          type: selectedRecord.type,
          created_at: result.data[0].created_at,
        };

        // 使用排序函数重新排序列表
        switch (selectedRecord.type) {
          case "student-status":
            setStudentStatus(sortByDegreeLevel([...studentStatus, newRecord]));
            break;
          case "education":
            setEducationRecords(sortByDegreeLevel([...educationRecords, newRecord]));
            break;
          case "degree":
            setDegreeRecords(sortByDegreeType([...degreeRecords, newRecord]));
            break;
          case "exam":
            setExamRecords([...examRecords, { ...result.data[0], type: "exam" }]);
            break;
        }

        toast.success("已添加新记录", { duration: 1500 });
      }
    } catch (error) {
      console.error("Error adding record:", error);
      toast.error("添加记录失败", { duration: 1500 });
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

      toast.success("已删除记录", { duration: 1500 });
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("删除记录失败", { duration: 1500 });
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

  const handleSave = async (updatedRecord: EducationRecord) => {
    try {
      const tableMap: Record<string, string> = {
        "student-status": "student_status",
        "education": "education",
        "degree": "degree",
        "exam": "exam",
      };

      const table = tableMap[updatedRecord.type];
      
      // 构建数据库更新数据，将前端字段名映射到数据库字段名
      const updatePayload: any = {
        school: updatedRecord.school,
      };

      // 根据类型添加不同的字段
      if (updatedRecord.type === "degree") {
        updatePayload.degree_type = updatedRecord.degreeType;
        updatePayload.major = updatedRecord.major;
        // 确保前端记录也更新了degreeType字段
        updatedRecord.degreeType = updatedRecord.degreeType;
      } else if (updatedRecord.type === "exam") {
        // 考研信息将major字段映射到year字段
        updatePayload.year = updatedRecord.major;
      } else {
        updatePayload.major = updatedRecord.major;
        updatePayload.study_type = updatedRecord.studyType;
        updatePayload.degree_level = updatedRecord.degreeLevel;
      }

      await updateData(table, "update", currentUserId, updatePayload, updatedRecord.id);

      const updateList = (list: EducationRecord[]) =>
        list.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));

      switch (updatedRecord.type) {
        case "student-status":
          setStudentStatus(sortByDegreeLevel(updateList(studentStatus)));
          break;
        case "education":
          setEducationRecords(sortByDegreeLevel(updateList(educationRecords)));
          break;
        case "degree":
          setDegreeRecords(sortByDegreeType(updateList(degreeRecords)));
          break;
        case "exam":
          setExamRecords(examRecords.map((r) => 
            r.id === updatedRecord.id 
              ? { ...updatedRecord, year: updatedRecord.major } 
              : r
          ));
          break;
      }

      toast.success("信息已更新", { duration: 1500 });
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("更新失败", { duration: 1500 });
    }
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
            onAction={() => {
              setSelectedRecord({ 
                id: '', 
                school: '', 
                major: '', 
                studyType: '', 
                degreeLevel: '', 
                type: 'student-status' 
              });
              setIsAddDialogOpen(true);
            }}
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
            onAction={() => {
              setSelectedRecord({ 
                id: '', 
                school: '', 
                major: '', 
                studyType: '', 
                degreeLevel: '', 
                type: 'education' 
              });
              setIsAddDialogOpen(true);
            }}
          />
          <div className="px-4 space-y-3">
            {educationRecords.length > 0 ? (
              educationRecords.map((record) => (
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
              ))
            ) : (
              <EmptyStateCard 
                variant="education" 
                onEdit={() => handleLongPress({ 
                  id: 'temp', 
                  school: '', 
                  major: '', 
                  studyType: '', 
                  degreeLevel: '', 
                  type: 'education' 
                })}
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeader
            title="学位信息"
            count={degreeRecords.length}
            promptText="还有学位没有显示出来？"
            actionText="尝试绑定"
            onAction={() => {
              setSelectedRecord({ 
                id: '', 
                school: '', 
                major: '', 
                studyType: '', 
                degreeLevel: '', 
                type: 'degree' 
              });
              setIsAddDialogOpen(true);
            }}
          />
          <div className="px-4 space-y-3">
            {degreeRecords.length > 0 ? (
              degreeRecords.map((record) => (
                <EducationCard
                  key={record.id}
                  school={record.school}
                  major={record.major}
                  studyType={record.studyType}
                  degreeLevel={extractDegreeType(record.degreeType || record.degreeLevel)}
                  variant="degree"
                  onEdit={() => handleLongPress(record)}
                  onClick={() => handleCardClick(record)}
                />
              ))
            ) : (
              <EmptyStateCard 
                variant="degree" 
                onEdit={() => handleLongPress({ 
                  id: 'temp', 
                  school: '', 
                  major: '', 
                  studyType: '', 
                  degreeLevel: '', 
                  type: 'degree' 
                })}
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeader title="考研信息" count={examRecords.length} />
          <div className="px-4 space-y-3">
            {examRecords.length > 0 ? (
              examRecords.map((record) => (
                <EducationCard
                  key={record.id}
                  school={record.school}
                  major={record.year || ""}
                  studyType=""
                  degreeLevel=""
                  variant="exam"
                  onEdit={() => handleLongPress(record)}
                  onClick={() => handleCardClick(record)}
                />
              ))
            ) : (
              <EmptyStateCard 
                variant="exam" 
                onEdit={() => handleLongPress({ 
                  id: 'temp', 
                  school: '', 
                  major: '', 
                  studyType: '', 
                  degreeLevel: '', 
                  type: 'exam' 
                })}
              />
            )}
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
            showEdit={selectedRecord.id !== 'temp'}
            showDelete={
              selectedRecord.id !== 'temp' && 
              !(selectedRecord.type === 'student-status' && studentStatus.length === 1)
            }
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
