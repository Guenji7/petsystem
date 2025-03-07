import * as alt from 'alt-client';
import * as native from 'natives';

let currentPet = null;
let followInterval = null;

alt.onServer('pet:follow', (scriptID) => {
    if (remoteID === undefined) {
        alt.log('[CLIENT] Fehler: remoteID ist undefined!');
        return;
    }

    // Warte 500 ms, bevor das Ped gesucht wird
    setTimeout(() => {
        const petEntity = alt.Ped.getByScriptID(scriptID);
        if (!petEntity?.valid) {
            alt.log('Pet nicht gefunden!');
            return;
        }
        startFollowing(petEntity);
    }, 500);
});
function startFollowing(petEntity) {
    const petId = petEntity.scriptID; // Extrahiere scriptID
    if (!petId) return;
    
    // Ped-Einstellungen
    native.setEntityAsMissionEntity(petId, true, true);
    native.setPedRelationshipGroupHash(petId, alt.hash('PLAYER'));
    native.setBlockingOfNonTemporaryEvents(petId, true);
    native.setPedFleeAttributes(petId, 0, false);
    native.setPedCombatAttributes(petId, 46, true); // Deaktiviere Angriffe

    if (followInterval) alt.clearInterval(followInterval);

    followInterval = alt.setInterval(() => {
        if (!native.doesEntityExist(petId) || !alt.Player.local) {
            alt.clearInterval(followInterval);
            return;
        }

        const playerPos = alt.Player.local.pos;
        const petPos = native.getEntityCoords(petId, true);
        
        // Teleport bei großer Distanz
        const dist = native.getDistanceBetweenCoords(
            playerPos.x, playerPos.y, playerPos.z,
            petPos.x, petPos.y, petPos.z,
            true
        );

        if (dist > 15.0) {
            const offsetPos = {
                x: playerPos.x + 1.5,
                y: playerPos.y + 1.5,
                z: playerPos.z
            };
            native.setEntityCoords(petId, offsetPos.x, offsetPos.y, offsetPos.z, false, false, false, false);
        }

        // Follow-Task
        native.taskFollowToOffsetOfEntity(
            petId,
            alt.Player.local.scriptID,
            1.5,   // X-Offset
            0.0,   // Y-Offset
            0.0,   // Z-Offset
            4.0,   // Geschwindigkeit
            -1,    // Timeout
            1.5,   // Stopping Distance
            true   // Persistent
        );
    }, 1500); // Update alle 1.5 Sekunden
}

// Despawn-Handler
alt.onServer('pet:despawn', () => {
    if (followInterval) {
        alt.clearInterval(followInterval);
        followInterval = null;
    }
    currentPet = null;
});

alt.on('disconnect', () => {
    if (followInterval) alt.clearInterval(followInterval);
});
