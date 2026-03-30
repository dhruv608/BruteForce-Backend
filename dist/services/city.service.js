"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCityService = exports.updateCityService = exports.getAllCitiesService = exports.createCityService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = require("../utils/ApiError");
const createCityService = async ({ city_name, }) => {
    if (!city_name) {
        throw new ApiError_1.ApiError(400, "City name is required", [], "REQUIRED_FIELD");
    }
    const existingName = await prisma_1.default.city.findUnique({
        where: { city_name },
    });
    if (existingName) {
        throw new ApiError_1.ApiError(400, "City already exists", [], "CITY_EXISTS");
    }
    const city = await prisma_1.default.city.create({
        data: {
            city_name,
        },
    });
    return city;
};
exports.createCityService = createCityService;
//  GET ALL CITIES
const getAllCitiesService = async () => {
    const cities = await prisma_1.default.city.findMany({
        orderBy: { created_at: "desc" },
        select: {
            id: true,
            city_name: true,
            created_at: true,
            _count: {
                select: {
                    batches: true,
                    students: true
                }
            }
        }
    });
    // Transform the response to include counts directly
    return cities.map(city => ({
        id: city.id,
        city_name: city.city_name,
        created_at: city.created_at,
        total_batches: city._count.batches,
        total_students: city._count.students
    }));
};
exports.getAllCitiesService = getAllCitiesService;
const updateCityService = async ({ id, city_name, }) => {
    if (!city_name) {
        throw new ApiError_1.ApiError(400, "City name is required", [], "VALIDATION_ERROR");
    }
    const existingCity = await prisma_1.default.city.findUnique({
        where: { id },
    });
    if (!existingCity) {
        throw new ApiError_1.ApiError(404, "City not found", [], "CITY_NOT_FOUND");
    }
    const duplicateName = await prisma_1.default.city.findUnique({
        where: { city_name },
    });
    if (duplicateName && duplicateName.id !== existingCity.id) {
        throw new ApiError_1.ApiError(400, "City name already in use", [], "CITY_EXISTS");
    }
    const updatedCity = await prisma_1.default.city.update({
        where: { id: existingCity.id },
        data: {
            city_name,
        },
    });
    return updatedCity;
};
exports.updateCityService = updateCityService;
const deleteCityService = async ({ id, }) => {
    const city = await prisma_1.default.city.findUnique({
        where: { id },
    });
    if (!city) {
        throw new ApiError_1.ApiError(404, "City not found", [], "CITY_NOT_FOUND");
    }
    const batchCount = await prisma_1.default.batch.count({
        where: { city_id: city.id },
    });
    if (batchCount > 0) {
        throw new ApiError_1.ApiError(400, "Cannot delete city with active batches", [], "VALIDATION_ERROR");
    }
    const studentCount = await prisma_1.default.student.count({
        where: { city_id: city.id },
    });
    if (studentCount > 0) {
        throw new ApiError_1.ApiError(400, "Cannot delete city with active students", [], "VALIDATION_ERROR");
    }
    await prisma_1.default.city.delete({
        where: { id: city.id },
    });
    return true;
};
exports.deleteCityService = deleteCityService;
