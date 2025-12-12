import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

type EChartsOption = echarts.EChartsOption;

interface ExpenseTrendChartProps {
  months: string[];
  values: number[];
  color?: string;
  height?: number | string;
  seriesName?: string;
}

export function ExpenseTrendChart({
  months,
  values,
  color = "#3B82F7",
  height = "clamp(240px, 40vh, 400px)",
  seriesName = "Expenses",
}: ExpenseTrendChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    const option: EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(255,255,255,0.98)",
        borderColor: "rgba(2,6,23,0.06)",
        borderWidth: 1,
        padding: 0,
        extraCssText:
          "box-shadow:0 8px 24px rgba(15,23,42,0.12); border-radius:10px; overflow:hidden;",
        textStyle: { color: "#0F172A", fontSize: 12 },
        formatter: function (params: any) {
          const p = Array.isArray(params) ? params[0] : params;
          const value = Number(p.value).toLocaleString();
          return `
            <div style="padding:10px 12px;">
              <div style="font-weight:700;margin-bottom:6px">${p.axisValue}</div>
              <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${p.color}"></span>
                <span style="color:#64748B">${seriesName}</span>
                <span style="margin-left:8px;font-weight:700;color:#F97316">₹${value}</span>
              </div>
            </div>`;
        },
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: [
        { type: "category", data: months, axisTick: { alignWithLabel: true } },
      ],
      yAxis: [{ type: "value", axisLabel: { formatter: "₹{value}" } }],
      series: [
        {
          name: seriesName,
          type: "bar",
          barWidth: "60%",
          data: values,
          itemStyle: { color, borderRadius: [30, 30, 0, 0] },
        },
      ],
    };
    chart.setOption(option);
    const handleResize = () => chart.resize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(ref.current);
    window.addEventListener("resize", handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [months, values, color, seriesName]);

  const style =
    typeof height === "number"
      ? { width: "100%", height }
      : { width: "100%", height: height as string };
  return <div ref={ref} style={style} />;
}

export type { ExpenseTrendChartProps };
