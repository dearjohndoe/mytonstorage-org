"use client"

import { useTranslation } from "react-i18next";
import { ThreeStateField } from "./tri-state-field";

export const sortingStates = {
    randomSorting: "Random Sorting",
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
    const { t } = useTranslation();
    const locationKeys: (keyof typeof locationStates)[] = ["differentCountries", "differentCities", "all"];
    const sortingKeys: (keyof typeof sortingStates)[] = ["sortByRating", "sortByPrice", "randomSorting"];

    const locationIndex = locationKeys.indexOf(locationFilter);
    const sortingIndex = sortingKeys.indexOf(sortingFilter);

    const handleLocationChange = (newIndex: number) => {
        onLocationFilterChange(locationKeys[newIndex]);
    };

    const handleSortingChange = (newIndex: number) => {
        onSortingFilterChange(sortingKeys[newIndex]);
    };

    return (
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'place-content-between'}`}>
            <label className="block text-gray-700 mb-2">
                {t('filtersStates.title')}:
            </label>
            <div className="flex flex-col gap-4 items-center md:flex-row md:gap-8 md:flex-wrap">
                <ThreeStateField
                    states={[t('filtersStates.fromDifferentCountries'), t('filtersStates.fromDifferentCities'), t('filtersStates.anyLocation')]}
                    colors={["bg-blue-300", "bg-blue-300", "bg-gray-200"]}
                    value={locationIndex}
                    onChange={handleLocationChange}
                />
                <ThreeStateField
                    states={[t('filtersStates.sortByRating'), t('filtersStates.sortByPrice'), t('filtersStates.randomSorting')]}
                    colors={["bg-blue-300", "bg-blue-300", "bg-gray-200"]}
                    value={sortingIndex}
                    onChange={handleSortingChange}
                />
            </div>
        </div>
    );
}
