package lib

import "math"

func MeanAndStdev(values []float64) (mean float64, stdev float64) {
	if len(values) == 0 {
		return
	}

	var sum float64
	for _, val := range values {
		sum += val
	}
	mean = sum / float64(len(values))

	var sumDiffs float64
	for _, val := range values {
		sumDiffs += math.Pow(val-mean, 2)
	}

	stdev = math.Pow(sumDiffs/float64(len(values)), 0.5)

	return
}
