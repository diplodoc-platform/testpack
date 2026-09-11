import {expect, test} from '@playwright/test';

import {
    PROFILE_BY_ID,
    PROFILE_BY_RISK,
    VERIFICATION_PROFILES,
    getProfile,
    hasStep,
    isProfileId,
    isRiskLevel,
    isSupersetOf,
    listStepIds,
    renderProfilesMarkdown,
    renderStepsMarkdown,
    selectProfile,
} from '../../verification-profiles';

const PROFILE_IDS = [
    'standard',
    'toolchain',
    'document-transform',
    'document-rendering',
    'ecosystem',
] as const;

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

test.describe('Verification Profiles', () => {
    test.describe('Profile definitions', () => {
        test('should define exactly 5 profiles', () => {
            expect(VERIFICATION_PROFILES).toHaveLength(5);
        });

        test('should define profiles in increasing depth order', () => {
            const ids = VERIFICATION_PROFILES.map((p) => p.id);
            expect(ids).toEqual([...PROFILE_IDS]);
        });

        test('each profile should have a unique id', () => {
            const ids = VERIFICATION_PROFILES.map((p) => p.id);
            expect(new Set(ids).size).toBe(ids.length);
        });

        test('each profile should have a non-empty name', () => {
            for (const profile of VERIFICATION_PROFILES) {
                expect(profile.name.length).toBeGreaterThan(0);
            }
        });

        test('each profile should have a non-empty description', () => {
            for (const profile of VERIFICATION_PROFILES) {
                expect(profile.description.length).toBeGreaterThan(0);
            }
        });

        test('each profile should have at least one step', () => {
            for (const profile of VERIFICATION_PROFILES) {
                expect(profile.steps.length).toBeGreaterThan(0);
            }
        });

        test('each step should have id, name, description, and command', () => {
            for (const profile of VERIFICATION_PROFILES) {
                for (const step of profile.steps) {
                    expect(step.id.length).toBeGreaterThan(0);
                    expect(step.name.length).toBeGreaterThan(0);
                    expect(step.description.length).toBeGreaterThan(0);
                    expect(step.command.length).toBeGreaterThan(0);
                    expect(typeof step.required).toBe('boolean');
                }
            }
        });

        test('step ids within a profile should be unique', () => {
            for (const profile of VERIFICATION_PROFILES) {
                const ids = profile.steps.map((s) => s.id);
                expect(new Set(ids).size).toBe(ids.length);
            }
        });

        test('standard profile should have 6 steps', () => {
            expect(VERIFICATION_PROFILES[0].steps).toHaveLength(6);
        });

        test('standard steps should be install, typecheck, lint, unit, build, audit', () => {
            expect(listStepIds('standard')).toEqual([
                'install',
                'typecheck',
                'lint',
                'unit',
                'build',
                'audit',
            ]);
        });

        test('toolchain should extend standard (superset of steps)', () => {
            expect(isSupersetOf('toolchain', 'standard')).toBe(true);
        });

        test('document-transform should extend toolchain', () => {
            expect(isSupersetOf('document-transform', 'toolchain')).toBe(true);
        });

        test('document-rendering should extend document-transform', () => {
            expect(isSupersetOf('document-rendering', 'document-transform')).toBe(true);
        });

        test('ecosystem should extend document-rendering', () => {
            expect(isSupersetOf('ecosystem', 'document-rendering')).toBe(true);
        });

        test('ecosystem should be a superset of all other profiles', () => {
            for (const id of PROFILE_IDS) {
                if (id === 'ecosystem') continue;
                expect(isSupersetOf('ecosystem', id)).toBe(true);
            }
        });

        test('standard should not be a superset of toolchain', () => {
            expect(isSupersetOf('standard', 'toolchain')).toBe(false);
        });

        test('toolchain should add package-types and standalone-install steps', () => {
            expect(hasStep('toolchain', 'package-types')).toBe(true);
            expect(hasStep('toolchain', 'standalone-install')).toBe(true);
        });

        test('document-transform should add corpus and artifact-compare steps', () => {
            expect(hasStep('document-transform', 'corpus-build-base')).toBe(true);
            expect(hasStep('document-transform', 'corpus-build-head')).toBe(true);
            expect(hasStep('document-transform', 'artifact-compare')).toBe(true);
        });

        test('artifact comparison should ignore sibling build metadata', () => {
            const profile = getProfile('document-transform');
            const step = profile.steps.find(({id}) => id === 'artifact-compare');

            expect(step?.command).toContain('--expected artifacts/expected/output/');
            expect(step?.command).toContain('--actual artifacts/actual/output/');
        });

        test('document-rendering should add visual regression steps', () => {
            expect(hasStep('document-rendering', 'browser-visual-regression')).toBe(true);
            expect(hasStep('document-rendering', 'svg-dom-compare')).toBe(true);
            expect(hasStep('document-rendering', 'screenshot-capture')).toBe(true);
        });

        test('ecosystem should add metapackage, testpack-e2e, downstream steps', () => {
            expect(hasStep('ecosystem', 'metapackage-build')).toBe(true);
            expect(hasStep('ecosystem', 'testpack-e2e')).toBe(true);
            expect(hasStep('ecosystem', 'downstream-check')).toBe(true);
        });
    });

    test.describe('Default risk mapping', () => {
        test('low risk should default to standard', () => {
            expect(PROFILE_BY_RISK.low).toBe('standard');
        });

        test('medium risk should default to toolchain', () => {
            expect(PROFILE_BY_RISK.medium).toBe('toolchain');
        });

        test('high risk should default to document-transform', () => {
            expect(PROFILE_BY_RISK.high).toBe('document-transform');
        });

        test('critical risk should default to ecosystem', () => {
            expect(PROFILE_BY_RISK.critical).toBe('ecosystem');
        });

        test('document-rendering should have no default risk', () => {
            const profile = VERIFICATION_PROFILES.find((p) => p.id === 'document-rendering');
            expect(profile).toBeDefined();
            expect(profile?.defaultForRisk).toHaveLength(0);
        });

        test('every risk level should have a default profile', () => {
            for (const risk of RISK_LEVELS) {
                expect(PROFILE_BY_RISK[risk]).toBeDefined();
                expect(isProfileId(PROFILE_BY_RISK[risk])).toBe(true);
            }
        });
    });

    test.describe('PROFILE_BY_ID lookup', () => {
        test('should contain all 5 profiles', () => {
            expect(Object.keys(PROFILE_BY_ID)).toHaveLength(5);
        });

        test('should map each id to the correct profile', () => {
            for (const id of PROFILE_IDS) {
                expect(PROFILE_BY_ID[id].id).toBe(id);
            }
        });
    });

    test.describe('isProfileId', () => {
        test('should return true for valid profile ids', () => {
            for (const id of PROFILE_IDS) {
                expect(isProfileId(id)).toBe(true);
            }
        });

        test('should return false for invalid strings', () => {
            expect(isProfileId('unknown')).toBe(false);
            expect(isProfileId('')).toBe(false);
        });

        test('should return false for non-strings', () => {
            expect(isProfileId(42)).toBe(false);
            expect(isProfileId(null)).toBe(false);
            expect(isProfileId(undefined)).toBe(false);
            expect(isProfileId({})).toBe(false);
        });
    });

    test.describe('isRiskLevel', () => {
        test('should return true for valid risk levels', () => {
            for (const risk of RISK_LEVELS) {
                expect(isRiskLevel(risk)).toBe(true);
            }
        });

        test('should return false for invalid strings', () => {
            expect(isRiskLevel('unknown')).toBe(false);
            expect(isRiskLevel('')).toBe(false);
        });

        test('should return false for non-strings', () => {
            expect(isRiskLevel(42)).toBe(false);
            expect(isRiskLevel(null)).toBe(false);
        });
    });

    test.describe('getProfile', () => {
        test('should return the profile for a valid id', () => {
            const profile = getProfile('standard');
            expect(profile.id).toBe('standard');
            expect(profile.name).toBe('Standard');
        });

        test('should throw for an unknown id', () => {
            expect(() => getProfile('nonexistent' as never)).toThrow(
                /Unknown verification profile/,
            );
        });
    });

    test.describe('selectProfile — default risk mapping', () => {
        test('low risk with no options should select standard', () => {
            expect(selectProfile('low').id).toBe('standard');
        });

        test('medium risk with no options should select toolchain', () => {
            expect(selectProfile('medium').id).toBe('toolchain');
        });

        test('high risk with no options should select document-transform', () => {
            expect(selectProfile('high').id).toBe('document-transform');
        });

        test('critical risk with no options should select ecosystem', () => {
            expect(selectProfile('critical').id).toBe('ecosystem');
        });
    });

    test.describe('selectProfile — override', () => {
        test('override should bypass risk-based selection', () => {
            expect(selectProfile('low', {override: 'ecosystem'}).id).toBe('ecosystem');
        });

        test('override of standard should work for critical risk', () => {
            expect(selectProfile('critical', {override: 'standard'}).id).toBe('standard');
        });

        test('invalid override should be ignored, falling back to risk', () => {
            expect(
                selectProfile('low', {
                    override: 'invalid' as never,
                }).id,
            ).toBe('standard');
        });
    });

    test.describe('selectProfile — affectsRendering flag', () => {
        test('high risk with affectsRendering should select document-rendering', () => {
            expect(selectProfile('high', {affectsRendering: true}).id).toBe('document-rendering');
        });

        test('low risk with affectsRendering should still select standard', () => {
            expect(selectProfile('low', {affectsRendering: true}).id).toBe('standard');
        });

        test('medium risk with affectsRendering should still select toolchain', () => {
            expect(selectProfile('medium', {affectsRendering: true}).id).toBe('toolchain');
        });

        test('critical risk with affectsRendering but not security should select ecosystem', () => {
            expect(selectProfile('critical', {affectsRendering: true}).id).toBe('ecosystem');
        });
    });

    test.describe('selectProfile — isCorePackage flag', () => {
        test('high risk with isCorePackage should select document-rendering', () => {
            expect(selectProfile('high', {isCorePackage: true}).id).toBe('document-rendering');
        });

        test('critical risk with isCorePackage should select ecosystem', () => {
            expect(selectProfile('critical', {isCorePackage: true}).id).toBe('ecosystem');
        });

        test('low risk with isCorePackage should still select standard', () => {
            expect(selectProfile('low', {isCorePackage: true}).id).toBe('standard');
        });
    });

    test.describe('selectProfile — securityCritical flag', () => {
        test('critical risk with securityCritical should select ecosystem', () => {
            expect(selectProfile('critical', {securityCritical: true}).id).toBe('ecosystem');
        });

        test('high risk with securityCritical should select document-transform', () => {
            expect(selectProfile('high', {securityCritical: true}).id).toBe('document-transform');
        });

        test('low risk with securityCritical should still select standard', () => {
            expect(selectProfile('low', {securityCritical: true}).id).toBe('standard');
        });
    });

    test.describe('selectProfile — combined flags', () => {
        test('critical + securityCritical + affectsRendering should select ecosystem', () => {
            expect(
                selectProfile('critical', {
                    securityCritical: true,
                    affectsRendering: true,
                }).id,
            ).toBe('ecosystem');
        });

        test('high + isCorePackage + affectsRendering should select document-rendering', () => {
            expect(
                selectProfile('high', {
                    isCorePackage: true,
                    affectsRendering: true,
                }).id,
            ).toBe('document-rendering');
        });

        test('override should take precedence over all flags', () => {
            expect(
                selectProfile('critical', {
                    securityCritical: true,
                    isCorePackage: true,
                    affectsRendering: true,
                    override: 'standard',
                }).id,
            ).toBe('standard');
        });
    });

    test.describe('listStepIds', () => {
        test('should return all step ids for standard', () => {
            const ids = listStepIds('standard');
            expect(ids).toHaveLength(6);
            expect(ids).toContain('install');
            expect(ids).toContain('audit');
        });

        test('should return more steps for ecosystem than standard', () => {
            expect(listStepIds('ecosystem').length).toBeGreaterThan(listStepIds('standard').length);
        });
    });

    test.describe('hasStep', () => {
        test('should return true for a step in the profile', () => {
            expect(hasStep('standard', 'install')).toBe(true);
        });

        test('should return false for a step not in the profile', () => {
            expect(hasStep('standard', 'metapackage-build')).toBe(false);
        });

        test('ecosystem should have all steps', () => {
            expect(hasStep('ecosystem', 'install')).toBe(true);
            expect(hasStep('ecosystem', 'testpack-e2e')).toBe(true);
            expect(hasStep('ecosystem', 'downstream-check')).toBe(true);
        });
    });

    test.describe('isSupersetOf', () => {
        test('a profile should be a superset of itself', () => {
            expect(isSupersetOf('standard', 'standard')).toBe(true);
        });

        test('ecosystem should be a superset of standard', () => {
            expect(isSupersetOf('ecosystem', 'standard')).toBe(true);
        });

        test('standard should not be a superset of ecosystem', () => {
            expect(isSupersetOf('standard', 'ecosystem')).toBe(false);
        });

        test('document-rendering should be a superset of toolchain', () => {
            expect(isSupersetOf('document-rendering', 'toolchain')).toBe(true);
        });

        test('toolchain should not be a superset of document-rendering', () => {
            expect(isSupersetOf('toolchain', 'document-rendering')).toBe(false);
        });
    });

    test.describe('renderProfilesMarkdown', () => {
        test('should produce a markdown table with all 5 profiles', () => {
            const md = renderProfilesMarkdown();
            expect(md).toContain('| Profile | Steps |');
            for (const id of PROFILE_IDS) {
                expect(md).toContain(`\`${id}\``);
            }
        });

        test('should include step counts', () => {
            const md = renderProfilesMarkdown();
            const standardSteps = getProfile('standard').steps.length;
            expect(md).toContain(`| \`standard\` | ${standardSteps} |`);
        });
    });

    test.describe('renderStepsMarkdown', () => {
        test('should produce an ordered list of steps for a profile', () => {
            const md = renderStepsMarkdown('standard');
            expect(md).toContain('### Standard (`standard`)');
            expect(md).toContain('1. **Install dependencies**');
            expect(md).toContain('npm ci');
        });

        test('should include command blocks', () => {
            const md = renderStepsMarkdown('ecosystem');
            expect(md).toContain('```bash');
            expect(md).toContain('testpack-e2e');
        });

        test('should include best-effort tag for non-required steps', () => {
            const md = renderStepsMarkdown('standard');
            expect(md).toContain('_(best-effort)_');
        });
    });
});
