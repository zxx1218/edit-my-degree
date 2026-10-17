import { HelpCircle, Edit2, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";

interface EmptyStateCardProps {
  variant: "student-status" | "education" | "degree" | "exam";
  onEdit?: () => void;
  onClick?: () => void;
}

const EmptyStateCard = ({ variant, onEdit, onClick }: EmptyStateCardProps) => {
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
    if (touchStartPos.current && longPressTimer.current) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = Math.abs(touchX - touchStartPos.current.x);
      const deltaY = Math.abs(touchY - touchStartPos.current.y);
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
    if (touchStartPos.current) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = Math.abs(touchEndX - touchStartPos.current.x);
      const deltaY = Math.abs(touchEndY - touchStartPos.current.y);
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
    if (touchStartPos.current) {
      const mouseEndX = e.clientX;
      const mouseEndY = e.clientY;
      const deltaX = Math.abs(mouseEndX - touchStartPos.current.x);
      const deltaY = Math.abs(mouseEndY - touchStartPos.current.y);
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

  const getContent = () => {
    switch (variant) {
      case "student-status":
        return {
          title: "没有找到您的学籍信息",
          action: "查看解决办法",
        };
      case "education":
        return {
          title: "没有找到您的学历信息",
          action: "查看解决办法",
        };
      case "degree":
        return {
          title: `您还未绑定学位信息，可以使用"尝试绑定学位"功能绑定您的学位`,
          action: "提示信息",
        };
      case "exam":
        return {
          title: "您没有考研信息！",
          subtitle: "您目前没有考研信息，系统提供2006年以来入学的硕士研究生报名和成绩数据。",
        };
      default:
        return {
          title: "",
          action: "",
        };
    }
  };

  const content = getContent();

  return (
    <div
      className="bg-white rounded border border-gray-200 shadow-sm cursor-pointer relative group overflow-hidden"
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
      {/* 文字区域 */}
      <div className="px-6 py-5 flex flex-col items-center justify-center text-center">
        <p className="text-xl text-gray-800 leading-relaxed flex items-center gap-1.5">
          {content.title}
          {variant !== "exam" && <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        </p>
        {content.subtitle && (
          <p className="text-sl text-gray-400 leading-relaxed mt-2 px-4">
            {content.subtitle}
          </p>
        )}
      </div>

      {/* 分割线 + 操作链接 */}
      {content.action && (
        <>
          <div className="border-t border-gray-200" />
          <div className="py-3 flex items-center justify-center">
            <button className="text-[#22b885] text-sl flex items-center gap-1 border-none outline-none bg-transparent">
              {content.action}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {showEditIcon && (
        <div className="absolute top-3 right-3 transition-opacity">
          <Edit2 className="w-3.5 h-3.5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default EmptyStateCard;
