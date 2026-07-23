import locationData from './indiaLocationData.json';

/**
 * Reusable location service for India.
 * Provides hierarchical access to States, Districts, and Cities.
 */
export const getStates = () => {
    return Object.keys(locationData).sort();
};

export const getDistricts = (stateName) => {
    if (!stateName || !locationData[stateName]) return [];
    return Object.keys(locationData[stateName]).sort();
};

export const getCities = (stateName, districtName) => {
    if (!stateName || !districtName || !locationData[stateName] || !locationData[stateName][districtName]) return [];
    return locationData[stateName][districtName];
};

export const getPincodeForCity = (stateName, districtName, cityName) => {
    const cities = getCities(stateName, districtName);
    const found = cities.find(c => c.city === cityName);
    return found ? found.pincode : '';
};

export const getCountry = () => {
    return 'India';
};

export const getCountries = () => {
    return ['India'];
};
