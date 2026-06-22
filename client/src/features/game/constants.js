export const chartOptions = {
  animations: {
    x: {
      duration: 1000,
    },
    y: {
      duration: 0,
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      min: 0.6,
    },
  },
  plugins: {
    legend: {
      onClick: () => {},
    },
  },
};

export const trainingTimeLimitMs = 15 * 60 * 1000;
export const gameTimeLimitMs = 60 * 60 * 1000;
export const speedOptions = [0.5, 1, 1.5, 2];
