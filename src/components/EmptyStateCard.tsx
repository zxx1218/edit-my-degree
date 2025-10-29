import { HelpCircle, Edit2 } from "lucide-react";
import { useState, useRef } from "react";

interface EmptyStateCardProps {
  variant: "education" | "degree" | "exam";
  onEdit?: () => void;
  onClick?: () => void;
}

const EmptyStateCard = ({ variant, onEdit, onClick }: EmptyStateCardProps) => {
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
      case "education":
        return "bg-white border border-gray-200";
      case "degree":
        return "bg-white border border-gray-200";
      case "exam":
        return "bg-white border border-gray-200";
      default:
        return "bg-white border border-gray-200";
    }
  };

  const getContent = () => {
    switch (variant) {
      case "education":
        return {
          title: "没有找到您的学历信息",
          action: "查看解决办法",
        };
      case "degree":
        return {
          title: "您还未绑定学位信息，可以使用\"尝试绑定学位\"功能绑定您的学位",
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
      className={`${getVariantClasses()} rounded-sm p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer relative group`}
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
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <HelpCircle className="w-6 h-6 text-gray-400" />
        <div>
          <p className="text-base text-gray-700 leading-relaxed">
            {content.title}
          </p>
          {content.subtitle && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {content.subtitle}
            </p>
          )}
        </div>
        {content.action && (
          <button className="text-sm text-[#48C9B0] flex items-center gap-1">
            {content.action} <span className="text-lg">▾</span>
          </button>
        )}
      </div>
      {showEditIcon && (
        <div className="absolute top-6 right-6 transition-opacity">
          <Edit2 className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default EmptyStateCard;
