## Artifact Speculation Engine

**An artifact domain simulator that uses a Monte Carlo engine to simulate game accurate artifact runs.**
___
### TODO:

**Core Engine**
- [x] Artifact generation (slot, main stat, initial substats)
- [x] Level-up simulation (+4 per upgrade, substat unlock/reroll)
- [x] Crit Value calculation

**Performance**
- [ ] Profile the hot loop (identify real bottlenecks before optimizing)
- [x] Multithreading

**Testing & CI**
- [x] Unit tests for distributions (verify weight tables actually sum to 100)
- [x] Unit tests for RNG (Just a smokescreen test, cant really test Xoshiro without beating it with TestU01)
- [x] Automated testing via GitHub Actions