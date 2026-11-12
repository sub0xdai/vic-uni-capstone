package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type config struct {
	base     string
	anon     string
	emailA   string
	emailB   string
	password string
	timeout  time.Duration
}

type session struct {
	token  string
	userID string
}

type observation struct {
	aliceRows    int
	aliceName    string
	bobRows      int
	bobName      string
	anonRows     int
	insertStatus int
	insertBody   string
	patchStatus  int
	bobNameAfter string
}

type check struct {
	name   string
	actual string
	detail string
	ok     bool
}

func main() {
	cfg, err := parseFlags(os.Args[1:])
	if err != nil {
		fmt.Fprintf(os.Stderr, "tenancy: %v\n", err)
		os.Exit(2)
	}
	observed, err := run(cfg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "tenancy: %v\n", err)
		os.Exit(2)
	}
	fmt.Printf("\ntenancy check against %s\n\n", cfg.base)
	results := verdicts(observed)
	passed := 0
	for _, result := range results {
		mark := "ok"
		if !result.ok {
			mark = "FAILED"
		} else {
			passed++
		}
		fmt.Printf("  %-27s %-36s %s\n", result.name, result.actual, mark)
		if result.detail != "" {
			fmt.Printf("      %s\n", result.detail)
		}
	}
	fmt.Printf("\n  %d checks, %d ok\n\n", len(results), passed)
	if passed != len(results) {
		os.Exit(1)
	}
}

func parseFlags(args []string) (config, error) {
	var cfg config
	var envPath string
	flags := flag.NewFlagSet("tenancy", flag.ContinueOnError)
	flags.StringVar(&envPath, "env", "", "path to a .env file holding the project URL and key")
	flags.StringVar(&cfg.base, "base", "", "project URL, overrides -env")
	flags.StringVar(&cfg.anon, "anon", "", "public key, overrides -env")
	flags.StringVar(&cfg.emailA, "email-a", "rls-probe2-alice@example.com", "first account")
	flags.StringVar(&cfg.emailB, "email-b", "rls-probe2-bob@example.com", "second account")
	flags.StringVar(&cfg.password, "password", "Probe-tenancy-2026", "password for both accounts")
	flags.DurationVar(&cfg.timeout, "timeout", 20*time.Second, "per request timeout")
	if err := flags.Parse(args); err != nil {
		return cfg, err
	}
	if envPath != "" {
		values, err := loadEnvFile(envPath)
		if err != nil {
			return cfg, err
		}
		if cfg.base == "" {
			cfg.base = values["NEXT_PUBLIC_SUPABASE_URL"]
		}
		if cfg.anon == "" {
			cfg.anon = values["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
		}
	}
	cfg.base = strings.TrimRight(strings.TrimSpace(cfg.base), "/")
	if cfg.base == "" {
		return cfg, errors.New("no project URL: pass -base or -env with the Supabase URL")
	}
	if !strings.HasPrefix(cfg.base, "https://") {
		return cfg, fmt.Errorf("project URL is not https: %s", cfg.base)
	}
	if strings.TrimSpace(cfg.anon) == "" {
		return cfg, errors.New("no public key: pass -anon or a -env file holding the key")
	}
	if cfg.emailA == cfg.emailB {
		return cfg, errors.New("the two accounts have the same email")
	}
	if len(cfg.password) < 8 {
		return cfg, errors.New("the password is shorter than eight characters")
	}
	return cfg, nil
}

func loadEnvFile(path string) (map[string]string, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", path, err)
	}
	values := map[string]string{}
	for _, line := range strings.Split(string(raw), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		key, value, found := strings.Cut(trimmed, "=")
		if !found {
			continue
		}
		values[strings.TrimSpace(key)] = strings.Trim(strings.TrimSpace(value), `"'`)
	}
	if len(values) == 0 {
		return nil, fmt.Errorf("%s holds no key=value lines", path)
	}
	return values, nil
}

func run(cfg config) (observation, error) {
	alice, err := signUpOrIn(cfg, cfg.emailA)
	if err != nil {
		return observation{}, fmt.Errorf("account %s: %w", cfg.emailA, err)
	}
	bob, err := signUpOrIn(cfg, cfg.emailB)
	if err != nil {
		return observation{}, fmt.Errorf("account %s: %w", cfg.emailB, err)
	}
	if alice.userID == bob.userID {
		return observation{}, errors.New("both accounts resolved to one user id")
	}
	if err := ensureProfile(cfg, alice, "Alice Coffee Co", "Hospitality", "friendly"); err != nil {
		return observation{}, fmt.Errorf("alice profile: %w", err)
	}
	if err := ensureProfile(cfg, bob, "Bob Bakery", "Retail", "casual"); err != nil {
		return observation{}, fmt.Errorf("bob profile: %w", err)
	}

	var observed observation
	aliceRows, err := readProfiles(cfg, alice.token)
	if err != nil {
		return observed, err
	}
	observed.aliceRows, observed.aliceName = len(aliceRows), first(aliceRows)
	bobRows, err := readProfiles(cfg, bob.token)
	if err != nil {
		return observed, err
	}
	observed.bobRows, observed.bobName = len(bobRows), first(bobRows)
	anonRows, err := readProfiles(cfg, "")
	if err != nil {
		return observed, err
	}
	observed.anonRows = len(anonRows)

	trespass := fmt.Sprintf(
		`{"user_id":%q,"business_name":"Mallory Ltd","industry":"Retail",`+
			`"description":"tenancy probe","target_audience":"none","brand_tone":"casual"}`,
		alice.userID,
	)
	status, body, err := call(cfg, http.MethodPost, "/rest/v1/business_profile", bob.token, trespass)
	if err != nil {
		return observed, err
	}
	observed.insertStatus, observed.insertBody = status, body

	status, _, err = call(
		cfg,
		http.MethodPatch,
		"/rest/v1/business_profile?user_id=eq."+bob.userID,
		alice.token,
		`{"business_name":"Hijacked"}`,
	)
	if err != nil {
		return observed, err
	}
	observed.patchStatus = status
	after, err := readProfiles(cfg, bob.token)
	if err != nil {
		return observed, err
	}
	observed.bobNameAfter = first(after)
	return observed, nil
}

type profileRow struct {
	BusinessName string `json:"business_name"`
}

func first(rows []profileRow) string {
	if len(rows) == 0 {
		return "none"
	}
	return rows[0].BusinessName
}

func readProfiles(cfg config, token string) ([]profileRow, error) {
	status, body, err := call(
		cfg,
		http.MethodGet,
		"/rest/v1/business_profile?select=business_name",
		token,
		"",
	)
	if err != nil {
		return nil, err
	}
	if status != http.StatusOK {
		return nil, fmt.Errorf("reading profiles answered %d: %s", status, compress(body))
	}
	var rows []profileRow
	if err := json.Unmarshal([]byte(body), &rows); err != nil {
		return nil, fmt.Errorf("profiles response is not a row list: %w", err)
	}
	return rows, nil
}

func ensureProfile(cfg config, who session, name, industry, tone string) error {
	body := fmt.Sprintf(
		`{"user_id":%q,"business_name":%q,"industry":%q,`+
			`"description":"tenancy probe","target_audience":"local customers","brand_tone":%q}`,
		who.userID, name, industry, tone,
	)
	status, response, err := call(
		cfg,
		http.MethodPost,
		"/rest/v1/business_profile?on_conflict=user_id",
		who.token,
		body,
		"resolution=merge-duplicates",
	)
	if err != nil {
		return err
	}
	if status != http.StatusCreated && status != http.StatusOK {
		return fmt.Errorf("writing the profile answered %d: %s", status, compress(response))
	}
	return nil
}

func signUpOrIn(cfg config, email string) (session, error) {
	body := fmt.Sprintf(`{"email":%q,"password":%q}`, email, cfg.password)
	status, response, err := call(cfg, http.MethodPost, "/auth/v1/signup", "", body)
	if err != nil {
		return session{}, err
	}
	got, err := sessionFrom(status, response)
	if err == nil {
		return got, nil
	}
	status, response, err = call(
		cfg,
		http.MethodPost,
		"/auth/v1/token?grant_type=password",
		"",
		body,
	)
	if err != nil {
		return session{}, err
	}
	return sessionFrom(status, response)
}

func sessionFrom(status int, response string) (session, error) {
	if status != http.StatusOK {
		return session{}, fmt.Errorf("auth answered %d: %s", status, compress(response))
	}
	var payload struct {
		AccessToken string `json:"access_token"`
		User        struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if err := json.Unmarshal([]byte(response), &payload); err != nil {
		return session{}, fmt.Errorf("auth response is not JSON: %w", err)
	}
	if payload.AccessToken == "" || payload.User.ID == "" {
		return session{}, errors.New("auth answered without a token or a user id")
	}
	return session{token: payload.AccessToken, userID: payload.User.ID}, nil
}

func call(cfg config, method, path, token, body string, prefer ...string) (int, string, error) {
	request, err := http.NewRequest(method, cfg.base+path, bytes.NewBufferString(body))
	if err != nil {
		return 0, "", err
	}
	request.Header.Set("apikey", cfg.anon)
	request.Header.Set("content-type", "application/json")
	if token != "" {
		request.Header.Set("authorization", "Bearer "+token)
	}
	for _, value := range prefer {
		request.Header.Add("prefer", value)
	}
	client := &http.Client{Timeout: cfg.timeout}
	response, err := client.Do(request)
	if err != nil {
		return 0, "", fmt.Errorf("%s %s: %w", method, path, err)
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(response.Body, 1<<16))
	if err != nil {
		return response.StatusCode, "", err
	}
	return response.StatusCode, string(raw), nil
}

func compress(body string) string {
	flat := strings.Join(strings.Fields(body), " ")
	if len(flat) > 120 {
		return flat[:117] + "..."
	}
	return flat
}

func verdicts(o observation) []check {
	return []check{
		{
			name:   "alice reads unfiltered",
			actual: fmt.Sprintf("%d row: %s", o.aliceRows, o.aliceName),
			ok:     o.aliceRows == 1 && o.aliceName == "Alice Coffee Co",
		},
		{
			name:   "bob reads unfiltered",
			actual: fmt.Sprintf("%d row: %s", o.bobRows, o.bobName),
			ok:     o.bobRows == 1 && o.bobName == "Bob Bakery",
		},
		{
			name:   "no token reads",
			actual: fmt.Sprintf("%d rows", o.anonRows),
			ok:     o.anonRows == 0,
		},
		{
			name:   "bob writes alice's user id",
			actual: fmt.Sprintf("%d refused", o.insertStatus),
			detail: shortReason(o.insertBody),
			ok:     o.insertStatus == http.StatusForbidden,
		},
		{
			name:   "alice updates bob's row",
			actual: fmt.Sprintf("%d, bob reads %s", o.patchStatus, o.bobNameAfter),
			ok:     o.patchStatus < http.StatusMultipleChoices && o.bobNameAfter == "Bob Bakery",
		},
	}
}

func shortReason(body string) string {
	var payload struct {
		Message string `json:"message"`
	}
	if err := json.Unmarshal([]byte(body), &payload); err == nil && payload.Message != "" {
		return payload.Message
	}
	return compress(body)
}
