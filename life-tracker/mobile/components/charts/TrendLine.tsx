import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '@/lib/constants';

interface DataPoint {
  x: string;
  y: number;
}

interface TrendLineProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  yDomain?: [number, number];
}

export function TrendLine({ data, color = colors.primary, height = 80, yDomain }: TrendLineProps) {
  if (!data || data.length < 2) return <View style={{ height }} />;

  const chartData = data.map((d) => ({ value: d.y }));

  const minY = yDomain ? yDomain[0] : Math.min(...data.map((d) => d.y));
  const maxY = yDomain ? yDomain[1] : Math.max(...data.map((d) => d.y));

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        height={height}
        color={color}
        thickness={2}
        dataPointsColor={color}
        dataPointsRadius={0}
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.15}
        endOpacity={0}
        areaChart
        curved
        hideAxesAndRules
        hideDataPoints
        maxValue={maxY}
        minValue={minY}
        backgroundColor="transparent"
        initialSpacing={0}
        endSpacing={0}
        adjustToWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
