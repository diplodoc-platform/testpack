# Mini TOC Windows diagnostics

This opt-in probe investigates the Windows active-heading flake. It does not
change client code, assertions, screenshots or normal Quality retry settings.
The infra-generated Quality workflow is intentionally unchanged.

`mini-toc-diagnostics.yml` runs on relevant pull requests and manual dispatch,
never on a schedule or on every dependency PR. Two isolated Windows jobs run:

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

The pilot is path-scoped to its own tooling and supports manual dispatch after
the workflow is on master. Update both reviewed source pins explicitly for a
new candidate; it never selects moving branches or publishes packages. The
original diagnostic workflow still checks the published CLI, so rerunning it
alone does not validate an unpublished components fix. Keep PR 38 unmerged
until the candidate evidence is reviewed; green source checks do not authorize
the components/client/CLI release chain, distribution or Arcadia execution.
