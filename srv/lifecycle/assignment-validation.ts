import cds from "@sap/cds";

import type { SpacefarerData, SpacefarerRequest } from "./types";

const positions = "galactic.spacefarers.Positions";

export async function validateAssignment(req: SpacefarerRequest, data = req.data): Promise<void> {
  const { department_ID: departmentID, position_ID: positionID } = data;
  const transaction = cds.tx(req);

  if (!positionID) return;
  requireDepartment(req, departmentID);

  const position = await transaction.run(SELECT.one.from(positions).columns("department_ID").where({ ID: positionID }));
  if (!position) return;
  if (position.department_ID !== departmentID) {
    req.reject(400, "The selected position does not belong to the selected department.", "position_ID");
  }
}

function requireDepartment(req: SpacefarerRequest, departmentID: SpacefarerData["department_ID"]): asserts departmentID is string {
  if (!departmentID) req.reject(400, "A department is required when selecting a position.", "department_ID");
}
