#include <catch2/catch_test_macros.hpp>
#include <bitset>
#include <set>
#include <cstdint>
#include "random_utils.hpp"

// =====================================================================
// Xoshiro256: determinism
// =====================================================================

TEST_CASE("Xoshiro256: same seed produces the same sequence") {
    rng::Xoshiro256 rngA(42);
    rng::Xoshiro256 rngB(42);

    for (int i = 0; i < 100; ++i) {
        REQUIRE(rngA() == rngB());
    }
}

TEST_CASE("Xoshiro256: different seeds produce different sequences") {
    rng::Xoshiro256 rngA(1);
    rng::Xoshiro256 rngB(2);

    // Extremely unlikely for the first output to collide by chance
    // (1 in 2^64) unless something is wrong with seed mixing.
    REQUIRE(rngA() != rngB());
}

TEST_CASE("Xoshiro256: reseeding with the same value resets the sequence") {
    rng::Xoshiro256 rngA(7);
    uint64_t firstRun[5];
    for (auto& v : firstRun) v = rngA();

    rng::Xoshiro256 rngB(7); // fresh instance, same seed
    for (auto v : firstRun) {
        REQUIRE(rngB() == v);
    }
}

// =====================================================================
// Xoshiro256: degeneracy checks
// =====================================================================

TEST_CASE("Xoshiro256: seed of 0 does not produce a degenerate all-zero stream") {
    // The SplitMix-based seeding is supposed to guarantee "healthy,
    // non-zero state values" even from a zero seed -- verify that claim.
    rng::Xoshiro256 rngZero(0);

    bool sawNonZero = false;
    for (int i = 0; i < 20; ++i) {
        if (rngZero() != 0) {
            sawNonZero = true;
            break;
        }
    }
    REQUIRE(sawNonZero);
}

TEST_CASE("Xoshiro256: does not repeat every output back-to-back") {
    // A healthy generator shouldn't produce the same value twice in a row
    // across a reasonably long run (would indicate a stuck/degenerate state).
    rng::Xoshiro256 gen(123);
    uint64_t prev = gen();
    bool foundRepeat = false;

    for (int i = 0; i < 1000; ++i) {
        uint64_t next = gen();
        if (next == prev) {
            foundRepeat = true;
            break;
        }
        prev = next;
    }
    REQUIRE_FALSE(foundRepeat);
}

TEST_CASE("Xoshiro256: does not produce many duplicate values over a large run") {
    // Not a proof of randomness, but a cheap smoke test: for a 64-bit
    // generator, seeing duplicates within a few thousand draws would be
    // a strong signal something is badly wrong (tiny effective state, etc).
    rng::Xoshiro256 gen(999);
    std::set<uint64_t> seen;

    const int sampleSize = 5000;
    for (int i = 0; i < sampleSize; ++i) {
        seen.insert(gen());
    }

    REQUIRE(seen.size() == sampleSize);
}

// =====================================================================
// Xoshiro256: rough statistical sanity (not a real randomness test suite)
// =====================================================================

TEST_CASE("Xoshiro256: bit distribution is roughly balanced") {
    // Across many draws, roughly half the bits should be set. This is a
    // loose sanity check, not a substitute for a real PRNG test suite
    // (e.g. TestU01/PractRand) -- it just catches obviously broken output
    // like "always returns small numbers" or "top bits always zero".
    rng::Xoshiro256 gen(2024);

    const int sampleSize = 10000;
    long long totalBits = 0;
    for (int i = 0; i < sampleSize; ++i) {
        totalBits += std::bitset<64>(gen()).count();
    }

    double averageBitsSet = static_cast<double>(totalBits) / sampleSize;
    // Expected ~32 bits set per 64-bit value; allow generous margin.
    REQUIRE(averageBitsSet > 28.0);
    REQUIRE(averageBitsSet < 36.0);
}

// =====================================================================
// fastUniform / fastUniformRange (built on top of Xoshiro256)
// =====================================================================

TEST_CASE("fastUniform: result stays within 0 to bound") {
    rng::Xoshiro256 gen(55);
    const int32_t bound = 37; // deliberately not a power of 2

    for (int i = 0; i < 5000; ++i) {
        uint32_t result = rng::fastUniform(bound, gen);
        REQUIRE(result < static_cast<uint32_t>(bound));
    }
}

TEST_CASE("fastUniform: bound of 1 always returns 0") {
    rng::Xoshiro256 gen(56);
    for (int i = 0; i < 100; ++i) {
        REQUIRE(rng::fastUniform(1, gen) == 0);
    }
}

TEST_CASE("fastUniformRange: result stays within min to max") {
    rng::Xoshiro256 gen(77);
    const int32_t lo = -10;
    const int32_t hi = 10;

    for (int i = 0; i < 5000; ++i) {
        int32_t result = rng::fastUniformRange(lo, hi, gen);
        REQUIRE(result >= lo);
        REQUIRE(result <= hi);
    }
}

TEST_CASE("fastUniformRange: min == max always returns that single value") {
    rng::Xoshiro256 gen(78);
    for (int i = 0; i < 50; ++i) {
        REQUIRE(rng::fastUniformRange(5, 5, gen) == 5);
    }
}

TEST_CASE("fastUniformRange: every value in a small range eventually appears") {
    // Over enough draws from a small range, every value should show up at
    // least once. Catches an off-by-one in the range math (e.g. never
    // hitting max, or never hitting min).
    rng::Xoshiro256 gen(99);
    const int32_t lo = 0;
    const int32_t hi = 4; // 5 possible values

    std::set<int32_t> seenValues;
    for (int i = 0; i < 2000; ++i) {
        seenValues.insert(rng::fastUniformRange(lo, hi, gen));
    }

    REQUIRE(seenValues.size() == 5);
    REQUIRE(seenValues.count(lo) == 1);
    REQUIRE(seenValues.count(hi) == 1);
}