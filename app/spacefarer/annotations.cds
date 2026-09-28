using GalacticService as service from '../../srv/galactic-service';

annotate service.Spacefarers with @(
  UI.HeaderInfo: {
    TypeName      : '{@i18n>spacefarer}',
    TypeNamePlural: '{@i18n>spacefarers}',
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
      Label: '{@i18n>name}',
      Value: name,
      ![@UI.Importance]: #High
    },
    {
      $Type: 'UI.DataField',
      Label: '{@i18n>originPlanet}',
      Value: originPlanet,
      ![@UI.Importance]: #High
    },
    {
      $Type: 'UI.DataField',
      Label: '{@i18n>department}',
      Value: department.name
    },
    {
      $Type: 'UI.DataField',
      Label: '{@i18n>position}',
      Value: position.name
    },
    {
      $Type: 'UI.DataField',
      Label: '{@i18n>stardustCollection}',
      Value: stardustCollection
    },
    {
      $Type: 'UI.DataField',
      Label: '{@i18n>wormholeNavigationSkill}',
      Value: wormholeNavigationSkill
    },
    {
      $Type: 'UI.DataField',
      Label: '{@i18n>spacesuitColor}',
      Value: spacesuitColor
    }
  ],
  UI.FieldGroup #GeneralInformation: {
    Data: [
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>firstName}',
        Value: firstName
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>lastName}',
        Value: lastName
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>email}',
        Value: email
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>originPlanet}',
        Value: originPlanet
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>department}',
        Value: department_ID
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>position}',
        Value: position_ID
      }
    ]
  },
  UI.FieldGroup #SpacefaringStatistics: {
    Data: [
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>stardustCollection}',
        Value: stardustCollection
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>wormholeNavigationSkill}',
        Value: wormholeNavigationSkill
      },
      {
        $Type: 'UI.DataField',
        Label: '{@i18n>spacesuitColor}',
        Value: spacesuitColor
      }
    ]
  },
  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      Label: '{@i18n>generalInformation}',
      Target: '@UI.FieldGroup#GeneralInformation'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Label: '{@i18n>spacefaringStatistics}',
      Target: '@UI.FieldGroup#SpacefaringStatistics'
    }
  ]
);

annotate service.Spacefarers with @title: '{@i18n>spacefarer}' {
  firstName               @title: '{@i18n>firstName}';
  lastName                @title: '{@i18n>lastName}';
  name                    @title: '{@i18n>name}';
  email                   @title: '{@i18n>email}' @Communication.IsEmailAddress;
  originPlanet            @title: '{@i18n>originPlanet}' @UI.FieldControl: #ReadOnly;
  department              @title: '{@i18n>department}' @Common.Text: department.name;
  position                @title: '{@i18n>position}' @Common.Text: position.name;
  stardustCollection      @title: '{@i18n>stardustCollection}';
  wormholeNavigationSkill @title: '{@i18n>wormholeNavigationSkill}';
  spacesuitColor          @title: '{@i18n>spacesuitColor}';
};

annotate service.Departments with @title: '{@i18n>department}' {
  ID   @Common.Text: name;
  name @title      : '{@i18n>department}';
};

annotate service.Positions with @title: '{@i18n>position}' {
  ID   @Common.Text: name;
  name @title      : '{@i18n>position}';
};
