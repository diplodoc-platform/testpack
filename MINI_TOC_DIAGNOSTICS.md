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
changes. It neither activates a heading nor scrolls the page. The recorder keeps
the first 500 events without evicting the initial observer batches. Later events
are counted in `droppedEvents` and omitted before querying active DOM state.
An intersection event's `active` is the **pre-callback** snapshot, explicitly
marked `phase: before-callback`; later React DOM updates appear as separate
`active-class-change` events. The final state attachment reads current active
hashes independently of the bounded history.

Every Mini TOC attempt, including failures followed by a successful retry, gets
a JSON attachment with viewport, fonts, heading geometry, active hashes and
event history. Mini TOC traces are enabled from the first attempt only in this
opt-in mode. Always-upload artifacts contain separate JSON/HTML reports and test
outputs for each job; screenshots cannot be updated.

If state capture or trace saving fails, `mini-toc-diagnostic-error` records the
failed phase and message independently of the other collector. Capture failures
do not change the assertion outcome or hide an assertion failure. A green test
with this attachment, missing JSON/trace or dropped events is **incomplete
diagnostic evidence**, not proof of a clean observer history. Inspect attachment
completeness for every attempt before drawing a stability conclusion.

GitHub artifact retention is **seven days**, not permanent. Historical run logs
and conclusions remain separate from these expiring JSON/trace/corpus artifacts.
Before expiry, download any evidence needed for later review, record the source
inputs, run/job IDs, producer artifact IDs and ZIP SHA-256 digests, and keep it in
a durable archive outside the Git repository. Do not delete failed run history.

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

`mini-toc-candidate.yml` requires two manual inputs: `metapackage-sha` and
`components-sha`, each a reviewed full lowercase 40-character commit SHA in its
respective Diplodoc repository. Branch names and shortened hashes are rejected
before source checkout. The inputs are frozen for all jobs in one run; there
are no historical source hashes hardcoded in the workflow.

On an isolated Ubuntu runner, the selected components commit is injected into
the selected metapackage checkout and the source CLI builds HTML and Markdown.
This does **not** require Update Submodules or mutate a metapackage pointer.
Update Submodules is a different operation that changes the metapackage's saved
repository state; do not run it merely to launch this diagnostic probe.

`tools/testpack` contains the diagnostic scripts from the chosen testpack
workflow revision. It is separate from `metapackage/devops/testpack`, whose
fixtures are frozen by the selected metapackage commit. This prevents an old
fixture checkout from replacing the current proof tooling.

Source maps bind the exact compiled selector to
the client bundle referenced by the Components document; workspace resolution,
source revisions, the workspace lock and full HTML inventory are retained.

Two Windows runners download that exact producer artifact by ID, verify its
inventory and source pins, and serve it without an npm CLI rebuild or server
reuse. A separate browser identity check hashes the actual loaded HTTP response
containing the selector. Its report has separate paths so the following
navigation/full-suite run cannot overwrite that evidence. Navigation repeats
each of the two real scenarios 50 times without retries. Full-suite retries
remain unchanged and Mini TOC first-attempt JSON/traces are retained.

This is an explicit source probe, not an automatic check of the latest components.
Review both source commits before supplying the inputs; testing a new candidate
does not require editing YAML. The workflow never selects moving source branches
or publishes packages. All setup steps use the shared
`vars.NODE_VERSION || '24'` convention; the source producer skips root install
and lockfile cache, then explicitly installs inside the injected workspace.
The original diagnostic workflow still checks the published CLI, so
rerunning it alone does not validate an unpublished components fix.

The pre-merge source pilot
[37925878441](https://github.com/diplodoc-platform/testpack/actions/runs/37925878441)
passed 100 navigation repetitions without retries and 1566 full-suite tests
with four existing skips, zero failed/flaky/retried attempts. Both browser
identity checks and all 111 Mini TOC JSON/trace pairs were verified. The
separate published-client control still reproduced the old bug. These results
do not authorize the components/client/CLI release chain, distribution or
Arcadia execution. That run used metapackage
c19d631426f723c23ff6c84b01a2fbfc6ac4aded and components
aa06fd1fe9d67483835759f57a85f910126d4e19; these are historical evidence inputs,
not defaults for future checks. Its downloaded JSON/trace archives are retained
separately from the expiring GitHub artifacts.

## Manual hosted runs

GitHub registers a manually dispatchable workflow after its file reaches the
default branch. After merging, use Actions → select one of the two diagnostic
workflows → Run workflow → choose the reviewed branch. For the approved master
revision, the equivalent commands are:

```sh
# Published CLI control: useful for checking whether a release propagated.
gh workflow run mini-toc-diagnostics.yml --repo diplodoc-platform/testpack --ref master

# Exact source candidate: supply the two full, reviewed commit SHAs.
gh workflow run mini-toc-candidate.yml --repo diplodoc-platform/testpack --ref master \
  --field metapackage-sha="$reviewed_metapackage_sha" \
  --field components-sha="$reviewed_components_sha"
```

Run only the probe needed for the current question; each starts two heavy
Windows suites, and the source pilot additionally builds the workspace graph.
Inspect attempt-zero JSON/traces and actual candidate identity, not just the
green badge. No manual run publishes packages or changes repository pointers.
