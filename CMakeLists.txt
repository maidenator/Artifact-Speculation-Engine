cmake_minimum_required(VERSION 3.14)
project(artifact-speculation-engine CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v3.5.2
)
FetchContent_MakeAvailable(Catch2)

add_executable(tests
    cpp/tests/test_distributions.cpp
    cpp/tests/test_random_utils.cpp
    cpp/tests/test_generator.cpp
    cpp/tests/test_simulator.cpp
)

target_include_directories(tests PRIVATE 
    cpp/artifact
    cpp/domain
)
target_link_libraries(tests PRIVATE Catch2::Catch2WithMain)

include(CTest)
include(Catch)
catch_discover_tests(tests)