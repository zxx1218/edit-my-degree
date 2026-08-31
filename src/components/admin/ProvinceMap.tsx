import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from 'echarts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Map } from "lucide-react";
import * as adminApi from "@/lib/adminApi";

interface ProvinceMapProps {
  token: string | null;
}

const ProvinceMap: React.FC<ProvinceMapProps> = ({ token }) => {
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalLogins, setTotalLogins] = useState(0);
  const [totalProvinces, setTotalProvinces] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 加载中国地图数据
  useEffect(() => {
    const loadChinaMap = async () => {
      try {
        const response = await fetch('/maps/china.json');
        const chinaGeoJson = await response.json();
        echarts.registerMap('china', chinaGeoJson);
        setMapLoaded(true);
      } catch (error) {
        // 忽略地图加载错误
      }
    };
    
    if (!mapLoaded) {
      loadChinaMap();
    }
  }, [mapLoaded]);

  // 获取省份登录统计数据
  const fetchProvinceStats = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await adminApi.getProvinceLoginStats(token);
      if (data.success) {
        setProvinceData(data.provinceStats || []);
        setTotalLogins(data.totalLogins || 0);
        setTotalProvinces(data.totalProvinces || 0);
      }
    } catch (error) {
      // 忽略获取统计数据的错误
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化时获取数据
  useEffect(() => {
    if (token) {
      fetchProvinceStats();
    }
  }, [token]);

  // 准备地图数据
  const mapData = provinceData.map(item => ({
    name: item.province,
    value: item.loginCount,
    userCount: item.userCount
  }));

  // 处理Top省份列表：将"未知"分离出来，不参与前10排名
  const unknownProvince = provinceData.find(item => item.province === '未知');
  const knownProvinces = provinceData.filter(item => item.province !== '未知');
  
  // Top 10只显示已知省份
  const topProvinces = knownProvinces.slice(0, 10);
  
  // 如果有"未知"数据，添加到第11位
  const displayProvinces = unknownProvince 
    ? [...topProvinces, unknownProvince]
    : topProvinces;

  // ECharts配置
  const option = {
    title: {
      text: '全国用户登录分布热力图',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.value) {
          return `${params.name}<br/>登录次数: ${params.value}<br/>用户数: ${params.data.userCount || 0}`;
        }
        return `${params.name}<br/>暂无数据`;
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...mapData.map(d => d.value), 1),
      left: 'left',
      bottom: '20',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
      },
      textStyle: {
        color: '#fff'
      }
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      label: {
        emphasis: {
          show: true,
          color: '#fff'
        }
      },
      itemStyle: {
        normal: {
          areaColor: '#f5f5f5',
          borderColor: '#999',
          borderWidth: 0.5
        },
        emphasis: {
          areaColor: '#ffd700',
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowBlur: 10
        }
      }
    },
    series: [
      {
        name: '登录次数',
        type: 'map',
        geoIndex: 0,
        data: mapData,
        emphasis: {
          label: {
            show: true,
            color: '#fff'
          },
          itemStyle: {
            areaColor: '#f39c12'
          }
        }
      }
    ]
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-indigo-600" />
            <CardTitle>省份登录分布</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProvinceStats}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        <CardDescription>
          展示各省份用户登录次数分布（近1年）
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!mapLoaded || isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-2">
              <RefreshCw className={`h-8 w-8 animate-spin mx-auto text-indigo-600`} />
              <p className="text-sm text-muted-foreground">
                {!mapLoaded ? '正在加载地图数据...' : '正在加载登录统计...'}
              </p>
            </div>
          </div>
        ) : provinceData.length === 0 ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-2">
              <Map className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">暂无地图数据</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 统计摘要 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">覆盖省份</p>
                <p className="text-2xl font-bold text-indigo-600">{totalProvinces}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">总登录次数</p>
                <p className="text-2xl font-bold text-purple-600">{totalLogins.toLocaleString()}</p>
              </div>
            </div>
            
            {/* 地图 */}
            <div className="h-[500px] w-full">
              <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>

            {/* Top省份列表 */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Top 10 活跃省份</h4>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {displayProvinces.map((item, index) => (
                  <div
                    key={item.province}
                    className={`flex items-center justify-between p-2 rounded transition-colors ${
                      item.province === '未知' 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-300' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-6 ${
                        item.province === '未知' 
                          ? 'text-gray-500' 
                          : 'text-muted-foreground'
                      }`}>
                        {item.province === '未知' ? '-' : `#${index + 1}`}
                      </span>
                      <span className={`font-medium ${
                        item.province === '未知' 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : ''
                      }`}>
                        {item.province}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={item.province === '未知' ? 'text-gray-500' : 'text-muted-foreground'}>
                        {item.userCount} 用户
                      </span>
                      <span className={`font-semibold ${
                        item.province === '未知' 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-indigo-600'
                      }`}>
                        {item.loginCount.toLocaleString()} 次
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProvinceMap;
