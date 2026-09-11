// These suites validate testpack's repository tooling. They are deliberately
// excluded from the published @diplodoc/testpack/tests entry point because
// they depend on repository-only scripts and the metapackage checkout.
import '../src/tests/verification-profiles';
import '../src/tests/package-types';
import '../src/tests/golden-files';
import '../src/tests/downstream-check';
import '../src/tests/arcadia-check';
