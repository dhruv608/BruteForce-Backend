import { Request, Response } from "express";
import { createCityService, deleteCityService, getAllCitiesService, updateCityService } from "../services/city.service";

// Create City
export const createCity = async (req: Request, res: Response) => {
   try {
    const { city_name } = req.body;

    const city = await createCityService({ city_name });

    return res.status(201).json({
      message: "City created successfully",
      city,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

// Get All Cities
export const getAllCities = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let cities = await getAllCitiesService();
    
    // If search parameter is provided, filter cities by name
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      cities = cities.filter(city => 
        city.city_name.toLowerCase().includes(searchTerm)
      );
    }
    
    return res.json(cities);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch cities",
    });
  }
};
// delete city 

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { city_name } = req.body;

    const updatedCity = await updateCityService({
      id: Number(id),
      city_name,
    });

    return res.json({
      message: "City updated successfully",
      city: updatedCity,
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const deleteCity = async (req: Request, res: Response) => {
 try {
    const { id } = req.params;

    await deleteCityService({
      id: Number(id),
    });

    return res.json({
      message: "City deleted successfully",
    });

  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};




