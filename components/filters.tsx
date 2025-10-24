"use client"

import React from "react"
import { ThreeStateField } from "./tri-state-field";

export const sortingStates = {
    noSorting: "No Sorting",
    sortByRating: "Sort by Rating",
    sortByPrice: "Sort by Price",
};

export const locationStates = {
    differentCountries: "Different Countries",
    differentCities: "Different Cities",
    all: "Any",
};

export interface FiltersSectionProps {
    locationFilter: keyof typeof locationStates
    sortingFilter: keyof typeof sortingStates
    onLocationFilterChange: (newLocation: keyof typeof locationStates) => void
    onSortingFilterChange: (newSorting: keyof typeof sortingStates) => void
    isMobile: boolean | null
}

export function FiltersSection({
    locationFilter,
    sortingFilter,
    onLocationFilterChange,
    onSortingFilterChange,
    isMobile,
}: FiltersSectionProps) {
    const locationKeys: (keyof typeof locationStates)[] = ["differentCountries", "differentCities", "all"];
    const sortingKeys: (keyof typeof sortingStates)[] = ["sortByRating", "sortByPrice", "noSorting"];

    const locationIndex = locationKeys.indexOf(locationFilter);
    const sortingIndex = sortingKeys.indexOf(sortingFilter);

    const handleLocationChange = (newIndex: number) => {
        onLocationFilterChange(locationKeys[newIndex]);
    };

    const handleSortingChange = (newIndex: number) => {
        onSortingFilterChange(sortingKeys[newIndex]);
    };

    return (
        <div className={isMobile ? 'mt-6' : ''}>
            <p className="text-center text-gray-700 justify-self-start mt-4">
                Filters:
            </p>
            <div className={`flex ${isMobile ? 'gap-4' : ' gap-16'} flex-wrap items-center justify-center items-end`}>
                <ThreeStateField
                    states={["From different Countries", "From different Cities", "Any Location"]}
                    colors={["bg-blue-300", "bg-blue-300", "bg-gray-200"]}
                    value={locationIndex}
                    onChange={handleLocationChange}
                />
                <ThreeStateField
                    states={["Sort by Rating", "Sort by Price", "No Sorting"]}
                    colors={["bg-blue-300", "bg-blue-300", "bg-gray-200"]}
                    value={sortingIndex}
                    onChange={handleSortingChange}
                />
            </div>
        </div>
    );
}
