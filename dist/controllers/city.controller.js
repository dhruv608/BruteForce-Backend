"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCity = exports.updateCity = exports.getAllCities = exports.createCity = void 0;
const city_service_1 = require("../services/city.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
// Create City
exports.createCity = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { city_name } = req.body;
        const city = await (0, city_service_1.createCityService)({ city_name });
        return res.status(201).json({
            message: "City created successfully",
            city,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
// Get All Cities
exports.getAllCities = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { search } = req.query;
        let cities = await (0, city_service_1.getAllCitiesService)();
        // If search parameter is provided, filter cities by name
        if (search) {
            const searchTerm = search.toString().toLowerCase();
            cities = cities.filter(city => city.city_name.toLowerCase().includes(searchTerm));
        }
        return res.json(cities);
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(500, "Failed to fetch cities");
    }
});
// delete city 
exports.updateCity = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const { city_name } = req.body;
        const updatedCity = await (0, city_service_1.updateCityService)({
            id: Number(id),
            city_name,
        });
        return res.json({
            message: "City updated successfully",
            city: updatedCity,
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
exports.deleteCity = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        await (0, city_service_1.deleteCityService)({
            id: Number(id),
        });
        return res.json({
            message: "City deleted successfully",
        });
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError)
            throw error;
        throw new ApiError_1.ApiError(400, error.message);
    }
});
