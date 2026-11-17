import { groupedCrud } from "@/lib/content/grouped-crud";

const crud = groupedCrud({
  groupTable: "service_groups",
  itemTable: "service_items",
  itemTypes: ["item"],
});

export const GET = crud.GET;
export const POST = crud.POST;
export const PATCH = crud.PATCH;
export const DELETE = crud.DELETE;
