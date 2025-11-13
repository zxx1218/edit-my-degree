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
        return "bg-edu-student-status shadow-[0_4px_4px_3px_rgba(89,181,138,0.2)]";
      case "education":
        return "bg-edu-education shadow-[0_4px_4px_3px_rgba(93,157,249,0.2)]";
      case "degree":
        return "bg-edu-degree shadow-[0_4px_4px_3px_rgba(71,94,214,0.2)]";
      case "exam":
        return "bg-edu-exam shadow-[0_4px_4px_3px_rgba(98,191,207,0.2)]";
      default:
        return "bg-edu-student-status shadow-[0_4px_4px_3px_rgba(89,181,138,0.2)]";
    }
  };

  return (
    <div 
      className={`${getVariantClasses()} rounded-[5px] p-[5px] cursor-pointer relative h-[78px]`}
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
      <div className="absolute left-[10px] top-[10px] text-white text-[17px] font-light">
        {school}
      </div>
      {variant !== "exam" && (
        <div className="absolute right-[15px] top-[15px] bg-black/20 text-[#d2e7dd] text-[10px] px-[10px] py-[5px] rounded-[10px] flex items-center justify-center">
          {degreeLevel}
        </div>
      )}
      <div className="absolute left-[10px] bottom-[5px] text-white text-[11px]">
        {variant === "exam" ? (
          <span>{major}</span>
        ) : (
          <span>{major}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;{studyType}</span>
        )}
      </div>
      {showEditIcon && (
        <div className="absolute top-[10px] right-[10px] transition-opacity">
          <Edit2 className="w-4 h-4 text-white/80" />
        </div>
      )}
    </div>
  );
};

export default EducationCard;
