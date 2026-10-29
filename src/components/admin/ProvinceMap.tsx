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
  const [mapError, setMapError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // 加载中国地图数据
  useEffect(() => {
    const loadChinaMap = async () => {
      try {
        const response = await fetch('/maps/china.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const chinaGeoJson = await response.json();
        echarts.registerMap('china', chinaGeoJson);
        setMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('[省份地图] 加载地图数据失败:', error);
        setMapError(error instanceof Error ? error.message : '未知错误');
      }
    };
    
    if (!mapLoaded && !mapError) {
      loadChinaMap();
    }
  }, [mapLoaded, mapError]);

  // 获取省份登录统计数据
  const fetchProvinceStats = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setStatsError(null);
    try {
      const data = await adminApi.getProvinceLoginStats(token);
      if (data.success) {
        setProvinceData(data.provinceStats || []);
        setTotalLogins(data.totalLogins || 0);
        setTotalProvinces(data.totalProvinces || 0);
      } else {
        throw new Error(data.error || '获取统计数据失败');
      }
    } catch (error) {
      console.error('[省份地图] 获取统计数据失败:', error);
      setStatsError(error instanceof Error ? error.message : '未知错误');
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
  const maxVal = Math.max(...mapData.map(d => d.value), 1);
  
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '全国用户登录分布热力图',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#333',
        fontSize: 13
      },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;',
      formatter: (params: any) => {
        if (params.value) {
          return `<div style="font-weight:600;font-size:14px;margin-bottom:6px;">${params.name}</div>
                  <div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="color:#666;">登录次数</span>
                    <span style="font-weight:600;color:#4f46e5;">${params.value.toLocaleString()}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="color:#666;">用户数</span>
                    <span style="font-weight:600;color:#7c3aed;">${(params.data.userCount || 0).toLocaleString()}</span>
                  </div>`;
        }
        return `<div style="font-weight:600;font-size:14px;">${params.name}</div>
                <div style="color:#999;margin-top:4px;">暂无数据</div>`;
      }
    },
    visualMap: {
      min: 0,
      max: maxVal,
      left: 20,
      bottom: 20,
      text: ['高', '低'],
      calculable: false,
      orient: 'vertical',
      itemWidth: 12,
      itemHeight: 120,
      textStyle: {
        color: '#666',
        fontSize: 12
      },
      inRange: {
        color: ['#eef2ff', '#c7d2fe', '#818cf8', '#6366f1', '#4338ca']
      }
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.15,
      center: [104, 36],
      scaleLimit: {
        min: 0.8,
        max: 5
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold'
        },
        itemStyle: {
          areaColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 2,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowBlur: 15
        }
      },
      select: {
        label: {
          show: true,
          color: '#fff'
        },
        itemStyle: {
          areaColor: '#6366f1'
        }
      },
      itemStyle: {
        areaColor: '#f8fafc',
        borderColor: '#94a3b8',
        borderWidth: 1,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffsetY: 2,
        shadowBlur: 4
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
            areaColor: '#f59e0b'
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
        {mapError ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-2">
              <Map className="h-12 w-12 mx-auto text-red-500 opacity-50" />
              <p className="text-sm text-red-600 font-medium">地图数据加载失败</p>
              <p className="text-xs text-muted-foreground">{mapError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMapError(null);
                  setMapLoaded(false);
                }}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            </div>
          </div>
        ) : statsError ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-2">
              <Map className="h-12 w-12 mx-auto text-orange-500 opacity-50" />
              <p className="text-sm text-orange-600 font-medium">统计数据加载失败</p>
              <p className="text-xs text-muted-foreground">{statsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProvinceStats}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            </div>
          </div>
        ) : !mapLoaded || isLoading ? (
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
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Top 10 活跃省份</h4>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {displayProvinces.map((item, index) => {
                  const isUnknown = item.province === '未知';
                  const barWidth = isUnknown ? 0 : Math.max((item.loginCount / (topProvinces[0]?.loginCount || 1)) * 100, 5);
                  
                  return (
                    <div
                      key={item.province}
                      className={`relative flex items-center justify-between p-3 rounded-lg transition-all ${
                        isUnknown 
                          ? 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700' 
                          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm'
                      }`}
                    >
                      {!isUnknown && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 rounded-l-lg bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-950/30"
                          style={{ width: `${barWidth}%` }}
                        />
                      )}
                      <div className="relative flex items-center gap-3">
                        <span className={`text-xs font-bold w-6 text-center ${
                          isUnknown ? 'text-gray-400' : index < 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                        }`}>
                          {isUnknown ? '-' : `${index + 1}`}
                        </span>
                        <span className={`font-medium text-sm ${
                          isUnknown ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {item.province}
                        </span>
                      </div>
                      <div className="relative flex items-center gap-4 text-sm">
                        <span className={`tabular-nums ${isUnknown ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.userCount.toLocaleString()} 用户
                        </span>
                        <span className={`font-semibold tabular-nums min-w-[60px] text-right ${
                          isUnknown ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {item.loginCount.toLocaleString()} 次
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProvinceMap;
