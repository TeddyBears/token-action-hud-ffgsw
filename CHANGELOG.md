# Changelog

`12.4.5.1_906`

* Fixes:
  * fix problem with piloting crew skill

`12.4.4.1_906`

* Features:
  * Add weapon skill to tooltip
  * Add firing arcs arcs for vehicle weapon to tooltip
* Fixes:
  * Status effects dice in roll pool when counter is not displayed (ie. value egals 1)

`12.4.3.1_906`

* Features:
  * Use status Id instead of image path to define roll pool
  * Check if status Id already exists in the list of status effect before add the new ones. Now image and name can be modified.
  * Change icons for dices. Thanks to @ercete

`12.4.2.1_906`

* Features:
  * Add an option to display dice pool in TAH. This option is active by default
* Fixes:
  * Translation for the status effect dialog box title
  * Use defense from Star Wars FFG system is now apply to dices pool from TAH weapons

`12.4.1.1_906`

* Features:
  * Compatibility with `Status Icon Counter` version 3.0.x for status effect
  * If option to add/remove boost or setback dices from 'actions' is set the new status effects are added automatically in the `Assign status effects` menu

`12.4.0.1_903`

* Features:
  * Allow status effects for boost and setback dices in the module settings
  * Allow actions to add status effect for boost and setback dices in the module settings
  * Allow the new status effects to affect roll in the module settings
* Fixes:
  * Use weapon status to manage vehicle weapon difficulty for dices rolls
  * Use item attachement modifiers for weapon dice rolls

`12.3.1.1_903`

* Fixes:
  * Add new skill category "Other". Imported skills that don't belong to standard categories are assign to tis new category
  * Use the standard skill list for the translated label or the skill lable for imported skill

`12.3.0.1_903`

* Features:
  * Add tooltip for weapons (Range, damage and critical values)
  * Use the new dialog system (light/dark theme)
  * For crew skills using the Pilot role or handling, difficulty and challenge dice are automatically placed if the current speed is greater than 0 (/!\ Challenge dices are not added automatically with the version 1.903 of the system)
  * If the vehicle has more than 1 weapon open a dialog to choose the weapon after use a crew action with a use weapon role
  * Add an action to recover stress after combat into utility tab
  * Vehicle weapons are always displayed. The setting option to display unequipped items is not used for these items
  * Display an error message if an action is not possible because something is missing (skill, weapon, ...)
* Fixes:
  * Refactoring code and remove deprecated functions for TAH version 2.x
  * Skill name is translated for the Dice pool dialog and the chat message

`12.2.0.1_903`

* Features:
  * Small update to be compatible with the last version of `Token Action HUD Core` 2.0.x

`12.1.1.1_903`

* Features:
  * Create the group `Crew skill`and move crew skill into
  * Display role name instead of the actor name for crew. Actor name displayed in the tooltip
  * Add image for combat and skill tabs
  * showtitle and grid settings by default for combat and skill tabs
* Fixes:
  * Fixe proficiency dices and ability dices when the actor is a minion

`12.1.0.1_903`

* Features:
  * Add vehicle actor sheet weapons
  * Add vehicle crew skills into skills
  * Add remsetback in dialog roll dices (waiting for the system use them now :D)
  * Handling from a vehicle add boost or setback dices for skill that use the pilot in the crew settings
