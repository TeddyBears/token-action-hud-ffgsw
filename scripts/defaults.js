import { GROUP } from './constants.js'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = GROUP
    Object.values(groups).forEach(group => {
        group.name = coreModule.api.Utils.i18n(group.name)
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
    })
    const groupsArray = Object.values(groups)
    DEFAULTS = {
        layout: [
            {
                nestId: 'inventory',
                id: 'inventory',
                name: game.i18n.localize('SWFFG.Combat'),
                groups: [
                    { ...groups.weapons, nestId: 'inventory_weapon' },
                    { ...groups.combatsw, nestId: 'inventory_combat' }
                    // { ...groups.armour, nestId: 'inventory_armour' },
                    // { ...groups.gear, nestId: 'inventory_gear' },
                    // { ...groups.consumables, nestId: 'inventory_consumables' }
                ]
            },
            {
                nestId: 'skills',
                id: 'skills',
                name: game.i18n.localize('SWFFG.Skills'),
                groups: [
                    { ...groups.general, nestId: 'skills_general' },                    
                    { ...groups.social, nestId: 'skills_social' },                    
                    { ...groups.knowledge, nestId: 'skills_knowledge' }
                   
                ]
            },
            {
                nestId: 'utility',
                id: 'utility',
                name: game.i18n.localize('tokenActionHud.utility'),
                groups: [
                    { ...groups.combat, nestId: 'utility_combat' },
                    { ...groups.token, nestId: 'utility_token' },
                    { ...groups.rests, nestId: 'utility_rests' },
                    { ...groups.utility, nestId: 'utility_utility' }
                ]
            }
        ],
        groups: groupsArray
    }
})
