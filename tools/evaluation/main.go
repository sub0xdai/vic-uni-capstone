package main

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"
	"strconv"
	"strings"
)

type row struct {
	id           string
	content      string
	raterScore   float64
	overall      float64
	metrics      [4]float64
	satisfaction float64
}

var metricNames = [4]string{"readability", "tone", "keyword", "structure"}

var csvHeader = []string{
	"id", "content_type", "owner_rating", "rater_rating",
	"machine_overall", "readability", "tone", "keyword", "structure",
}

func parseRow(record []string, line int) (row, error) {
	if len(record) != len(csvHeader) {
		return row{}, fmt.Errorf(
			"line %d: expected %d columns, found %d", line, len(csvHeader), len(record),
		)
	}
	rater, err := parseScore(record[3], "rater_rating", line, 1, 5)
	if err != nil {
		return row{}, err
	}
	overall, err := parseScore(record[4], "machine_overall", line, 0, 1)
	if err != nil {
		return row{}, err
	}
	satisfaction := 0.5
	if strings.TrimSpace(record[2]) != "" {
		owner, err := parseScore(record[2], "owner_rating", line, 1, 5)
		if err != nil {
			return row{}, err
		}
		satisfaction = owner / 5
	}
	out := row{
		id: record[0], content: record[1], raterScore: rater,
		overall: overall, satisfaction: satisfaction,
	}
	for i := range out.metrics {
		value, err := parseScore(record[5+i], metricNames[i], line, 0, 1)
		if err != nil {
			return row{}, err
		}
		out.metrics[i] = value
	}
	return out, nil
}

func parseScore(text, name string, line int, low, high float64) (float64, error) {
	value, err := strconv.ParseFloat(strings.TrimSpace(text), 64)
	if err != nil {
		return 0, fmt.Errorf("line %d: %s is not a number: %q", line, name, text)
	}
	if value < low || value > high {
		return 0, fmt.Errorf("line %d: %s is %v, expected %v to %v", line, name, value, low, high)
	}
	return value, nil
}

func readSample(path string) ([]row, error) {
	handle, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer handle.Close()

	reader := csv.NewReader(handle)
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("could not read the header: %w", err)
	}
	if strings.Join(header, ",") != strings.Join(csvHeader, ",") {
		return nil, fmt.Errorf("unexpected header, expected %q", strings.Join(csvHeader, ","))
	}

	rows := make([]row, 0, 64)
	for line := 2; ; line++ {
		record, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("line %d: %w", line, err)
		}
		parsed, err := parseRow(record, line)
		if err != nil {
			return nil, err
		}
		rows = append(rows, parsed)
	}
	if len(rows) < 3 {
		return nil, fmt.Errorf("a sample needs at least 3 drafts, found %d", len(rows))
	}
	return rows, nil
}

func averageRanks(values []float64) []float64 {
	order := make([]int, len(values))
	for i := range order {
		order[i] = i
	}
	sort.SliceStable(order, func(a, b int) bool { return values[order[a]] < values[order[b]] })

	ranks := make([]float64, len(values))
	for i := 0; i < len(order); {
		j := i
		for j+1 < len(order) && values[order[j+1]] == values[order[i]] {
			j++
		}
		shared := float64(i+j)/2 + 1
		for k := i; k <= j; k++ {
			ranks[order[k]] = shared
		}
		i = j + 1
	}
	return ranks
}

func spearman(a, b []float64) (float64, error) {
	if len(a) != len(b) {
		return 0, fmt.Errorf("spearman needs equal lengths, got %d and %d", len(a), len(b))
	}
	if len(a) < 3 {
		return 0, fmt.Errorf("spearman needs at least 3 pairs, got %d", len(a))
	}
	ra := averageRanks(a)
	rb := averageRanks(b)
	meanA, meanB := 0.0, 0.0
	for i := range ra {
		meanA += ra[i]
		meanB += rb[i]
	}
	meanA /= float64(len(ra))
	meanB /= float64(len(rb))

	covariance, varianceA, varianceB := 0.0, 0.0, 0.0
	for i := range ra {
		da := ra[i] - meanA
		db := rb[i] - meanB
		covariance += da * db
		varianceA += da * da
		varianceB += db * db
	}
	if varianceA == 0 || varianceB == 0 {
		return 0, fmt.Errorf("spearman needs variation in both series")
	}
	return covariance / (sqrt(varianceA) * sqrt(varianceB)), nil
}

func sqrt(value float64) float64 {
	if value <= 0 {
		return 0
	}
	guess := value
	for i := 0; i < 40; i++ {
		guess = (guess + value/guess) / 2
	}
	return guess
}

func kappa(machinePass, humanPass []bool) (float64, error) {
	if len(machinePass) != len(humanPass) {
		return 0, fmt.Errorf("kappa needs equal lengths, got %d and %d", len(machinePass), len(humanPass))
	}
	if len(machinePass) == 0 {
		return 0, fmt.Errorf("kappa needs at least one pair")
	}
	both, machineOnly, humanOnly := 0, 0, 0
	for i := range machinePass {
		switch {
		case machinePass[i] && humanPass[i]:
			both++
		case machinePass[i]:
			machineOnly++
		case humanPass[i]:
			humanOnly++
		}
	}
	total := float64(len(machinePass))
	observed := (float64(both) + float64(len(machinePass)-both-machineOnly-humanOnly)) / total
	machineRate := float64(both+machineOnly) / total
	humanRate := float64(both+humanOnly) / total
	expected := machineRate*humanRate + (1-machineRate)*(1-humanRate)
	if expected == 1 {
		return 0, fmt.Errorf("kappa is undefined when both raters use one category")
	}
	return (observed - expected) / (1 - expected), nil
}

func weightsFrom(text string) ([5]float64, error) {
	var weights [5]float64
	parts := strings.Split(text, ",")
	if len(parts) != len(weights) {
		return weights, fmt.Errorf("expected 5 weights, found %d", len(parts))
	}
	total := 0.0
	for i, part := range parts {
		value, err := strconv.ParseFloat(strings.TrimSpace(part), 64)
		if err != nil {
			return weights, fmt.Errorf("weight %d is not a number: %q", i+1, part)
		}
		if value < 0 {
			return weights, fmt.Errorf("weight %d is negative: %v", i+1, value)
		}
		weights[i] = value
		total += value
	}
	if total < 0.999999 || total > 1.000001 {
		return weights, fmt.Errorf("weights total %v, expected 1", total)
	}
	return weights, nil
}

func weightedOverall(r row, weights [5]float64) float64 {
	total := r.satisfaction * weights[4]
	for i := range r.metrics {
		total += r.metrics[i] * weights[i]
	}
	return total
}

type report struct {
	count       int
	content     map[string]int
	correlation [4]float64
	weakest     int
	kappa       float64
	machinePass int
	humanPass   int
	both        int
}

func summarise(rows []row, overall []float64, threshold float64) (report, error) {
	out := report{count: len(rows), content: map[string]int{}, weakest: 0}
	rater := make([]float64, len(rows))
	machine := make([]bool, len(rows))
	human := make([]bool, len(rows))
	for i, r := range rows {
		rater[i] = r.raterScore
		machine[i] = overall[i] >= threshold
		human[i] = r.raterScore >= 4
		out.content[r.content]++
		if machine[i] {
			out.machinePass++
		}
		if human[i] {
			out.humanPass++
		}
		if machine[i] && human[i] {
			out.both++
		}
	}
	for i := range out.correlation {
		series := make([]float64, len(rows))
		for j, r := range rows {
			series[j] = r.metrics[i]
		}
		value, err := spearman(series, rater)
		if err != nil {
			return out, fmt.Errorf("%s: %w", metricNames[i], err)
		}
		out.correlation[i] = value
		if value < out.correlation[out.weakest] {
			out.weakest = i
		}
	}
	value, err := kappa(machine, human)
	if err != nil {
		return out, err
	}
	out.kappa = value
	return out, nil
}

func printReport(out report, label string) {
	fmt.Printf("\n%s\n", label)
	fmt.Printf("  drafts in sample      %d\n", out.count)
	for _, name := range []string{"blog_outline", "social_caption", "email_newsletter"} {
		if count := out.content[name]; count > 0 {
			fmt.Printf("  %-21s %d\n", name, count)
		}
	}
	fmt.Printf("\n  rank correlation with the independent rater\n")
	for i, name := range metricNames {
		marker := " "
		if i == out.weakest {
			marker = "<"
		}
		fmt.Printf("    %s %-12s %+.3f\n", marker, name, out.correlation[i])
	}
	fmt.Printf("\n  pass at the threshold\n")
	fmt.Printf(
		"    machine pass %d, rater pass %d, both %d\n",
		out.machinePass, out.humanPass, out.both,
	)
	fmt.Printf("    kappa %+.3f\n", out.kappa)
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "evaluation: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	path := ""
	thresholdText := "0.6"
	weightsText := ""
	for i := 1; i < len(os.Args); i++ {
		switch {
		case strings.HasPrefix(os.Args[i], "-csv="):
			path = strings.TrimPrefix(os.Args[i], "-csv=")
		case strings.HasPrefix(os.Args[i], "-threshold="):
			thresholdText = strings.TrimPrefix(os.Args[i], "-threshold=")
		case strings.HasPrefix(os.Args[i], "-weights="):
			weightsText = strings.TrimPrefix(os.Args[i], "-weights=")
		default:
			path = os.Args[i]
		}
	}
	if path == "" {
		return fmt.Errorf("usage: evaluate -csv=sample.csv [-threshold=0.6] " +
			"[-weights=0.1,0.2,0.2,0.15,0.35]")
	}
	threshold, err := strconv.ParseFloat(thresholdText, 64)
	if err != nil || threshold <= 0 || threshold >= 1 {
		return fmt.Errorf("threshold %q is not a number between 0 and 1", thresholdText)
	}
	rows, err := readSample(path)
	if err != nil {
		return err
	}

	stored := make([]float64, len(rows))
	for i, r := range rows {
		stored[i] = r.overall
	}
	current, err := summarise(rows, stored, threshold)
	if err != nil {
		return err
	}
	printReport(current, "as stored")
	if current.count < 20 {
		fmt.Printf(
			"\n  warning: %d drafts is a small sample; treat every number above as a hint\n",
			current.count,
		)
	}
	if len(rows) > 0 && current.correlation[current.weakest] < 0 {
		fmt.Printf(
			"  warning: the weakest metric moves against the rater, which is worse than noise\n",
		)
	}

	if weightsText == "" {
		return nil
	}
	weights, err := weightsFrom(weightsText)
	if err != nil {
		return err
	}
	candidate := make([]float64, len(rows))
	for i, r := range rows {
		candidate[i] = weightedOverall(r, weights)
	}
	proposed, err := summarise(rows, candidate, threshold)
	if err != nil {
		return err
	}
	printReport(proposed, "with the candidate weights "+weightsText)
	fmt.Printf("\n  change in kappa %+.3f, weakest metric in both cases: %s (%v)\n",
		proposed.kappa-current.kappa,
		metricNames[proposed.weakest],
		proposed.weakest == current.weakest)
	return nil
}
