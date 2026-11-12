package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	headingRe = regexp.MustCompile(`^#\s*(.*)$`)
	numberRe  = regexp.MustCompile(`^(\d+(?:\.\d+)*)\s*[-.]?\s*(.+)$`)
	linkRe    = regexp.MustCompile(`(?:docs/)?assets/media/`)
	tocRe     = regexp.MustCompile(`^\[\*\*`)
)

type chunk struct {
	number string
	title  string
	body   []string
}

func die(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "extract:", err)
		os.Exit(1)
	}
}

func slug(s string) string {
	var b strings.Builder
	lastDash := true
	for _, r := range strings.ToLower(s) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash {
			b.WriteByte('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func clean(s string) string {
	s = strings.TrimSpace(s)
	return strings.TrimSpace(strings.ReplaceAll(s, "**", ""))
}

func convert(docx string, assets string) (string, error) {
	if _, err := os.Stat(docx); err != nil {
		return "", err
	}
	out, err := exec.Command("pandoc", docx, "-t", "gfm", "--extract-media="+assets).Output()
	if err != nil {
		return "", fmt.Errorf("pandoc: %w", err)
	}
	if len(out) == 0 {
		return "", errors.New("pandoc produced empty output")
	}
	return string(out), nil
}

func body(raw string) (front []string, rest []string) {
	lines := strings.Split(raw, "\n")
	start := -1
	for i, l := range lines {
		if tocRe.MatchString(l) {
			start = i
			break
		}
	}
	if start == -1 {
		start = len(lines)
	}
	for i := start; i < len(lines); i++ {
		if headingRe.MatchString(lines[i]) {
			return lines[:start], lines[i:]
		}
	}
	return lines[:start], nil
}

func normalize(lines []string) []string {
	out := make([]string, 0, len(lines)+2)
	parent := false
	for _, raw := range lines {
		l := strings.TrimRight(raw, " \t")
		if l == "9.1 Risk Identification" {
			l = "# 9.1 Risk Identification"
		}
		if strings.HasPrefix(l, "# 5.1 ") && !parent {
			parent = true
			out = append(out, "# 5 Sequence Diagrams", "")
		}
		out = append(out, l)
	}
	return out
}

func split(lines []string) []chunk {
	chunks := []chunk{{number: "00", title: "front matter"}}
	ordinal := 0
	for _, raw := range lines {
		m := headingRe.FindStringSubmatch(raw)
		if m == nil {
			chunks[len(chunks)-1].body = append(chunks[len(chunks)-1].body, raw)
			continue
		}
		label := clean(m[1])
		if label == "" {
			continue
		}
		depth, number, title := 1, "", label
		if n := numberRe.FindStringSubmatch(label); n != nil {
			number, title = n[1], clean(n[2])
			depth += strings.Count(number, ".")
		}
		if depth == 1 {
			ordinal++
			if number == "" {
				number = fmt.Sprintf("%02d", ordinal)
			}
			if len(number) == 1 {
				number = "0" + number
			}
			chunks = append(chunks, chunk{number: number, title: title})
			chunks[len(chunks)-1].body = append(chunks[len(chunks)-1].body,
				fmt.Sprintf("## %s %s", strings.TrimLeft(number, "0"), title), "")
			continue
		}
		head := strings.Repeat("#", depth+1)
		if number != "" {
			head += " " + number
		}
		chunks[len(chunks)-1].body = append(chunks[len(chunks)-1].body, head+" "+title, "")
	}
	return chunks
}

func write(dir string, chunks []chunk) ([]string, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	names := make([]string, 0, len(chunks))
	for _, c := range chunks {
		name := fmt.Sprintf("%s-%s.md", c.number, slug(c.title))
		text := strings.TrimRight(strings.Join(c.body, "\n"), "\n") + "\n"
		text = linkRe.ReplaceAllString(text, "../assets/media/")
		text = regexp.MustCompile(`\n{4,}`).ReplaceAllString(text, "\n\n\n")
		if err := os.WriteFile(filepath.Join(dir, name), []byte(text), 0o644); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, nil
}

func main() {
	docx := flag.String("docx", "docs/project_proposal_complete.docx", "source docx")
	out := flag.String("out", "docs/sections", "output directory")
	assets := flag.String("assets", "docs/assets", "extracted media directory")
	flag.Parse()

	raw, err := convert(*docx, *assets)
	die(err)

	front, rest := body(raw)
	if len(rest) == 0 {
		die(errors.New("no body headings found"))
	}

	chunks := split(normalize(rest))
	chunks[0].body = front
	if len(front) == 0 {
		die(errors.New("front matter is empty"))
	}

	names, err := write(*out, chunks)
	die(err)
	if len(names) < 12 {
		die(fmt.Errorf("expected at least 12 sections, wrote %d", len(names)))
	}
	fmt.Printf("wrote %d files to %s\n", len(names), *out)
	for _, n := range names {
		fmt.Println(" ", n)
	}
}
