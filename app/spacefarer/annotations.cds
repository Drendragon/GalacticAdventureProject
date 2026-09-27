using GalacticService as service from '../../srv/galactic-service';

annotate service.Spacefarers with @(
  UI.HeaderInfo: {
    TypeName      : 'Spacefarer',
    TypeNamePlural: 'Spacefarers',
    Title         : {
      $Type: 'UI.DataField',
      Value: name
    }
  },
  UI.SelectionFields: [
    originPlanet,
    department_ID,
    position_ID,
    spacesuitColor
  ],
  UI.LineItem: [
    {
      $Type: 'UI.DataField',
      Label: 'Name',
      Value: name,
      ![@UI.Importance]: #High
    },
    {
      $Type: 'UI.DataField',
      Label: 'Origin Planet',
      Value: originPlanet,
      ![@UI.Importance]: #High
    },
    {
      $Type: 'UI.DataField',
      Label: 'Department',
      Value: department.name
    },
    {
      $Type: 'UI.DataField',
      Label: 'Position',
      Value: position.name
    },
    {
      $Type: 'UI.DataField',
      Label: 'Stardust Collection',
      Value: stardustCollection
    },
    {
      $Type: 'UI.DataField',
      Label: 'Wormhole Navigation Skill',
      Value: wormholeNavigationSkill
    },
    {
      $Type: 'UI.DataField',
      Label: 'Spacesuit Color',
      Value: spacesuitColor
    }
  ]
);

annotate service.Spacefarers with {
  department @Common.Text: department.name;
  position   @Common.Text: position.name;
};

annotate service.Departments with {
  ID   @Common.Text: name;
  name @title      : 'Department';
};

annotate service.Positions with {
  ID   @Common.Text: name;
  name @title      : 'Position';
};
