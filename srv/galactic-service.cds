using { galactic.spacefarers as db } from '../db/schema';

@path: 'galactic'
@requires: 'SpacefarerUser'
service GalacticService {
  @odata.draft.enabled
  entity Spacefarers as projection on db.Spacefarers;
  @readonly entity Departments as projection on db.Departments;
  @readonly entity Positions   as projection on db.Positions;
}
