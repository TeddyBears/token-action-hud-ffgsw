export let RollHandler = null
import { get_dice_pool } from "../../../systems/starwarsffg/modules/helpers/dice-helpers.js";
import { skills as skillsList } from "../../../systems/starwarsffg/modules/config/ffg-skills.js";
//import { EffectCounter} from "../../statuscounter/module/api.js";
import { MODULE, STATUSEFFECT } from './constants.js'

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action click
         * Called by Token Action HUD Core when an action is left or right-clicked
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionClick(event) {
            const { actionType, actionId } = this.action.system;

            if (!this.actor) {
                for (const token of coreModule.api.Utils.getControlledTokens()) {
                    const actor = token.actor;
                    await this.handleAction(event, actionType, actor, token, actionId);
                }
            } else {
                await this.handleAction(event, actionType, this.actor, this.token, actionId);
            }
        }

        /**
         * Handle action hover
         * Called by Token Action HUD Core when an action is hovered on or off
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionHover(event, encodedValue) { }

        /**
         * Handle group click
         * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
         * @override
         * @param {object} event The event
         * @param {object} group The group
         */
        async handleGroupClick(event, group) { }

        /**
         * Handle action
         * @private
         * @param {object} event
         * @param {string} actionType
         * @param {object} actor
         * @param {object} token
         * @param {string} actionId
         */
        async handleAction(event, actionType, actor, token, actionId) {
            switch (actionType) {
                case "crewSkill":
                    this.crewAction(event, actor, actionId); break;
                case "weapon":
                    this.weaponAction(event, actor, actionId);
                    break;
                case "shipweapon":
                    this.vehicleWeaponAction(event, actor, actionId); break;
                case "skill":
                    this.rollSkill(event, actor, actionId); break;
                    break;
                case "utility":
                    await this.performUtilityAction(event, actor, token, actionId); break;
                case "macro":
                    await this.macroAction(event, actor, token, actionId); break;
                default:
                    break;
            }
        }

        /**
         * Use Weapon
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        async weaponAction(event, actor, actionId) {
            const weapon = coreModule.api.Utils.getItem(actor, actionId);

            const cardData = {
                "crew": {
                    "name": this.actor.name,
                    "img": this.actor.img,
                    "crew_card": true,
                    "role": "",
                }
            }
            this.rollSkill(event, this.actor, weapon.system.skill.value, foundry.utils.mergeObject(weapon, cardData), { 'difficulty': 2 }, weapon)
        }

        /**
         * Handle item vehicle action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor (the vehicle)
         * @param {string} actionId The action id
         */
        async vehicleWeaponAction(event, vehicle, actionId) {
            const weapon = vehicle.items.get(actionId);

            // validate the weapon still exists
            if (!weapon) {
                ui.notifications.warn(game.i18n.localize("SWFFG.Crew.Weapon.Removed"));
                return;
            }

            const crew = await vehicle.getFlag("starwarsffg", "crew");

            try {
                // validate the vehicle has a crew and there is a role that matches the weapon skill
                if (!crew || crew.length === 0) {
                    ui.notifications.warn(game.i18n.localize("tokenActionHud.error.CrewMiss"));
                    return null
                }

                const skillRoles = game.settings.get("starwarsffg", "arrayCrewRoles").filter(role => role.role_skill === weapon.system.skill.value);
                const crewGunners = crew.filter(member => skillRoles.some(role => role.role_name === member.role));
                if (crewGunners.length === 0) {
                    ui.notifications.warn(game.i18n.format("tokenActionHud.error.crewWeaponSkillMiss", { skilllabel: game.i18n.localize("SWFFG.SkillsName" + weapon.system.skill.value) }));
                    return null

                } else if (crewGunners.length > 1) {
                    // create a dialog to ask the user which crew member should use the weapon
                    const crewMembers = []

                    for (let i = 0; i < crewGunners.length; i++) {
                        const actor = game.actors.get(crewGunners[i].actor_id);
                        const img = actor?.img ? actor.img : "icons/svg/mystery-man.svg";

                        crewMembers[i] =
                        {
                            label: `<img src="${img}" style="max-height: 30px;margin-right:10px;vertical-align:middle;">` + crewGunners[i].actor_name,
                            action: crewGunners[i].actor_id,
                            callback: async () => {
                                await this.rollVehicleGunnery(event, crewGunners[i].actor_id, crewGunners[i].actor_role, actionId);
                            }
                        }
                    }
                    const dialog = await foundry.applications.api.DialogV2.wait({
                        window: {
                            title: game.i18n.localize("SWFFG.Crew.Roles.Weapon.Description"),
                            icon: "fa-solid fa-space-station-moon"
                        },
                        content: "",
                        modal: true,
                        rejectClose: false,
                        buttons: crewMembers
                    });

                } else {
                    await this.rollVehicleGunnery(event, crewGunners[0].actor_id, crewGunners[0].actor_role, actionId);
                }
            } catch (error) {
                coreModule.api.Logger.error(actionId, error.message)
                coreModule.api.Logger.error(error)
                return null
            }
        }

        /**
        * Handle crew action
        * @private
        * @param {object} event    The event
        * @param {object} actor    The actor
        * @param {string} actionId The action id
        */
        async crewAction(event, actor, actionId) {
            const [crewId, crewRole] = actionId.split(this.delimiter);
            const crewActor = game.actors.get(crewId);
            const role = game.settings.get("starwarsffg", "arrayCrewRoles").filter(role => role.role_name === crewRole);
            try {
                if (crewRole === "Pilot" || role[0]?.use_handling == true) {
                    this.rollVehiclePilot(event, actor, crewId, crewRole, role)

                } else if (role[0].use_weapons == true) {
                    const items = Array.from(coreModule.api.Utils.sortItemsByName(this.actor.items).values())
                    const weapons = items.filter((weapon => weapon.type === "shipweapon"))
                    if (weapons.length === 0) {
                        ui.notifications.warn(game.i18n.localize("tokenActionHud.error.weaponMiss"));
                        return

                    } else if (weapons.length > 1) {
                        // create a dialog to ask the user which weapon should be used
                        const vehicleWeapon = []

                        for (let i = 0; i < weapons.length; i++) {
                            const img = weapons[i]?.img ? weapons[i]?.img : "icons/svg/mystery-man.svg";
                            vehicleWeapon[i] =
                            {
                                label: `<img src="${img}" style="max-height: 30px;margin-right:10px;vertical-align:middle;">` + weapons[i].name,
                                action: weapons[i].id,
                                callback: async () => {
                                    await this.rollVehicleGunnery(event, crewId, crewRole, weapons[i].id);
                                }
                            }
                        }
                        const dialog = await foundry.applications.api.DialogV2.wait({
                            window: {
                                title: game.i18n.localize("SWFFG.Crew.Roles.Weapon.Description"),
                                icon: "fa-solid fa-space-station-moon"
                            },
                            content: "",
                            modal: true,
                            rejectClose: false,
                            buttons: vehicleWeapon
                        });

                    } else {
                        await this.rollVehicleGunnery(event, crewId, crewRole, weapons[0].id);
                    }
                } else {
                    // create chat card data for the vehicle
                    const cardData = {
                        "crew": {
                            "name": actor.name,
                            "img": actor.img,
                            "crew_card": true,
                            "role": crewRole,
                        }
                    };
                    this.rollSkill(event, crewActor, role[0].role_skill, cardData)
                }
            } catch (error) {
                coreModule.api.Logger.error(actionId, error.message)
                coreModule.api.Logger.error(error)
                return null
            }
        }

        /**
         * Handle skill action
         * @private
         * @param {object} event        The event
         * @param {object} actor        The actor
         * @param {string} skillId      The skill id
         * @param {object} cardData     The card data
         * @param {object} startingPool The startingPool
         * @param {object} weapon       The weapon
         */
        async rollSkill(event, actor, skillId, cardData = null, startingPool = { 'difficulty': 2 }, weapon) {

            const actorSheet = await actor.sheet.getData();
            let pool = new DicePoolFFG(startingPool);
            const skillName = skillsList[skillId]?.label ? skillsList[skillId].label : actor.system.skills[skillId].label

            pool = get_dice_pool(actor.id, skillId, pool)

            if (actor.type === "minion") {
                if (actor.system.skills[skillId].groupskill) {

                    let skillRank = actor.system.skills[skillId].rank;
                    let characteristicValue = actor.system.characteristics[actor.system.skills[skillId].characteristic].value
                    let ability = Math.max(characteristicValue, skillRank) - Math.min(characteristicValue, skillRank);
                    let proficiency = Math.min(characteristicValue, skillRank);
                    pool.proficiency = proficiency
                    pool.ability = ability
                }
            }
            if (weapon) {
                pool = await this.getWeaponPoolModifiers(weapon, pool, actor.system.skills[skillId])
            }

            if (game.settings.get(MODULE.ID, "tahst-dicesroll") == true) {
                const token = actor.getActiveTokens()
                pool = await this.poolWithEffect(pool, token[0])
            }

            await game.ffg.DiceHelpers.displayRollDialog(
                actorSheet,
                pool,
                `${game.i18n.localize("SWFFG.Rolling")} ${game.i18n.localize(skillName)}`,
                game.i18n.localize(skillName),
                cardData
            );
        }

        /**
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor (the gunner)
         * @param {string} actionId The action id
         */
        async rollVehicleGunnery(event, crewId, crewRole, weaponId) {
            const weapon = coreModule.api.Utils.getItem(this.actor, weaponId);
            // create chat card data
            const cardData = {
                "crew": {
                    "name": this.actor.name,
                    "img": this.actor.img,
                    "crew_card": true,
                    "role": crewRole,
                }
            }
            var startingPool = { 'difficulty': 2 }
            this.rollSkill(event, game.actors.get(crewId), weapon.system.skill.value, foundry.utils.mergeObject(weapon, cardData), startingPool, weapon)
        }

        /**
         * @private
         * @param {object} event    The event
         * @param {object} vehicle  The vehicle
         * @param {string} crewId   The pilot id
         * @param {object} crewRole The crew role name
         * @param {object} roleData     The role data
         */
        async rollVehiclePilot(event, vehicle, crewId, crewRole, roleData) {

            var handling = vehicle?.system?.stats?.handling?.value;
            var currentSpeed = vehicle?.system?.stats?.speed?.value;
            var silhouette = vehicle?.system?.stats?.silhouette?.value;
            var skill = ""
            const startingPool = { "difficulty": 2 }

            // add modifiers from the vehicle handling
            if (handling > 0) {
                startingPool['boost'] = handling;
            } else if (handling < 0) {
                startingPool['setback'] = Math.abs(handling);
            }

            // Set difficulty from current speed and silhouette
            if (currentSpeed > 0) {
                startingPool['challenge'] = Math.min(silhouette / 2, currentSpeed)
                startingPool['difficulty'] = Math.max(silhouette / 2, currentSpeed) - startingPool['challenge']
            }

            // Set skill
            if (roleData[0]?.role_skill) {
                skill = roleData[0]?.role_skill;
            } else if (vehicle?.system?.spaceShip) {
                skill = "Piloting: Space";
            } else {
                skill = "Piloting: Planetary";
            }
            const cardData = {
                "crew": {
                    "name": this.actor.name,
                    "img": this.actor.img,
                    "crew_card": true,
                    "role": crewRole,
                }
            }
            this.rollSkill(event, game.actors.get(crewId), skill, cardData, startingPool)
        }

        async macroAction(event, actor, token, actionId) {
            try {
                const command = await fetch("modules/" + MODULE.ID + "/content/macros/" + actionId + ".js")
                if (!command.ok) {
                    coreModule.api.Logger.error("No file found for the macro '" + actionId + "'")
                    ui.notifications.warn(game.i18n.localize("tokenActionHud.error.macroCommandMiss"));
                    return null
                }
                const MacroData = {
                    //_id: "";
                    name: game.i18n.localize(actionId),
                    type: "script",
                    author: "",
                    scope: "global",
                    command: await command.text()
                }
                const scope = {
                    "name": MacroData.name,
                    "tokens": token,
                    "event": event
                }
                const macro = new Macro(MacroData).execute(scope)
            } catch (error) {
                coreModule.api.Logger.error(actionId, error.message)
                coreModule.api.Logger.error(error)
                return null
            }
        }

        async poolWithEffect(pool, token) {
            if (!game.modules.get("statuscounter").active) {
                ui.notifications.warn(`${game.i18n.localize(MODULE.localizeID + ".error.statuscounter")}`);
                return pool
            }

            for (const [id, effectData] of Object.entries(STATUSEFFECT)) {
                if (effectData.pooleffectdice) {

                    let addedValue = ActiveEffectCounter.getCounters(token).find(effect => effect.counter.parent.statuses.first() === effectData.id)?.getValue();
                    if (effectData.pooleffectaction === "add" && addedValue > 0) {
                        pool[effectData.pooleffectdice] += addedValue > 0 ? addedValue : 0
                    } else {
                        pool[effectData.pooleffectdice] -= addedValue > 0 ? addedValue : 0
                    }

                }
            }

            return pool
        }

        async getWeaponPoolModifiers(weapon, pool, skill) {
            if (weapon?.type === "weapon" || weapon?.type === "shipweapon") {
                const status = game.ffg.DiceHelpers.getWeaponStatus(weapon);
                let defenseDice = game.ffg.DiceHelpers.getDefenseDice(skill, weapon);
                pool.difficulty += status.difficulty
                pool.setback += status.setback + defenseDice
                pool = new DicePoolFFG(await game.ffg.DiceHelpers.getModifiers(pool, weapon));

            }
            return pool
        }




    }
})
