import { groupedCrud } from "@/lib/content/grouped-crud";

const crud = groupedCrud({
  groupTable: "testimonial_groups",
  itemTable: "testimonials",
  itemTypes: ["item"],
});

export const GET = crud.GET;
export const POST = crud.POST;
export const PATCH = crud.PATCH;
export const DELETE = crud.DELETE;
