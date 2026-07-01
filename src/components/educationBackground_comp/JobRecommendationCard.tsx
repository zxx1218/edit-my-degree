import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface JobItem {
  title: string;
  salary: string;
  level: string;
}

interface JobRecommendationCardProps {
  jobs?: JobItem[];
}

const defaultJobs: JobItem[] = [
  {
    title: "C++软件开发工程师",
    salary: "10.0K-20.0K",
    level: "本科及以上"
  },
  {
    title: "机电类技术岗位",
    salary: "9.0K-13.0K",
    level: "本科及以上"
  },
  {
    title: "售前客服",
    salary: "4.0K-6.0K",
    level: "本科及以上"
  },
  {
    title: "研发岗（2027届）",
    salary: "20.0K-22.0K",
    level: "硕士及以上"
  }
];

const JobRecommendationCard = ({ jobs = defaultJobs }: JobRecommendationCardProps) => {
  return (
    <Card className="p-6 rounded-none shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">你想求职吗？这里有适合你的职位</h3>
        <div className="flex gap-4 text-sm">
          <button className="text-[#5cb87c] hover:text-[#4cae4c]">换一批</button>
          <span className="text-gray-300">|</span>
          <button className="text-[#5cb87c] hover:text-[#4cae4c]">更多</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.map((job, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer rounded-none border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 truncate">{job.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{job.salary} / {job.level}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default JobRecommendationCard;
