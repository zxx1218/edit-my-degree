import { Edit2 } from "lucide-react";
import { useState, useRef } from "react";

interface EducationCardProps {
  school: string;
  major: string;
  studyType: string;
  degreeLevel: string;
  variant: "student-status" | "education" | "degree" | "exam";
  onEdit?: () => void;
  onClick?: () => void;
}

const EducationCard = ({ 
  school, 
  major, 
  studyType, 
  degreeLevel, 
  variant,
  onEdit,
  onClick
}: EducationCardProps) => {
  const [showEditIcon, setShowEditIcon] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowEditIcon(true);
      if (onEdit) {
        onEdit();
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPress.current && onClick) {
      onClick();
    }
    setTimeout(() => setShowEditIcon(false), 100);
  };

  const handleClick = () => {
    if (onClick && !isLongPress.current) {
      onClick();
    }
  };
  const getVariantClasses = () => {
    switch (variant) {
      case "student-status":
        return "bg-gradient-to-br from-[hsl(var(--student-status))] to-[hsl(var(--student-status-dark))] text-white";
      case "education":
        return "bg-gradient-to-br from-[#5DADE2] to-[#3498DB] text-white";
      case "degree":
        return "bg-gradient-to-br from-[#5B7CFF] to-[#4A69FF] text-white";
      case "exam":
        return "bg-gradient-to-br from-[#48C9B0] to-[#16A085] text-white";
      default:
        return "bg-gradient-to-br from-[#5DADE2] to-[#3498DB] text-white";
    }
  };

  const getBadgeClasses = () => {
    switch (variant) {
      case "student-status":
        return "bg-white/20 backdrop-blur-sm";
      case "education":
        return "bg-white/25 backdrop-blur-sm";
      case "degree":
        return "bg-white/25 backdrop-blur-sm";
      case "exam":
        return "bg-white/20 backdrop-blur-sm";
      default:
        return "bg-white/25 backdrop-blur-sm";
    }
  };

  return (
    <div 
      className={`${getVariantClasses()} rounded-lg p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative group`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
        setShowEditIcon(false);
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold">{school}</h3>
        <div className={`${getBadgeClasses()} px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
          {degreeLevel}
        </div>
      </div>
      <div className="flex items-center gap-2 text-white/95">
        <span className="text-base">{major}</span>
        {studyType && (
          <>
            <span className="text-white/60">|</span>
            <span className="text-base">{studyType}</span>
          </>
        )}
      </div>
      {showEditIcon && (
        <div className="absolute top-5 right-5 transition-opacity">
          <Edit2 className="w-4 h-4 text-white/80" />
        </div>
      )}
    </div>
  );
};

export default EducationCard;
