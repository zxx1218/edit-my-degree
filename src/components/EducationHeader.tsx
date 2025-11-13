import { ChevronLeft } from "lucide-react";

const EducationHeader = () => {
  return (
    <header className="text-white sticky top-0 z-50 shadow-md" style={{ backgroundColor: 'rgb(37, 184, 135)' }}>
      <div className="flex items-center justify-center py-[14.4px] px-4 relative">
        <button className="absolute left-4 p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium">高等教育信息</h1>
      </div>
    </header>
  );
};

export default EducationHeader;
