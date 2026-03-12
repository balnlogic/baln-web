// ═══════════════════════════════════════════════════════════
// 고도화된 6월 목표 달성 예측 시스템
// 이 코드를 index.html의 loadWBS() 함수에 복사하세요
// ═══════════════════════════════════════════════════════════

// 기존 코드를 아래 코드로 교체:
// 시작: "// 6월 목표 달성 예측"
// 종료: "document.getElementById('wbs-ai-decisions').innerHTML = `...`;"

const launchDate = new Date('2026-03-01');
const juneEndDate = new Date('2026-06-30');
const daysFromLaunch = Math.floor((now - launchDate) / (24 * 60 * 60 * 1000)) + 1;
const daysUntilJune = Math.floor((juneEndDate - now) / (24 * 60 * 60 * 1000));
const totalDaysToJune = Math.floor((juneEndDate - launchDate) / (24 * 60 * 60 * 1000));

// 1️⃣ 주차별 성장률 분석 (최근 4주 트렌드)
const weeklyGrowth = [];
for (let i = 0; i < 4; i++) {
  const weekStart = new Date(now.getTime() - ((i + 1) * 7 * 24 * 60 * 60 * 1000));
  const weekEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
  const weekSignups = (recentSignups || []).filter(u => {
    const createdAt = new Date(u.created_at);
    return createdAt >= weekStart && createdAt < weekEnd;
  }).length;
  weeklyGrowth.push(weekSignups);
}
weeklyGrowth.reverse(); // 오래된 주부터 정렬

// 성장 가속도 계산
const avgWeeklyGrowth = weeklyGrowth.reduce((a, b) => a + b, 0) / weeklyGrowth.length;
const recentWeekGrowth = weeklyGrowth[weeklyGrowth.length - 1] || 0;
const growthAcceleration = recentWeekGrowth / (avgWeeklyGrowth || 1);

// 2️⃣ 다중 시나리오 예측 모델

// 시나리오 A: 비관적 (Worst Case) - 선형 둔화
const linearGrowthRate = daysFromLaunch > 0 ? currentMAU / daysFromLaunch : 0;
const decayFactor = 0.85; // 15% 둔화
const pessimisticMAU = Math.round(currentMAU + (linearGrowthRate * daysUntilJune * decayFactor));

// 시나리오 B: 현실적 (Base Case) - S-Curve
const midpoint = totalDaysToJune / 2;
const steepness = 0.1;
const maxCapacity = targetMAU * 1.5;

const sCurveGrowth = (days) => {
  return maxCapacity / (1 + Math.exp(-steepness * (days - midpoint)));
};

const currentSCurve = sCurveGrowth(daysFromLaunch);
const futureSCurve = sCurveGrowth(daysFromLaunch + daysUntilJune);
const realisticMAU = Math.round(currentMAU + (futureSCurve - currentSCurve));

// 시나리오 C: 낙관적 (Best Case) - 지수 + 바이럴
const weeklyGrowthRate = recentWeekGrowth / 7;
const viralMultiplier = Math.max(1.0, growthAcceleration);
const weeksUntilJune = Math.ceil(daysUntilJune / 7);

let optimisticMAU = currentMAU;
for (let week = 0; week < weeksUntilJune; week++) {
  const weeklyAdd = weeklyGrowthRate * 7 * Math.pow(viralMultiplier, week * 0.1);
  optimisticMAU += weeklyAdd;
}
optimisticMAU = Math.round(optimisticMAU);

// 3️⃣ 각 시나리오별 달성 확률
const pessimisticProb = Math.min(100, Math.max(0, (pessimisticMAU / targetMAU * 100)));
const realisticProb = Math.min(100, Math.max(0, (realisticMAU / targetMAU * 100)));
const optimisticProb = Math.min(100, Math.max(0, (optimisticMAU / targetMAU * 100)));

// 4️⃣ 가중 평균 확률
const weightedProb = ((pessimisticProb * 0.2) + (realisticProb * 0.6) + (optimisticProb * 0.2)).toFixed(0);

// 5️⃣ 필요 vs 현재 성장률
const requiredDailyGrowth = (targetMAU - currentMAU) / daysUntilJune;
const currentDailyGrowth = linearGrowthRate;
const growthGap = requiredDailyGrowth - currentDailyGrowth;
const isOnTrack = growthGap <= 0;

// 6️⃣ 트렌드 방향
let trendIndicator = '→';
let trendText = '정체';
let trendColor = 'var(--yellow)';

if (growthAcceleration > 1.2) {
  trendIndicator = '↗';
  trendText = '가속';
  trendColor = 'var(--green)';
} else if (growthAcceleration < 0.8) {
  trendIndicator = '↘';
  trendText = '둔화';
  trendColor = 'var(--red)';
}

// 하위 호환성 (기존 변수명)
const growthRate = linearGrowthRate;
const predictedMAU = Math.round(realisticMAU);
const achievementProb = weightedProb;
