import { HelpCircle } from "lucide-react";

interface EmptyStateCardProps {
  variant: "education" | "degree" | "exam";
}

const EmptyStateCard = ({ variant }: EmptyStateCardProps) => {
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
    <div className={`${getVariantClasses()} rounded-sm p-6 shadow-sm`}>
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
    </div>
  );
};

export default EmptyStateCard;
