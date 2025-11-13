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
        return "bg-[rgba(98,191,207,0.2)] text-foreground";
      case "education":
        return "bg-[rgba(93,157,249,0.2)] text-foreground";
      case "degree":
        return "bg-[rgba(98,191,207,0.2)] text-foreground";
      case "exam":
        return "bg-[rgba(98,191,207,0.2)] text-foreground";
      default:
        return "bg-[rgba(93,157,249,0.2)] text-foreground";
    }
  };

  const getBadgeClasses = () => {
    switch (variant) {
      case "student-status":
        return "bg-primary/10 backdrop-blur-sm text-foreground";
      case "education":
        return "bg-primary/10 backdrop-blur-sm text-foreground";
      case "degree":
        return "bg-primary/10 backdrop-blur-sm text-foreground";
      case "exam":
        return "bg-primary/10 backdrop-blur-sm text-foreground";
      default:
        return "bg-primary/10 backdrop-blur-sm text-foreground";
    }
  };

  return (
    <div 
      className={`${getVariantClasses()} rounded-[5px] p-5 shadow-lg cursor-pointer relative group`}
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
          <div className={`${getBadgeClasses()} px-4 py-1 rounded-[5px] text-sm font-medium flex items-center gap-2`}>
            {degreeLevel}
          </div>
        )}
      </div>
      {variant === "exam" ? (
        <div className="text-foreground/90">
          <span className="text-base">{major}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-foreground/90">
          {major && <span className="text-base">{major}</span>}
          {major && studyType && (
            <span className="text-muted-foreground">|</span>
          )}
          {studyType && (
            <span className="text-base">{studyType}</span>
          )}
        </div>
      )}
      {showEditIcon && (
        <div className="absolute top-5 right-5 transition-opacity">
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default EducationCard;
