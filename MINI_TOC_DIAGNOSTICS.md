# Mini TOC Windows diagnostics

This opt-in probe investigates the Windows active-heading flake. It does not
change client code, assertions, screenshots or normal Quality retry settings.
The infra-generated Quality workflow is intentionally unchanged.

Both diagnostic workflows are manual-only (`workflow_dispatch`). Neither runs
on pull requests, pushes, schedules or dependency updates. They are opt-in
investigation tools, not required automatic PR checks. The normal Quality and
dependency-verification workflows remain unchanged.

`mini-toc-diagnostics.yml` checks the published CLI. Two isolated Windows jobs run:

- 50 repetitions of each real navigation scenario, with one worker and no retry;
- the full suite with the normal CI retries, to retain the original workload.

`MINI_TOC_DIAGNOSTICS=1` installs a recorder before Mini TOC page navigation.
The recorder forwards the original native observer entries, observer and options
unchanged. It records callback batches, focus/click/scroll events and active-class
changes. It neither activates a heading nor scrolls the page. The event ring is
bounded to 500 entries and reports any dropped entries.

Every Mini TOC attempt, including failures followed by a successful retry, gets
a JSON attachment with viewport, fonts, heading geometry, active hashes and
event history. Mini TOC traces are enabled from the first attempt only in this
opt-in mode. Always-upload artifacts contain separate JSON/HTML reports and test
outputs for each job; screenshots cannot be updated.

For a local targeted check:

```sh
MINI_TOC_DIAGNOSTICS=1 npm test -- --config playwright.mini-toc.config.ts \
  --grep 'Components.*Mini TOC.*Navigation to' --repeat-each 50 --workers 1 --retries 0
```

Diagnose the **first failing attempt**, not just the eventual run conclusion.
Check whether the native callback included `content-rendering`, which heading
was first intersecting, and whether later focus/scroll or class changes replaced
it. An identical negative fractional top coordinate alone is not a cause:
the same y=-0.1875 and scrollY=946 previously passed 30 local repetitions.
A clean targeted run does not prove Windows/full-workload stability.
Recording itself can affect timing; a clean instrumented full suite does not
erase the uninstrumented Windows failure either. Use the dedicated config,
which disables automatic tracing so the suite can trace Mini TOC explicitly.

This is diagnostic CI, not dependency verification, distribution approval or an
Arcadia trigger. Retire or narrow the probe after the cause is established.

## Source candidate before publication

`mini-toc-candidate.yml` is a separately pinned source pilot. It builds the
metapackage at c19d631426f723c23ff6c84b01a2fbfc6ac4aded with merged components
aa06fd1fe9d67483835759f57a85f910126d4e19 on an isolated Ubuntu runner. The source
CLI builds HTML and Markdown. Source maps bind the exact compiled selector to
the client bundle referenced by the Components document; workspace resolution,
source revisions, the workspace lock and full HTML inventory are retained.

Two Windows runners download that exact producer artifact by ID, verify its
inventory and source pins, and serve it without an npm CLI rebuild or server
reuse. A separate browser identity check hashes the actual loaded HTTP response
containing the selector. Its report has separate paths so the following
navigation/full-suite run cannot overwrite that evidence. Navigation repeats
each of the two real scenarios 50 times without retries. Full-suite retries
remain unchanged and Mini TOC first-attempt JSON/traces are retained.

This is a reproducible historical pilot, not an automatic check of the latest
components. Keep both reviewed source pins explicit. To test a different
candidate, update and review the pins in a separate PR before manually running
the new workflow revision; it never selects moving source branches or publishes
packages. The original diagnostic workflow still checks the published CLI, so
rerunning it alone does not validate an unpublished components fix.

The pre-merge source pilot
[37925878441](https://github.com/diplodoc-platform/testpack/actions/runs/37925878441)
passed 100 navigation repetitions without retries and 1566 full-suite tests
with four existing skips, zero failed/flaky/retried attempts. Both browser
identity checks and all 111 Mini TOC JSON/trace pairs were verified. The
separate published-client control still reproduced the old bug. These results
do not authorize the components/client/CLI release chain, distribution or
Arcadia execution. Failed historical runs must remain available as evidence.

## Manual hosted runs

GitHub registers a manually dispatchable workflow after its file reaches the
default branch. After merging, use Actions → select one of the two diagnostic
workflows → Run workflow → choose the reviewed branch. For the approved master
revision, the equivalent commands are:

```sh
# Published CLI control: useful for checking whether a release propagated.
gh workflow run mini-toc-diagnostics.yml --repo diplodoc-platform/testpack --ref master

# Exact source candidate: uses the reviewed historical pins documented above.
gh workflow run mini-toc-candidate.yml --repo diplodoc-platform/testpack --ref master
```

Run only the probe needed for the current question; each starts two heavy
Windows suites, and the source pilot additionally builds the workspace graph.
Inspect attempt-zero JSON/traces and actual candidate identity, not just the
green badge. No manual run publishes packages or changes repository pointers.
