package main

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

func goodObservation() observation {
	return observation{
		aliceRows:    1,
		aliceName:    "Alice Coffee Co",
		bobRows:      1,
		bobName:      "Bob Bakery",
		anonRows:     0,
		insertStatus: http.StatusForbidden,
		insertBody:   `{"message":"new row violates row-level security policy"}`,
		patchStatus:  http.StatusNoContent,
		bobNameAfter: "Bob Bakery",
	}
}

func countFailures(checks []check) int {
	failures := 0
	for _, item := range checks {
		if !item.ok {
			failures++
		}
	}
	return failures
}

func TestVerdictsPassOnTheExpectedRun(t *testing.T) {
	results := verdicts(goodObservation())
	if len(results) != 5 {
		t.Fatalf("expected 5 checks, got %d", len(results))
	}
	if failures := countFailures(results); failures != 0 {
		t.Fatalf("expected every check to pass, got %d failures", failures)
	}
}

func TestVerdictsCatchALeakingPolicy(t *testing.T) {
	leaked := goodObservation()
	leaked.aliceRows = 2
	leaked.anonRows = 2
	if failures := countFailures(verdicts(leaked)); failures != 2 {
		t.Fatalf("expected the two leak checks to fail, got %d failures", failures)
	}
}

func TestVerdictsCatchAnAcceptedTrespass(t *testing.T) {
	trespass := goodObservation()
	trespass.insertStatus = http.StatusCreated
	trespass.patchStatus = http.StatusOK
	trespass.bobNameAfter = "Hijacked"
	if failures := countFailures(verdicts(trespass)); failures != 2 {
		t.Fatalf("expected the insert and update checks to fail, got %d failures", failures)
	}
}

func TestLoadEnvFileReadsThePublicPair(t *testing.T) {
	path := filepath.Join(t.TempDir(), "env")
	content := "# comment\nNEXT_PUBLIC_SUPABASE_URL=\"https://example.supabase.co\"\n" +
		"NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_abc\nGEMINI_API_KEY=secret\n"
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("writing the fixture: %v", err)
	}
	values, err := loadEnvFile(path)
	if err != nil {
		t.Fatalf("loading: %v", err)
	}
	if values["NEXT_PUBLIC_SUPABASE_URL"] != "https://example.supabase.co" {
		t.Fatalf("url came back as %q", values["NEXT_PUBLIC_SUPABASE_URL"])
	}
	if values["NEXT_PUBLIC_SUPABASE_ANON_KEY"] != "sb_publishable_abc" {
		t.Fatalf("key came back as %q", values["NEXT_PUBLIC_SUPABASE_ANON_KEY"])
	}
}

func TestParseFlagsRefusesAMissingURL(t *testing.T) {
	if _, err := parseFlags([]string{}); err == nil {
		t.Fatal("expected a refusal when no URL is given")
	}
}

func TestParseFlagsRefusesAPlainHTTPURL(t *testing.T) {
	_, err := parseFlags([]string{"-base=http://example.test", "-anon=k"})
	if err == nil {
		t.Fatal("expected a refusal for a non-https URL")
	}
}
