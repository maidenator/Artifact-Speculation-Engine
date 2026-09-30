#include <emscripten/bind.h>
#include <string>
#include <cstdint>
#include "artifact_interface.hpp"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(artifact_engine) {
    class_<ArtifactInterface>("ArtifactInterface")
        .constructor<>()
        .constructor<uint64_t>()
        .function("setSeed", &ArtifactInterface::setSeed)
        .function("generateBatchJson", &ArtifactInterface::generateBatchJson)
        .function("generateBatchWithHistoryJson", &ArtifactInterface::generateBatchWithHistoryJson)
        .function("runSimulationJson", &ArtifactInterface::runSimulationJson);
}