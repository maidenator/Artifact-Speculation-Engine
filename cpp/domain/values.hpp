#pragma once

namespace values
{
    inline int daysToResin(int days) {
        return days * 180;
    }

    inline int resinToDays(int resin) {
        return resin / 180;
    }

    inline int resinToDomainRuns(int resin) {
        return resin / 20;
    }
}