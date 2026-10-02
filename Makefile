SECTIONS := $(sort $(wildcard docs/sections/*.md))
OUT      := docs/dist/project_proposal_complete.docx

.PHONY: docx extract clean

docx: $(OUT)

$(OUT): $(SECTIONS) docs/project_proposal_complete.docx
	mkdir -p docs/dist
	pandoc $(SECTIONS) \
		--reference-doc=docs/project_proposal_complete.docx \
		--toc --toc-depth=3 \
		--resource-path=docs/sections \
		-o $(OUT)
	@echo "built $(OUT)"

extract:
	go run docs/build/extract.go

clean:
	rm -rf docs/dist
