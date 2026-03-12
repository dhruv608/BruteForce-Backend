import prisma from "../config/prisma";
import { generateSlug } from "../utils/slugify";

interface CreateCityInput {
  city_name: string;
}

export const createCityService = async ({
  city_name,
}: CreateCityInput) => {

  if (!city_name) {
    throw new Error("City name is required");
  }

  const existingName = await prisma.city.findUnique({
    where: { city_name },
  });

  if (existingName) {
    throw new Error("City already exists");
  }

  const baseSlug = generateSlug(city_name);

  let slug = baseSlug;
  let counter = 1;

  while (await prisma.city.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const city = await prisma.city.create({
    data: {
      city_name,
      slug,
    },
  });

  return city;
};


//  GET ALL CITIES

export const getAllCitiesService = async () => {
  const cities = await prisma.city.findMany({
    orderBy: { created_at: "desc" },
  });

  return cities;
};

//  UPDATE CITY
interface UpdateCityInput {
  id: number;
  city_name: string;
}

export const updateCityService = async ({
  id,
  city_name,
}: UpdateCityInput) => {

  if (!city_name) {
    throw new Error("City name is required");
  }

  const existingCity = await prisma.city.findUnique({
    where: { id },
  });

  if (!existingCity) {
    throw new Error("City not found");
  }

  const duplicateName = await prisma.city.findUnique({
    where: { city_name },
  });

  if (duplicateName && duplicateName.id !== existingCity.id) {
    throw new Error("City name already in use");
  }
  
  const baseSlug = generateSlug(city_name);
  let newSlug = baseSlug;
  let counter = 1;

  while (
    await prisma.city.findFirst({
      where: {
        slug: newSlug,
        NOT: { id: existingCity.id },
      },
    })
  ) {
    newSlug = `${baseSlug}-${counter++}`;
  }

  const updatedCity = await prisma.city.update({
    where: { id: existingCity.id },
    data: {
      city_name,
      slug: newSlug,
    },
  });

  return updatedCity;
};

//  DELETE CITY
interface DeleteCityInput {
  id: number;
}
export const deleteCityService = async ({
  id,
}: DeleteCityInput) => {

  const city = await prisma.city.findUnique({
    where: { id },
  });

  if (!city) {
    throw new Error("City not found");
  }

  const batchCount = await prisma.batch.count({
    where: { city_id: city.id },
  });

  if (batchCount > 0) {
    throw new Error("Cannot delete city with active batches");
  }

  const studentCount = await prisma.student.count({
    where: { city_id: city.id },
  });

  if (studentCount > 0) {
    throw new Error("Cannot delete city with active students");
  }

  await prisma.city.delete({
    where: { id: city.id },
  });

  return true;
};