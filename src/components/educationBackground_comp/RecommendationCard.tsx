import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface RecommendationCardProps {
  index: number;
}

const RecommendationCard = ({ index }: RecommendationCardProps) => {
  // 使用 useMemo 确保在组件生命周期内保持稳定的随机值
  const randomValues = useMemo(() => {
    // 专业推荐投票数：2000-5000
    const professionalVotes = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
    
    // 专业满意度投票数：500-2000
    const professionalSatisfactionVotes = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
    
    // 院校满意度投票数：5000-10000
    const institutionSatisfactionVotes = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    
    // 各项评分：3.9-4.9，保留一位小数
    const generateScore = () => (Math.random() * (4.9 - 3.9) + 3.9).toFixed(1);
    
    return {
      professionalVotes,
      professionalSatisfactionVotes,
      institutionSatisfactionVotes,
      scores: {
        comprehensive: generateScore(),
        conditions: generateScore(),
        employment: generateScore(),
        teaching: generateScore(),
        environment: generateScore(),
        life: generateScore()
      },
      recommendedCount: Math.floor(Math.random() * 8) + 1, // 已推荐数量：1-8
      remainingCount: 8 - Math.floor(Math.random() * 8) // 剩余可推荐数量
    };
  }, [index]);

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-none flex-1 flex flex-col">
      {/* 专业推荐 */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex justify-between items-center mb-3">
          <span>专业推荐</span>
          <span className="text-sm font-normal text-gray-500">
            累计投票 <span className="text-orange-500 font-bold text-base">{randomValues.professionalVotes}</span>
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          您已推荐 <span className="text-green-600">{randomValues.recommendedCount}</span> 个专业，还能推荐 <span className="text-green-600">{randomValues.remainingCount}</span> 个
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
            累计投票 <span className="text-orange-500 font-bold text-base">{randomValues.professionalSatisfactionVotes}</span>
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">综合</span>
            <span className="text-green-600 font-medium">{randomValues.scores.comprehensive}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">办学条件</span>
            <span className="text-green-600 font-medium">{randomValues.scores.conditions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">就业</span>
            <span className="text-green-600 font-medium">{randomValues.scores.employment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">教学质量</span>
            <span className="text-green-600 font-medium">{randomValues.scores.teaching}</span>
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
            累计投票 <span className="text-orange-500 font-bold text-base">{randomValues.institutionSatisfactionVotes}</span>
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">综合</span>
            <span className="text-green-600 font-medium">{randomValues.scores.comprehensive}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">环境</span>
            <span className="text-green-600 font-medium">{randomValues.scores.environment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">生活</span>
            <span className="text-green-600 font-medium">{randomValues.scores.life}</span>
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