import { Button } from "@/components/ui/button";

interface RecommendationCardProps {
  index: number;
}

const RecommendationCard = ({ index }: RecommendationCardProps) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-none flex-1 flex flex-col">
      {/* 专业推荐 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>专业推荐</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">{index % 2 === 0 ? '1721' : '0'}</span>
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {index % 2 === 0 ? (
            <>您已推荐 <span className="text-green-600">1</span> 个专业，还能推荐 <span className="text-green-600">7</span> 个</>
          ) : (
            <>您尚未推荐专业</>
          )}
        </p>
        <Button className="w-[70px] bg-[#25b887] hover:bg-[#209f74] text-white rounded-none h-7 text-xs">
          我要推荐
        </Button>
      </div>

      {/* 专业满意度 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>专业满意度</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">687</span>
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">综合</span>
            <span className="text-green-600 font-medium">3.9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">办学条件</span>
            <span className="text-green-600 font-medium">3.8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">就业</span>
            <span className="text-green-600 font-medium">3.8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">教学质量</span>
            <span className="text-green-600 font-medium">3.8</span>
          </div>
        </div>
        <Button className="w-[70px] bg-[#25b887] hover:bg-[#209f74] text-white rounded-none h-7 text-xs">
          我要评价
        </Button>
      </div>

      {/* 院校满意度 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>院校满意度</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">4141</span>
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">综合</span>
            <span className="text-green-600 font-medium">3.7</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">环境</span>
            <span className="text-green-600 font-medium">4.1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">生活</span>
            <span className="text-green-600 font-medium">3.3</span>
          </div>
        </div>
        <Button className="w-[70px] bg-[#25b887] hover:bg-[#209f74] text-white rounded-none h-7 text-xs">
          我要评价
        </Button>
      </div>

      {/* 毕业论文查重 */}
      <div className="p-4">
        <img 
          src="/background_banner_img/lwcx-1.png" 
          alt="毕业论文查重" 
          className="w-full h-auto mb-3"
        />
        <Button className="w-full bg-[#25b887] hover:bg-[#209f74] text-white rounded-[5px] h-11 text-sm">
          学科/专业变化查询
        </Button>
      </div>
    </div>
  );
};

export default RecommendationCard;
