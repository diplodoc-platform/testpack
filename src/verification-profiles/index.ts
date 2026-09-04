/**
 * Verification profiles for Dependabot PR deep verification (E7).
 *
 * Each profile defines an ordered list of verification steps that must pass
 * before a dependency update is considered safe to merge.  The profile is
 * selected based on the risk classification (T6.2) of the changed dependency,
 * with optional overrides for rendering-impacting and security-critical
 * updates.
 *
 * Profiles (ordered by increasing depth):
 *
 * | Profile              | Description                                                |
 * | -------------------- | ---------------------------------------------------------- |
 * | `standard`           | install, typecheck, lint, unit, build, audit              |
 * | `toolchain`          | standard + all package types + standalone install          |
 * | `document-transform` | reference document corpus + normalized artifact comparison |
 * | `document-rendering` | transform + browser visual regression                       |
 * | `ecosystem`          | metapackage build with PR submodule + testpack              |
 *
 * @module @diplodoc/testpack/verification-profiles
 */

/**
 * Risk levels as defined by the risk classification (T6.2).
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Verification profile identifier.
 */
export type ProfileId =
    'standard' | 'toolchain' | 'document-transform' | 'document-rendering' | 'ecosystem';

/**
 * A single ordered step within a verification profile.
 */
export interface VerificationStep {
    /** Stable step identifier (kebab-case). */
    id: string;
    /** Human-readable step name. */
    name: string;
    /** What the step does. */
    description: string;
    /** Shell command template (placeholders in `${...}`). */
    command: string;
    /** Whether the step is mandatory (true) or best-effort (false). */
    required: boolean;
    /**
     * ids of profiles that also include this step (for the "builds on"
     * relationship).  Empty for base steps.
     */
    buildsOn?: string[];
}

/**
 * A complete verification profile.
 */
export interface VerificationProfile {
    /** Profile identifier. */
    id: ProfileId;
    /** Human-readable profile name. */
    name: string;
    /** Short description of the profile's scope. */
    description: string;
    /** Ordered list of verification steps. */
    steps: VerificationStep[];
    /**
     * Risk levels this profile is the default selection for
     * (see {@link PROFILE_BY_RISK}).
     */
    defaultForRisk: RiskLevel[];
    /**
     * ids of profiles this profile extends (superset relationship).
     * The first entry is the direct parent; remaining entries are
     * transitive ancestors.
     */
    extends?: ProfileId[];
}

/**
 * Options that influence profile selection beyond the base risk level.
 */
export interface SelectionOptions {
    /**
     * Whether the changed dependency is known to affect document rendering
     * (e.g. `svgo`, `@diplodoc/transform`, `@diplodoc/cli`).  When true and
     * the risk is `high`, the `document-rendering` profile is selected
     * instead of `document-transform`.
     */
    affectsRendering?: boolean;
    /**
     * Whether the update is a security update (vulnerability fix).  When
     * true and the risk is `critical`, the `ecosystem` profile is selected
     * for the most thorough verification.
     */
    securityCritical?: boolean;
    /**
     * Whether the dependency is a core package (`@diplodoc/cli`,
     * `@diplodoc/transform`, `@diplodoc/components`).  Core packages
     * elevate `high` risk to `document-rendering` and `critical` to
     * `ecosystem` regardless of {@link SelectionOptions.affectsRendering}.
     */
    isCorePackage?: boolean;
    /**
     * Explicit profile override from the registry entry's
     * `verification-profile` field.  When set, this value is returned
     * directly, bypassing the risk-based selection.
     */
    override?: ProfileId;
}

const STANDARD_STEPS: VerificationStep[] = [
    {
        id: 'install',
        name: 'Install dependencies',
        description: 'Run `npm ci` to install dependencies from the lockfile.',
        command: 'npm ci',
        required: true,
    },
    {
        id: 'typecheck',
        name: 'Type check',
        description: 'Run the TypeScript compiler in no-emit mode.',
        command: 'npm run typecheck',
        required: true,
    },
    {
        id: 'lint',
        name: 'Lint',
        description: 'Run ESLint, Prettier, and Stylelint in check mode.',
        command: 'npm run lint',
        required: true,
    },
    {
        id: 'unit',
        name: 'Unit tests',
        description: 'Run the unit test suite.',
        command: 'npm test',
        required: true,
    },
    {
        id: 'build',
        name: 'Build',
        description: 'Produce the build output (esbuild / tsc).',
        command: 'npm run build',
        required: true,
    },
    {
        id: 'audit',
        name: 'Security audit',
        description: 'Run `npm audit` to surface known vulnerabilities.',
        command: 'npm audit --audit-level=moderate',
        required: false,
    },
];

const TOOLCHAIN_STEPS: VerificationStep[] = [
    ...STANDARD_STEPS,
    {
        id: 'package-types',
        name: 'All package types',
        description:
            'Verify the package works as a subpath-export consumer for ' +
            'every export type (CJS, ESM, types).',
        command: 'node scripts/check-package-types.js',
        required: true,
        buildsOn: ['build'],
    },
    {
        id: 'standalone-install',
        name: 'Standalone install',
        description:
            'Install the published tarball in an empty directory to verify ' +
            'no workspace-only dependencies leak into the public package.',
        command: 'npm pack && npm install --no-save *.tgz',
        required: true,
        buildsOn: ['install'],
    },
];

const DOCUMENT_TRANSFORM_STEPS: VerificationStep[] = [
    ...TOOLCHAIN_STEPS,
    {
        id: 'corpus-build-base',
        name: 'Build reference corpus (base SHA)',
        description:
            'Build the reference document corpus at the PR base SHA to ' +
            'produce the expected artifacts for comparison.',
        command: 'node scripts/build-corpus.js --ref ${BASE_SHA} --output artifacts/expected/',
        required: true,
        buildsOn: ['build'],
    },
    {
        id: 'corpus-build-head',
        name: 'Build reference corpus (PR head SHA)',
        description:
            'Build the reference document corpus at the PR head SHA to ' +
            'produce the actual artifacts for comparison.',
        command: 'node scripts/build-corpus.js --ref ${HEAD_SHA} --output artifacts/actual/',
        required: true,
        buildsOn: ['build'],
    },
    {
        id: 'artifact-compare',
        name: 'Normalized artifact comparison',
        description:
            'Compare the output file tree and normalized HTML between base ' +
            'and head builds.  Any diff in the golden files requires human ' +
            'CODEOWNER approval.',
        command:
            'node scripts/compare-artifacts.js ' +
            '--expected artifacts/expected/ --actual artifacts/actual/ ' +
            '--report artifacts/diff.md',
        required: true,
        buildsOn: ['corpus-build-base', 'corpus-build-head'],
    },
];

const DOCUMENT_RENDERING_STEPS: VerificationStep[] = [
    ...DOCUMENT_TRANSFORM_STEPS,
    {
        id: 'browser-visual-regression',
        name: 'Browser visual regression',
        description:
            'Run the Playwright browser test suite (testpack) against the ' +
            'head build to detect visual regressions in rendered pages, ' +
            'including large SVG diagrams.',
        command: 'npx playwright test --project=chromium',
        required: true,
        buildsOn: ['corpus-build-head'],
    },
    {
        id: 'svg-dom-compare',
        name: 'SVG DOM comparison',
        description:
            'Compare the SVG DOM structure of rendered diagrams between ' +
            'base and head builds.  Specifically targets `svgo` regressions ' +
            'on large SVG diagrams (upstream issue svg/svgo#2218).',
        command:
            'node scripts/compare-svg-dom.js ' +
            '--expected artifacts/expected/ --actual artifacts/actual/ ' +
            '--report artifacts/svg-diff.md',
        required: true,
        buildsOn: ['browser-visual-regression'],
    },
    {
        id: 'screenshot-capture',
        name: 'Screenshot capture and diff',
        description:
            'Capture full-page screenshots of key pages and diff them ' +
            'against the base screenshots.  Upload actual/expected/diff ' +
            'plus the Playwright trace as CI artifacts.',
        command: 'npx playwright test --grep @screenshot --update-snapshots=false',
        required: true,
        buildsOn: ['browser-visual-regression'],
    },
];

const ECOSYSTEM_STEPS: VerificationStep[] = [
    ...DOCUMENT_RENDERING_STEPS,
    {
        id: 'metapackage-build',
        name: 'Metapackage build',
        description:
            'Build the full Diplodoc metapackage with the PR branch checked ' +
            'out as a submodule, ensuring all 28 packages compile together.',
        command:
            'git submodule update --init --recursive --force ' +
            '&& npm install && npm run build --workspaces',
        required: true,
        buildsOn: ['build'],
    },
    {
        id: 'testpack-e2e',
        name: 'Testpack E2E suite',
        description:
            'Run the full testpack Playwright E2E suite (all 33 suites) ' +
            'against the metapackage build to verify end-to-end rendering ' +
            'and interaction across every package.',
        command: 'cd devops/testpack && npm ci && npm test',
        required: true,
        buildsOn: ['metapackage-build', 'browser-visual-regression'],
    },
    {
        id: 'downstream-check',
        name: 'Downstream package check',
        description:
            'For core packages, run the downstream consumer test suites ' +
            'that depend on the changed package to catch breakages in ' +
            'consumers not covered by the metapackage build.',
        command: 'node scripts/downstream-check.js --package ${PACKAGE_NAME}',
        required: true,
        buildsOn: ['metapackage-build'],
    },
];

/**
 * The five verification profiles, ordered from shallowest to deepest.
 *
 * Each profile extends the previous one (superset of steps), so a deeper
 * profile never skips a step that a shallower profile requires.
 */
export const VERIFICATION_PROFILES: VerificationProfile[] = [
    {
        id: 'standard',
        name: 'Standard',
        description:
            'install, typecheck, lint, unit, build, audit — the baseline ' +
            'verification every package must pass.',
        steps: STANDARD_STEPS,
        defaultForRisk: ['low'],
    },
    {
        id: 'toolchain',
        name: 'Toolchain',
        description:
            'standard + all package types + standalone install — verifies ' +
            'the package works as a published artifact, not just in the ' +
            'workspace.',
        steps: TOOLCHAIN_STEPS,
        defaultForRisk: ['medium'],
        extends: ['standard'],
    },
    {
        id: 'document-transform',
        name: 'Document Transform',
        description:
            'reference document corpus + normalized artifact comparison — ' +
            'catches silent output regressions by diffing the build output.',
        steps: DOCUMENT_TRANSFORM_STEPS,
        defaultForRisk: ['high'],
        extends: ['toolchain', 'standard'],
    },
    {
        id: 'document-rendering',
        name: 'Document Rendering',
        description:
            'transform + browser visual regression — catches rendering ' +
            'regressions invisible to the artifact diff (e.g. SVG ' +
            'structure, layout shifts).',
        steps: DOCUMENT_RENDERING_STEPS,
        defaultForRisk: [],
        extends: ['document-transform', 'toolchain', 'standard'],
    },
    {
        id: 'ecosystem',
        name: 'Ecosystem',
        description:
            'metapackage build with PR submodule + testpack — the most ' +
            'thorough profile, reserved for critical core/security updates.',
        steps: ECOSYSTEM_STEPS,
        defaultForRisk: ['critical'],
        extends: ['document-rendering', 'document-transform', 'toolchain', 'standard'],
    },
];

/**
 * Lookup table: profile id → profile object.
 */
export const PROFILE_BY_ID: Record<ProfileId, VerificationProfile> = Object.fromEntries(
    VERIFICATION_PROFILES.map((profile) => [profile.id, profile]),
) as Record<ProfileId, VerificationProfile>;

/**
 * Default profile per risk level when no override or special flag applies.
 *
 * | Risk     | Default profile          |
 * | -------- | ------------------------ |
 * | low      | `standard`               |
 * | medium   | `toolchain`             |
 * | high     | `document-transform`     |
 * | critical | `ecosystem`              |
 *
 * Note: `document-rendering` has no default risk — it is selected via
 * the {@link SelectionOptions.affectsRendering} or
 * {@link SelectionOptions.isCorePackage} flags.
 */
export const PROFILE_BY_RISK: Record<RiskLevel, ProfileId> = {
    low: 'standard',
    medium: 'toolchain',
    high: 'document-transform',
    critical: 'ecosystem',
};

const VALID_PROFILE_IDS = new Set<string>(VERIFICATION_PROFILES.map((p) => p.id));
const VALID_RISK_LEVELS = new Set<string>(['low', 'medium', 'high', 'critical']);

/**
 * Validate that a value is a known {@link ProfileId}.
 *
 * @param value Value to check.
 * @returns True when `value` is a valid profile id.
 */
export function isProfileId(value: unknown): value is ProfileId {
    return typeof value === 'string' && VALID_PROFILE_IDS.has(value);
}

/**
 * Validate that a value is a known {@link RiskLevel}.
 *
 * @param value Value to check.
 * @returns True when `value` is a valid risk level.
 */
export function isRiskLevel(value: unknown): value is RiskLevel {
    return typeof value === 'string' && VALID_RISK_LEVELS.has(value);
}

/**
 * Look up a verification profile by id.
 *
 * @param id Profile identifier.
 * @returns The matching profile.
 * @throws {Error} When `id` is not a known profile.
 */
export function getProfile(id: ProfileId): VerificationProfile {
    const profile = PROFILE_BY_ID[id];
    if (!profile) {
        throw new Error(`Unknown verification profile: ${id}`);
    }
    return profile;
}

/**
 * Select the verification profile for a dependency update based on the
 * risk classification and optional override flags.
 *
 * Selection order (first match wins):
 *
 * 1. **Explicit override** — when `options.override` is a valid profile id,
 *    it is returned directly (registry entries can pin a profile).
 * 2. **Critical + security** — `critical` risk with
 *    `options.securityCritical` → `ecosystem`.
 * 3. **Critical + core package** — `critical` risk with
 *    `options.isCorePackage` → `ecosystem`.
 * 4. **High + rendering impact** — `high` risk with
 *    `options.affectsRendering` or `options.isCorePackage` →
 *    `document-rendering`.
 * 5. **Default by risk** — {@link PROFILE_BY_RISK} mapping.
 *
 * @param risk Risk level from the risk classification (T6.2).
 * @param options Optional flags influencing the selection.
 * @returns The selected verification profile.
 */
export function selectProfile(
    risk: RiskLevel,
    options: SelectionOptions = {},
): VerificationProfile {
    if (options.override && isProfileId(options.override)) {
        return getProfile(options.override);
    }

    const affectsRendering = options.affectsRendering === true || options.isCorePackage === true;
    const securityCritical = options.securityCritical === true;

    if (risk === 'critical') {
        if (securityCritical || options.isCorePackage === true) {
            return getProfile('ecosystem');
        }
        return getProfile(PROFILE_BY_RISK.critical);
    }

    if (risk === 'high') {
        if (affectsRendering) {
            return getProfile('document-rendering');
        }
        return getProfile(PROFILE_BY_RISK.high);
    }

    return getProfile(PROFILE_BY_RISK[risk]);
}

/**
 * List the ids of all steps in a profile, in execution order.
 *
 * @param id Profile identifier.
 * @returns Array of step ids.
 */
export function listStepIds(id: ProfileId): string[] {
    return getProfile(id).steps.map((step) => step.id);
}

/**
 * Check whether a profile includes a given step (by id).
 *
 * @param profileId Profile identifier.
 * @param stepId Step identifier to look for.
 * @returns True when the profile contains the step.
 */
export function hasStep(profileId: ProfileId, stepId: string): boolean {
    return getProfile(profileId).steps.some((step) => step.id === stepId);
}

/**
 * Check whether a profile is a superset of another profile (contains all
 * of the other profile's steps).
 *
 * @param superset Candidate superset profile id.
 * @param subset Candidate subset profile id.
 * @returns True when `superset` contains every step from `subset`.
 */
export function isSupersetOf(superset: ProfileId, subset: ProfileId): boolean {
    const subsetSteps = getProfile(subset).steps;
    return subsetSteps.every((step) => hasStep(superset, step.id));
}

/**
 * Render the verification profiles as a markdown table for documentation.
 *
 * @returns Markdown string with a profile summary table.
 */
export function renderProfilesMarkdown(): string {
    const header =
        '| Profile | Steps | Default risk | Extends |\n' +
        '| ------- | ----- | ------------ | ------- |\n';
    const rows = VERIFICATION_PROFILES.map((profile) => {
        const steps = profile.steps.length;
        const risks = profile.defaultForRisk.join(', ') || '—';
        const extendsList = profile.extends ? profile.extends.join(', ') : '—';
        return `| \`${profile.id}\` | ${steps} | ${risks} | ${extendsList} |`;
    }).join('\n');
    return header + rows + '\n';
}

/**
 * Render the steps of a single profile as a markdown ordered list.
 *
 * @param id Profile identifier.
 * @returns Markdown string with an ordered list of steps.
 */
export function renderStepsMarkdown(id: ProfileId): string {
    const profile = getProfile(id);
    const lines = [`### ${profile.name} (\`${profile.id}\`)\n`];
    lines.push(profile.description + '\n');
    lines.push('**Steps:**\n');
    profile.steps.forEach((step, index) => {
        const tag = step.required ? '' : ' _(best-effort)_';
        lines.push(`${index + 1}. **${step.name}** (\`${step.id}\`)${tag} — ${step.description}`);
        lines.push(`   \`\`\`bash\n   ${step.command}\n   \`\`\``);
    });
    return lines.join('\n') + '\n';
}
