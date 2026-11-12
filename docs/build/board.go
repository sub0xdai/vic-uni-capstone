package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

const (
	planPath     = "docs/plan/build-plan.md"
	projectNum   = "1"
	owner        = "sub0xdai"
	orchestrator = "Daniel"
	loginDaniel  = "sub0xdai"
	loginSemir   = "rimez-max"
	loginHailu   = "Mostx33"
	loginJamal   = "Jhusvex"
)

type card struct {
	column string
	id     string
	title  string
	owner  string
	file   string
	done   string
	due    string
}

type columnSpec struct {
	heading string
	column  string
	label   string
	open    bool
	width   int
}

var columns = []columnSpec{
	{"### To do", "todo", "todo", true, 6},
	{"### In progress", "in-progress", "in-progress", true, 6},
	{"### Done", "done", "done", false, 3},
}

var labels = []struct{ name, color, desc string }{
	{"todo", "FFD700", "Not started"},
	{"in-progress", "1D76DB", "Being worked on"},
	{"done", "0E8E16", "Complete"},
	{"owner-daniel", "5319E7", "Daniel"},
	{"owner-semir", "C5DEF5", "Semir"},
	{"owner-hailu", "C5DEF5", "Hailu"},
	{"owner-jamal", "C5DEF5", "Jamal"},
}

func fail(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "board:", err)
		os.Exit(1)
	}
}

func invariant(condition bool, detail string) {
	if !condition {
		panic("board invariant failed: " + detail)
	}
}

func run(args ...string) (string, error) {
	invariant(len(args) >= 2, "run called without a command")
	out, err := exec.Command("gh", args...).CombinedOutput()
	text := strings.TrimSpace(string(out))
	if err != nil {
		return "", fmt.Errorf("gh %s: %w: %s", strings.Join(args[:2], " "), err, text)
	}
	return text, nil
}

func cells(line string) []string {
	trimmed := strings.TrimSpace(line)
	invariant(strings.HasPrefix(trimmed, "|"), "row does not start with a pipe")
	trimmed = strings.TrimSuffix(strings.TrimPrefix(trimmed, "|"), "|")
	parts := strings.Split(trimmed, "|")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		out = append(out, strings.TrimSpace(part))
	}
	invariant(len(out) > 0, "row produced no cells")
	return out
}

func isSeparator(row []string) bool {
	invariant(len(row) > 0, "separator check on an empty row")
	for _, cell := range row {
		if strings.Trim(cell, "-: ") != "" {
			return false
		}
	}
	return true
}

func specFor(column string) columnSpec {
	for _, spec := range columns {
		if spec.column == column {
			invariant(spec.width > 0, "column spec has no width")
			return spec
		}
	}
	panic("board invariant failed: unknown column " + column)
}

func parse(plan string) []card {
	found := make([]card, 0, 48)
	active := -1
	for _, line := range strings.Split(plan, "\n") {
		trimmed := strings.TrimSpace(line)
		for i, spec := range columns {
			if trimmed == spec.heading {
				active = i
			}
		}
		if active < 0 || !strings.HasPrefix(trimmed, "|") {
			continue
		}
		row := cells(trimmed)
		spec := columns[active]
		if row[0] == "ID" || isSeparator(row) || len(row) < spec.width {
			continue
		}
		entry := card{column: spec.column, id: row[0], title: row[1]}
		if spec.open {
			entry.owner, entry.file, entry.done, entry.due = row[2], row[3], row[4], row[5]
		} else {
			entry.owner, entry.file, entry.done = orchestrator, "already complete", row[2]
		}
		invariant(entry.id != "" && entry.title != "", "card is missing an id or title")
		found = append(found, entry)
	}
	invariant(len(found) >= 10, fmt.Sprintf("only parsed %d cards", len(found)))
	return found
}

func ownerLabel(who string) string {
	switch strings.ToLower(strings.TrimSpace(who)) {
	case "daniel", "sub0xdai", "you":
		return "owner-daniel"
	case "semir", "a":
		return "owner-semir"
	case "hailu", "b":
		return "owner-hailu"
	case "jamal", "c":
		return "owner-jamal"
	default:
		return ""
	}
}

func assigneeFor(who string) string {
	trimmed := strings.ToLower(strings.TrimSpace(who))
	invariant(trimmed != "", "assignee lookup on an empty owner")
	switch trimmed {
	case "daniel", "sub0xdai", "you", "a":
		return loginDaniel
	case "semir", "b":
		return loginSemir
	case "hailu", "c":
		return loginHailu
	case "jamal":
		return loginJamal
	default:
		return ""
	}
}

func (s *syncer) body(entry card) string {
	if section := sectionBody(s.plan, entry.title); section != "" {
		return section
	}
	return tableBody(entry)
}

func tableBody(entry card) string {
	if !specFor(entry.column).open {
		return fmt.Sprintf("%s\n\nClosed on creation, the work is already done.\n\nFrom %s",
			entry.done, planPath)
	}
	return fmt.Sprintf("Owner: %s\nFile: %s\nDone when: %s\nTarget: %s\n\nFrom %s",
		entry.owner, entry.file, entry.done, entry.due, planPath)
}

func (s *syncer) syncOwnerLabel(ref issueRef, entry card) error {
	want := ownerLabel(entry.owner)
	if s.dry || want == "" {
		return nil
	}
	present := false
	args := []string{"issue", "edit", ref.URL}
	for _, have := range ref.Labels {
		if have == want {
			present = true
		}
	}
	for _, have := range ref.Labels {
		if strings.HasPrefix(have, "owner-") && have != want {
			args = append(args, "--remove-label", have)
		}
	}
	if !present {
		args = append(args, "--add-label", want)
	}
	if len(args) == 3 {
		return nil
	}
	if _, err := run(args...); err != nil {
		return err
	}
	s.relabelled++
	return nil
}

func (s *syncer) syncBody(ref issueRef, entry card) error {
	want := s.body(entry)
	if s.dry || ref.Body == want {
		return nil
	}
	if _, err := run("issue", "edit", ref.URL, "--body", want); err != nil {
		return err
	}
	s.updated++
	return nil
}

func ensureLabels() {
	for _, spec := range labels {
		_, err := run("label", "create", spec.name, "--color", spec.color, "--description", spec.desc)
		if err != nil && !strings.Contains(err.Error(), "already exists") {
			fail(err)
		}
	}
}

func existingIssues() map[string]issueRef {
	fields := "title,url,state,body,labels,assignees"
	raw, err := run("issue", "list", "--state", "all", "--limit", "500", "--json", fields)
	fail(err)
	var rows []struct {
		Title     string `json:"title"`
		URL       string `json:"url"`
		State     string `json:"state"`
		Body      string `json:"body"`
		Labels    []struct {
			Name string `json:"name"`
		} `json:"labels"`
		Assignees []struct {
			Login string `json:"login"`
		} `json:"assignees"`
	}
	fail(json.Unmarshal([]byte(raw), &rows))
	refs := make(map[string]issueRef, len(rows))
	for _, row := range rows {
		ref := issueRef{URL: row.URL, State: row.State, Body: row.Body}
		for _, label := range row.Labels {
			ref.Labels = append(ref.Labels, label.Name)
		}
		for _, who := range row.Assignees {
			ref.Assignees = append(ref.Assignees, who.Login)
		}
		refs[row.Title] = ref
	}
	return refs
}

func sectionBody(plan string, title string) string {
	invariant(title != "", "sectionBody called without a title")
	lines := strings.Split(plan, "\n")
	marker := "### " + title
	start := -1
	for i, line := range lines {
		if strings.TrimSpace(line) == marker {
			start = i + 1
			break
		}
	}
	if start < 0 {
		return ""
	}
	out := make([]string, 0, 32)
	for _, line := range lines[start:] {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "### ") || strings.HasPrefix(trimmed, "## ") {
			break
		}
		out = append(out, line)
	}
	return strings.TrimSpace(strings.Join(out, "\n"))
}

type issueRef struct {
	URL       string
	State     string
	Body      string
	Labels    []string
	Assignees []string
}

type syncer struct {
	dry        bool
	onBoard    bool
	plan       string
	refs       map[string]issueRef
	created    int
	existed    int
	doneCards  int
	attached   int
	assigned   int
	closed     int
	updated    int
	relabelled int
}

func (s *syncer) create(entry card) (string, error) {
	spec := specFor(entry.column)
	title := entryTitle(entry)
	args := []string{"issue", "create", "--title", title, "--body", s.body(entry),
		"--label", spec.label}
	if label := ownerLabel(entry.owner); label != "" {
		args = append(args, "--label", label)
	}
	if who := assigneeFor(entry.owner); who != "" {
		args = append(args, "--assignee", who)
	}
	link, err := run(args...)
	if err != nil {
		return "", err
	}
	invariant(strings.HasPrefix(link, "http"), "issue create did not return a url")
	s.refs[title] = issueRef{URL: link, State: "OPEN"}
	s.created++
	return link, nil
}

func (s *syncer) closeCard(link string, alreadyClosed bool) error {
	if s.dry || alreadyClosed {
		return nil
	}
	if _, err := run("issue", "close", link); err != nil {
		if strings.Contains(err.Error(), "already") {
			return nil
		}
		return err
	}
	s.closed++
	return nil
}

func (s *syncer) assign(ref issueRef, entry card) error {
	want := assigneeFor(entry.owner)
	if s.dry || want == "" {
		return nil
	}
	present := false
	args := []string{"issue", "edit", ref.URL}
	for _, have := range ref.Assignees {
		if have == want {
			present = true
		}
	}
	for _, have := range ref.Assignees {
		if have != want {
			args = append(args, "--remove-assignee", have)
		}
	}
	if !present {
		args = append(args, "--add-assignee", want)
	}
	if len(args) == 3 {
		return nil
	}
	if _, err := run(args...); err != nil {
		return err
	}
	s.assigned++
	return nil
}

func (s *syncer) attach(link string) error {
	if !s.onBoard {
		return nil
	}
	if _, err := run("project", "item-add", projectNum, "--owner", owner, "--url", link); err != nil {
		if strings.Contains(err.Error(), "scope") {
			s.onBoard = false
			fmt.Println()
			fmt.Println("NOTE board needs project scope, run: gh auth refresh -s project")
			fmt.Println("     then run this tool again to attach everything created so far")
			fmt.Println()
			return nil
		}
		if strings.Contains(err.Error(), "already") {
			return nil
		}
		return err
	}
	s.attached++
	return nil
}

func entryTitle(entry card) string {
	title := fmt.Sprintf("[%s] %s", entry.id, entry.title)
	invariant(strings.HasPrefix(title, "["), "card title is malformed")
	return title
}

func main() {
	dryRun := flag.Bool("dry-run", false, "print what would happen and change nothing")
	includeDone := flag.Bool("include-done", false, "also create closed cards for the DONE column")
	flag.Parse()

	raw, err := os.ReadFile(planPath)
	fail(err)
	invariant(len(raw) > 0, "plan file is empty")

	s := &syncer{dry: *dryRun, onBoard: !*dryRun, plan: string(raw), refs: existingIssues()}
	if !*dryRun {
		ensureLabels()
	}

	for _, entry := range parse(string(raw)) {
		spec := specFor(entry.column)
		if !spec.open && !*includeDone {
			s.doneCards++
			continue
		}
		title := entryTitle(entry)
		ref, known := s.refs[title]
		if *dryRun {
			verb := "would create"
			if known {
				verb = "would attach"
				s.existed++
			} else {
				s.created++
			}
			s.attached++
			fmt.Printf("%s  %-11s %s\n", verb, entry.column, title)
			continue
		}
		if !known {
			ref = issueRef{URL: "", State: "OPEN"}
			if _, err := s.create(entry); err != nil {
				fail(err)
			}
			ref = s.refs[title]
			fmt.Printf("created   %-11s %s\n", entry.column, title)
		} else {
			s.existed++
		}
		fail(s.syncBody(ref, entry))
		fail(s.syncOwnerLabel(ref, entry))
		fail(s.assign(ref, entry))
		fail(s.attach(ref.URL))
		if !spec.open {
			fail(s.closeCard(ref.URL, ref.State == "CLOSED"))
		}
	}

	fmt.Printf("\ncreated %d, existed %d, done skipped %d, closed %d\n",
		s.created, s.existed, s.doneCards, s.closed)
	fmt.Printf("bodies %d, relabelled %d, assigned %d, attached %d\n",
		s.updated, s.relabelled, s.assigned, s.attached)
	if *dryRun {
		fmt.Println("dry run, nothing was written")
	}
}
