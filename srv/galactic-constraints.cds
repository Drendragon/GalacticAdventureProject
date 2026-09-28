using { GalacticService } from './galactic-service';

annotate GalacticService.Spacefarers with {
  firstName                   @mandatory @mandatory.message: 'First name is required.';
  lastName                    @mandatory @mandatory.message: 'Last name is required.';
  email                       @mandatory @mandatory.message: 'Email is required.';
  stardustCollection          @assert.range.message: 'Stardust collection cannot be negative.';
  wormholeNavigationSkill     @assert.range.message: 'Navigation skill must be between 0 and 100.';
};
