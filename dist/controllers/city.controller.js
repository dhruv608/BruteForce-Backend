"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCity = exports.updateCity = exports.getAllCities = exports.createCity = void 0;
const city_service_1 = require("../services/city.service");
// Create City
const createCity = async (req, res) => {
    try {
        const { city_name } = req.body;
        const city = await (0, city_service_1.createCityService)({ city_name });
        return res.status(201).json({
            message: "City created successfully",
            city,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.createCity = createCity;
// Get All Cities
const getAllCities = async (req, res) => {
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
        return res.status(500).json({
            error: "Failed to fetch cities",
        });
    }
};
exports.getAllCities = getAllCities;
// delete city 
const updateCity = async (req, res) => {
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
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.updateCity = updateCity;
const deleteCity = async (req, res) => {
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
        return res.status(400).json({
            error: error.message,
        });
    }
};
exports.deleteCity = deleteCity;
