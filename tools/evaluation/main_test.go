package main

import (
	"math"
	"testing"
)

func close(actual, expected float64) bool {
	return math.Abs(actual-expected) < 1e-6
}

func TestSpearmanPerfectAndReversed(t *testing.T) {
	rising, err := spearman([]float64{1, 2, 3, 4}, []float64{10, 20, 30, 40})
	if err != nil {
		t.Fatal(err)
	}
	if !close(rising, 1) {
		t.Fatalf("a rising series should be 1, got %v", rising)
	}

	falling, err := spearman([]float64{1, 2, 3, 4}, []float64{40, 30, 20, 10})
	if err != nil {
		t.Fatal(err)
	}
	if !close(falling, -1) {
		t.Fatalf("a falling series should be -1, got %v", falling)
	}
}

func TestSpearmanAveragesTiedRanks(t *testing.T) {
	value, err := spearman([]float64{1, 2, 2, 3}, []float64{1, 2, 3, 4})
	if err != nil {
		t.Fatal(err)
	}
	if !close(value, 0.948683) {
		t.Fatalf("expected 0.948683 with average ranks, got %v", value)
	}
}

func TestSpearmanRefusesFlatOrShortSeries(t *testing.T) {
	if _, err := spearman([]float64{1, 2}, []float64{1, 2}); err == nil {
		t.Fatal("two pairs should be refused")
	}
	if _, err := spearman([]float64{1, 1, 1}, []float64{1, 2, 3}); err == nil {
		t.Fatal("a flat series should be refused")
	}
}

func TestKappaOnTheKnownTwoByTwo(t *testing.T) {
	machine := []bool{}
	human := []bool{}
	for i := 0; i < 20; i++ {
		machine = append(machine, true)
		human = append(human, true)
	}
	for i := 0; i < 5; i++ {
		machine = append(machine, true)
		human = append(human, false)
	}
	for i := 0; i < 10; i++ {
		machine = append(machine, false)
		human = append(human, true)
	}
	for i := 0; i < 15; i++ {
		machine = append(machine, false)
		human = append(human, false)
	}
	value, err := kappa(machine, human)
	if err != nil {
		t.Fatal(err)
	}
	if !close(value, 0.4) {
		t.Fatalf("the textbook example is 0.4, got %v", value)
	}
}

func TestKappaRefusesOneCategory(t *testing.T) {
	if _, err := kappa([]bool{true, true}, []bool{true, true}); err == nil {
		t.Fatal("kappa is undefined when everything passes")
	}
}

func TestWeightsMustBeFiveAndTotalOne(t *testing.T) {
	if _, err := weightsFrom("0.1,0.2,0.2,0.15"); err == nil {
		t.Fatal("four weights should be refused")
	}
	if _, err := weightsFrom("0.1,0.2,0.2,0.15,0.2"); err == nil {
		t.Fatal("weights that total 0.85 should be refused")
	}
	weights, err := weightsFrom("0.1,0.2,0.2,0.15,0.35")
	if err != nil {
		t.Fatal(err)
	}
	if !close(weights[4], 0.35) {
		t.Fatalf("expected the last weight to be 0.35, got %v", weights[4])
	}
}

func TestParseRowRefusesARatingOffTheScale(t *testing.T) {
	good := []string{"d1", "social_caption", "4", "5", "0.8", "0.8", "0.8", "0.8", "1.0"}
	if _, err := parseRow(good, 2); err != nil {
		t.Fatalf("a valid row was refused: %v", err)
	}
	bad := []string{"d1", "social_caption", "4", "6", "0.8", "0.8", "0.8", "0.8", "1.0"}
	if _, err := parseRow(bad, 2); err == nil {
		t.Fatal("a rater score of 6 should be refused")
	}
	short := []string{"d1", "social_caption", "4"}
	if _, err := parseRow(short, 2); err == nil {
		t.Fatal("a row with a missing column should be refused")
	}
}

func TestSummariseNamesTheMetricThatMovesAgainstTheRater(t *testing.T) {
	rows := []row{
		{raterScore: 5, metrics: [4]float64{0.9, 0.9, 0.1, 1.0}},
		{raterScore: 4, metrics: [4]float64{0.7, 0.8, 0.3, 0.8}},
		{raterScore: 3, metrics: [4]float64{0.6, 0.6, 0.6, 0.5}},
		{raterScore: 2, metrics: [4]float64{0.5, 0.4, 0.8, 0.3}},
		{raterScore: 1, metrics: [4]float64{0.4, 0.3, 1.0, 0.0}},
	}
	overall := []float64{0.9, 0.75, 0.55, 0.35, 0.2}
	out, err := summarise(rows, overall, 0.6)
	if err != nil {
		t.Fatal(err)
	}
	if metricNames[out.weakest] != "keyword" {
		t.Fatalf("keyword should be the weakest, got %s", metricNames[out.weakest])
	}
	if out.correlation[2] >= 0 {
		t.Fatalf("keyword moves with the rater in reverse, got %v", out.correlation[2])
	}
	if out.count != 5 || out.machinePass != 2 || out.humanPass != 2 || out.both != 2 {
		t.Fatalf(
			"unexpected counts: count %d machine %d human %d both %d",
			out.count, out.machinePass, out.humanPass, out.both,
		)
	}
}
