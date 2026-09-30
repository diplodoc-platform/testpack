# Changelog

## [1.1.0](https://github.com/diplodoc-platform/testpack/compare/v1.0.1...v1.1.0) (2026-09-30)


### Features

* **dependabot:** T2.2 Verify Testpack ([926f539](https://github.com/diplodoc-platform/testpack/commit/926f5396753484b21a55cdb85c5b235a60287d45))
* **dependabot:** T3.13 Tests algolia ([767b834](https://github.com/diplodoc-platform/testpack/commit/767b834dcc605b64260d9c04f8d762dc1da011a6))
* **dependabot:** T3.14 Tests color ([9a0020e](https://github.com/diplodoc-platform/testpack/commit/9a0020e5986a500d4cfcfee060550828a782295e))
* **dependabot:** T3.18 Tests html ([6e4b3c1](https://github.com/diplodoc-platform/testpack/commit/6e4b3c1e858f16f38d604306387d2faf11cf43e3))
* **dependabot:** T3.20 Tests mermaid ([ee2998b](https://github.com/diplodoc-platform/testpack/commit/ee2998b391993927cea202f9d829a93c72c5a067))
* **dependabot:** T3.23 Tests quote-link ([50f7c05](https://github.com/diplodoc-platform/testpack/commit/50f7c051cb0c89661f6db50ce53d98a498dba8a3))
* **dependabot:** T3.24 Tests search ([31a975f](https://github.com/diplodoc-platform/testpack/commit/31a975fcdbd8d758845445e0e62819fc832cced2))
* **dependabot:** T3.25 Tests tabs ([bd0aee6](https://github.com/diplodoc-platform/testpack/commit/bd0aee64e243f976cf70b64137b04d079367be82))
* **dependabot:** T3.26 Tests infra ([99ec2ea](https://github.com/diplodoc-platform/testpack/commit/99ec2ea5830fa38df124211df3b9cc53e5ec9bc6))
* **dependabot:** T3.27 Tests package-template ([5445530](https://github.com/diplodoc-platform/testpack/commit/5445530ad939971f08fc015b4ea76b72a9590c98))
* **dependabot:** T3.28 Tests testpack ([c860a40](https://github.com/diplodoc-platform/testpack/commit/c860a404d033f4e1e264d0981e66dfed6997bf15))
* **dependabot:** T3.5 Tests directive ([62d3b70](https://github.com/diplodoc-platform/testpack/commit/62d3b705fa9ca6be19e2ea5871e6d990f1b6fbaa))
* **dependabot:** T3.9 Tests translation ([e2ca8b1](https://github.com/diplodoc-platform/testpack/commit/e2ca8b100f9c42deb92899b0875e0e6fbd310603))
* **dependabot:** T7.1 Verification Profiles ([802ee3d](https://github.com/diplodoc-platform/testpack/commit/802ee3d7ced68ef4750c0575118bf53a16aa8ae6))
* **dependabot:** T7.2 Reproducer Fixtures ([60ef890](https://github.com/diplodoc-platform/testpack/commit/60ef89086f1b0993ce31d29866f120d7f7d95566))
* **dependabot:** T7.3 Golden File Comparison ([cc88de4](https://github.com/diplodoc-platform/testpack/commit/cc88de45810d07deb59f0f8dc392965e93cad99f))
* **dependabot:** T7.4 Downstream Check ([08f9a71](https://github.com/diplodoc-platform/testpack/commit/08f9a71fba01abfce4af81ebb60aecf8a4adf310))
* **dependabot:** T7.5 Arcadia External Check ([e1b267d](https://github.com/diplodoc-platform/testpack/commit/e1b267de11dc5f550b55656c14960484f6e02bff))
* **testpack:** verify dependency updates across repositories ([387369e](https://github.com/diplodoc-platform/testpack/commit/387369e390f04c7ef0cfa08a6475f0375ade0d47))


### Bug Fixes

* **ci:** compare downstream regressions with baseline ([f013b8b](https://github.com/diplodoc-platform/testpack/commit/f013b8b2444b81edc6d840980026ed9099832cac))
* **ci:** compare standalone exports with package baseline ([6369aac](https://github.com/diplodoc-platform/testpack/commit/6369aac22fad600254f96efa2f5da25547609c05))
* **ci:** preserve deep verification evidence ([84aa446](https://github.com/diplodoc-platform/testpack/commit/84aa44695bc9bd7d81eb16ce5c7a5e335df12119))
* **dependabot:** harden deep verification ([e53bd8b](https://github.com/diplodoc-platform/testpack/commit/e53bd8b43bb649f54bd84a7496553198c4d6b21d))
* **testpack:** address review findings ([267e647](https://github.com/diplodoc-platform/testpack/commit/267e64701aacdd6d734cdd933fa002b1c2ca86f8))
* **testpack:** align dependency verification with real coverage ([478c5ae](https://github.com/diplodoc-platform/testpack/commit/478c5ae9e1cf4af3b16f83a128a7b476b90731cf))
* **testpack:** build metapackage in dependency order ([8d5a109](https://github.com/diplodoc-platform/testpack/commit/8d5a1098347cc7aef1a8cc4978d401aae20de9fb))
* **testpack:** build only verified dependency graph ([8162377](https://github.com/diplodoc-platform/testpack/commit/81623779bf8c5513f22babcb2c6aae393ce900bf))
* **testpack:** declare fixture plugin dependencies ([f0e54f8](https://github.com/diplodoc-platform/testpack/commit/f0e54f86e9e308997e4fc537cef6e26d174c43bd))
* **testpack:** honor cross-platform screenshot tolerance ([b803ded](https://github.com/diplodoc-platform/testpack/commit/b803ded5c62db86e4769698f9beba57899ef33d6))
* **testpack:** invoke workspace cli explicitly ([dfd5767](https://github.com/diplodoc-platform/testpack/commit/dfd57678472e3e72323d376365bc4a35419b841c))
* **testpack:** isolate and normalize generated corpus ([3ab7c93](https://github.com/diplodoc-platform/testpack/commit/3ab7c93feed16e9d5473da8afbd27832c3826527))
* **testpack:** make golden diffs reviewable ([58aeade](https://github.com/diplodoc-platform/testpack/commit/58aeade4c8a6e2eb6d5ee7ca97dcbabf1c6ee1ab))
* **testpack:** make standalone quality checks hermetic ([4755738](https://github.com/diplodoc-platform/testpack/commit/47557386acccbd9874f6c8f20d0be330b37346de))
* **testpack:** normalize CLI build artifacts ([3072bd3](https://github.com/diplodoc-platform/testpack/commit/3072bd31389f6f7ddd3b0c19ddf36194f70bb05a))
* **testpack:** normalize generated runtime ids ([11f4cef](https://github.com/diplodoc-platform/testpack/commit/11f4cef8ba2b9f06c297ac2e679839ce24ab1eb0))
* **testpack:** normalize screenshot tolerance across OSes ([3649cbf](https://github.com/diplodoc-platform/testpack/commit/3649cbffc34150364ba030e4a122100221a84a9c))
* **testpack:** pin reusable workflow tooling ([8e6d41f](https://github.com/diplodoc-platform/testpack/commit/8e6d41f58fc1c44343dc39557f18500cedef2b8e))
* **testpack:** pin SVG sanitizer for golden tests ([b921d27](https://github.com/diplodoc-platform/testpack/commit/b921d27f7a3cebfd92eb88faa6a7b7d44dc3387b))
* **testpack:** repair CI browser install and lint ([a67ae75](https://github.com/diplodoc-platform/testpack/commit/a67ae7544cc6bac0cbac5080d6b3cb94948b7f53))
* **testpack:** replace submodule from verified checkout ([d8e496f](https://github.com/diplodoc-platform/testpack/commit/d8e496f6736ffcd04c0065a5a8a9105bb43c0030))
* **testpack:** resolve metapackage base lock ([01f82d3](https://github.com/diplodoc-platform/testpack/commit/01f82d372f5d222f692a1ab2d0b4befde584be92))
* **testpack:** scope golden gate to dependency PRs ([ceb99c5](https://github.com/diplodoc-platform/testpack/commit/ceb99c546ec263f8dde31740627fcf70d501f215))
* **testpack:** stabilize golden comparison ([c06c8ce](https://github.com/diplodoc-platform/testpack/commit/c06c8ce0368acaf325318627ac3d51b067bed02c))
* **testpack:** tolerate cross-platform SVG rasterization ([6d295a0](https://github.com/diplodoc-platform/testpack/commit/6d295a034ca2d4e241eb051531456719f995522a))
* **testpack:** use native path separators ([6f5bc51](https://github.com/diplodoc-platform/testpack/commit/6f5bc518da60931ff5fa97ad4d16383b044374f9))
* **testpack:** use workspace browser cache ([81de36b](https://github.com/diplodoc-platform/testpack/commit/81de36b8693de0d14a2129d7b2ef817490e02ec8))

## [1.0.1](https://github.com/diplodoc-platform/testpack/compare/v1.0.0...v1.0.1) (2026-08-07)


### Bug Fixes

* add mermaid basic test, safari check ([c16b2d3](https://github.com/diplodoc-platform/testpack/commit/c16b2d3a7e3ae63e8fb2983fb45df5413192e14c))
* Fix docs command ([740f390](https://github.com/diplodoc-platform/testpack/commit/740f3908bf9041b6ceba578644159a29502610cf))
* Fix server config ([41f9e08](https://github.com/diplodoc-platform/testpack/commit/41f9e08176c16c06acee0a89e8a071741db39f56))
* Fix server listening message ([c910cb6](https://github.com/diplodoc-platform/testpack/commit/c910cb62a5eb2cbc872ccdea7d700a5375d800e1))
* fixed playwright ([4b86dd6](https://github.com/diplodoc-platform/testpack/commit/4b86dd67383b4286f51381442ea0199ee320022b))
* fixed playwright ([ef928c6](https://github.com/diplodoc-platform/testpack/commit/ef928c6a0c2dbfddcda5c642e773e4e814033198))
* Skip unstable mermaid tests ([4bd2c00](https://github.com/diplodoc-platform/testpack/commit/4bd2c000b7005feb4a955d75caf2217713a2f479))
* **testpack:** fix TypeScript typecheck errors ([fc63ecb](https://github.com/diplodoc-platform/testpack/commit/fc63ecb8261352ddc359b1cdc237e10ea959722b))
* **testpack:** prevent auto-expand on focus in cut keyboard test ([c01e3cc](https://github.com/diplodoc-platform/testpack/commit/c01e3cc86dfc56ac2f50b7a4048f6aa873e62ffe))
* **testpack:** remove deprecated husky lines from commit-msg hook ([2b3db41](https://github.com/diplodoc-platform/testpack/commit/2b3db41ea6c123fed8e6cb11a766dd2a79fb90c7))
* Upgrade typescript to 5.9.3 DOCSTOOLS-6357 ([ad4986f](https://github.com/diplodoc-platform/testpack/commit/ad4986f6da1971de5e783bb8a852f0062ff3d84f))
* Upgrade typescript to 6.0.3 DOCSTOOLS-6359 ([0f6379a](https://github.com/diplodoc-platform/testpack/commit/0f6379a1b4dcee8ebcd34c18a70f1cf69251085f))
