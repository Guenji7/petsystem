import * as alt from 'alt-server';
import * as chat from 'chat';

const animalModels = {
    boar: 'a_c_boar',
    cat: 'a_c_cat_01',
    chickenhawk: 'a_c_chickenhawk',
    chimp: 'a_c_chimp',
    chop: 'a_c_chop',
    cow: 'a_c_cow',
    coyote: 'a_c_coyote',
    deer: 'a_c_deer',
    husky: 'a_c_husky',
    lion: 'a_c_mtlion',
    panther: 'a_c_panther',
    pig: 'a_c_pig',
    poodle: 'a_c_poodle',
    rabbit: 'a_c_rabbit_01',
    rat: 'a_c_rat',
    retriever: 'a_c_retriever',
    rottweiler: 'a_c_rottweiler'
};

chat.registerCmd('pet', (player, [animalType]) => {
    if (!player?.valid) return;

    try {
        if (player.petHandle?.valid) {
            chat.send(player, `{FF0000}Du hast bereits ein Pet! (/despawnpet)`);
            return;
        }

        const model = animalModels[animalType?.toLowerCase()] || 'a_c_coyote';
        const spawnPos = player.pos.add(1, 1, 0);

        // Erstellen des Ped
        const pet = new alt.Ped(model, spawnPos, player.rot.z);
        player.petHandle = pet;

        // Warte auf den nächsten Tick, um die scriptID zu erhalten
        alt.nextTick(() => {
            if (!pet.valid) {
                chat.send(player, '{FF0000}Fehler: Pet ungültig!');
                return;
            }

            const scriptID = pet.scriptID;
            alt.log(`[SERVER] Pet Model: ${model}`);
            alt.log(`[SERVER] Pet Position: ${spawnPos}`);
            alt.log(`[SERVER] Pet Rotation: ${player.rot.z}`);
            alt.log(`[SERVER] Pet Object: ${JSON.stringify(pet)}`);
            alt.log(`[SERVER] Pet ScriptID: ${scriptID}`);

            if (scriptID === undefined || scriptID === null) {
                alt.logError(`[SERVER] Fehler: scriptID ist undefined oder null!`);
                chat.send(player, '{FF0000}Fehler: scriptID ist undefined oder null!');
                return;
            }

            alt.emitClient(player, 'pet:follow', scriptID);
            chat.send(player, `{00FF00}${model} erfolgreich gespawnt!`);
        });
    } catch (e) {
        alt.logError(e);
        chat.send(player, '{FF0000}Ungültiges Pet! Verfügbare: ' + Object.keys(animalModels).join(', '));
    }
});

// Despawn-Befehl
chat.registerCmd('despawnpet', (player) => {
    if (!player?.valid) return;

    if (player.petHandle?.valid) {
        player.petHandle.destroy();
        alt.emitClient(player, 'pet:despawn');
        chat.send(player, '{00FF00}Pet erfolgreich entfernt!');
    } else {
        chat.send(player, '{FF0000}Kein aktives Pet!');
    }
    player.petHandle = null;
});

// Cleanup bei Disconnect
alt.on('playerDisconnect', (player) => {
    if (player.petHandle?.valid) {
        player.petHandle.destroy();
        alt.emitClient(player, 'pet:despawn');
    }
});