import { groupedCrud } from "@/lib/content/grouped-crud";

const crud = groupedCrud({
  groupTable: "slider_groups",
  itemTable: "slider_slides",
  itemTypes: ["slide"],
});

export const GET = crud.GET;
export const POST = crud.POST;
export const PATCH = crud.PATCH;
export const DELETE = crud.DELETE;
