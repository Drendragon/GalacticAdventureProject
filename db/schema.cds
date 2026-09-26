using { cuid, managed } from '@sap/cds/common';

namespace galactic.spacefarers;

entity Departments : cuid {
  name        : String(100);
  description : String(500);
}

entity Positions : cuid {
  name        : String(100);
  description : String(500);
  department  : Association to Departments not null @assert.target;
}

entity Spacefarers : cuid, managed {
  firstName                   : String(100) not null;
  lastName                    : String(100) not null;
  email                       : String(255) not null;
  originPlanet                : String(100) not null;
  spacesuitColor              : String(50);
  stardustCollection          : Integer not null default 0 @assert.range: [0, _];
  wormholeNavigationSkill     : Integer not null default 1 @assert.range: [0, 100];
  department                  : Association to Departments @assert.target;
  position                    : Association to Positions @assert.target;
}
