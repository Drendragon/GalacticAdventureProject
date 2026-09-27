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
  ],
  UI.FieldGroup #GeneralInformation: {
    Data: [
      {
        $Type: 'UI.DataField',
        Label: 'First Name',
        Value: firstName
      },
      {
        $Type: 'UI.DataField',
        Label: 'Last Name',
        Value: lastName
      },
      {
        $Type: 'UI.DataField',
        Label: 'Email',
        Value: email
      },
      {
        $Type: 'UI.DataField',
        Label: 'Origin Planet',
        Value: originPlanet
      },
      {
        $Type: 'UI.DataField',
        Label: 'Department',
        Value: department_ID
      },
      {
        $Type: 'UI.DataField',
        Label: 'Position',
        Value: position_ID
      }
    ]
  },
  UI.FieldGroup #SpacefaringStatistics: {
    Data: [
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
  },
  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'General Information',
      Target: '@UI.FieldGroup#GeneralInformation'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'Spacefaring Statistics',
      Target: '@UI.FieldGroup#SpacefaringStatistics'
    }
  ]
);

annotate service.Spacefarers with {
  originPlanet @UI.FieldControl: #ReadOnly;
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
