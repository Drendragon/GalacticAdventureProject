import cds from "@sap/cds";

import type { SpacefarerData, SpacefarerRequest } from "./types";

const departments = "galactic.spacefarers.Departments";
const positions = "galactic.spacefarers.Positions";

export async function validateAssignment(req: SpacefarerRequest, data = req.data): Promise<void> {
  const { department_ID: departmentID, position_ID: positionID } = data;
  const transaction = cds.tx(req);

  if (departmentID) {
    const department = await transaction.run(SELECT.one.from(departments).where({ ID: departmentID }));
    if (!department) req.reject(400, "The selected department does not exist", "department_ID");
  }

  if (!positionID) return;
  requireDepartment(req, departmentID);

  const position = await transaction.run(SELECT.one.from(positions).columns("department_ID").where({ ID: positionID }));
  if (!position) req.reject(400, "The selected position does not exist", "position_ID");
  if (position.department_ID !== departmentID) {
    req.reject(400, "The selected position does not belong to the selected department", "position_ID");
  }
}

function requireDepartment(req: SpacefarerRequest, departmentID: SpacefarerData["department_ID"]): asserts departmentID is string {
  if (!departmentID) req.reject(400, "A department is required when selecting a position", "department_ID");
}
