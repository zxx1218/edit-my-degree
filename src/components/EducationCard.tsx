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
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPress.current = false;
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowEditIcon(true);
      if (onEdit) {
        onEdit();
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if user is scrolling
    if (touchStartPos.current && longPressTimer.current) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = Math.abs(touchX - touchStartPos.current.x);
      const deltaY = Math.abs(touchY - touchStartPos.current.y);
      
      // If moved more than 10px, cancel long press
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Check if this was a swipe/scroll gesture
    if (touchStartPos.current) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = Math.abs(touchEndX - touchStartPos.current.x);
      const deltaY = Math.abs(touchEndY - touchStartPos.current.y);
      
      // If moved more than 10px, consider it a swipe/scroll
      if (deltaX > 10 || deltaY > 10) {
        touchStartPos.current = null;
        setTimeout(() => setShowEditIcon(false), 100);
        return;
      }
    }
    
    if (!isLongPress.current && onClick) {
      onClick();
    }
    touchStartPos.current = null;
    setTimeout(() => setShowEditIcon(false), 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isLongPress.current = false;
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowEditIcon(true);
      if (onEdit) {
        onEdit();
      }
    }, 500);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Check if this was a drag gesture
    if (touchStartPos.current) {
      const mouseEndX = e.clientX;
      const mouseEndY = e.clientY;
      const deltaX = Math.abs(mouseEndX - touchStartPos.current.x);
      const deltaY = Math.abs(mouseEndY - touchStartPos.current.y);
      
      // If moved more than 10px, consider it a drag
      if (deltaX > 10 || deltaY > 10) {
        touchStartPos.current = null;
        setTimeout(() => setShowEditIcon(false), 100);
        return;
      }
    }
    
    if (!isLongPress.current && onClick) {
      onClick();
    }
    touchStartPos.current = null;
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
      className={`${getVariantClasses()} rounded-sm p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative group`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
        setShowEditIcon(false);
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold">{school}</h3>
        {variant !== "exam" && (
          <div className={`${getBadgeClasses()} px-4 py-1 rounded-sm text-sm font-medium flex items-center gap-2`}>
            {degreeLevel}
          </div>
        )}
      </div>
       <div className="flex items-center gap-2 text-white/95">
          {major && <span className="text-base">{major}</span>}
          {major && studyType && (
            <span className="text-white/60">|</span>
          )}
        {studyType && (
          <span className="text-base">{studyType}</span>
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
