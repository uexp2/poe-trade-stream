exports.whisperFormatter = (poeStash, poeItem) => {
    return `@${poeStash.lastCharacterName} Hi, I would like to buy your ` +
            `${formatItemName(poeItem)} ${poeItem.note ? formatItemPrice(poeItem) + ' ' : ''}` +
            `in ${poeItem.league} `+
            `(stash tab "${poeStash.stash}"${poeItem.x != 217 ? `; position: left ${poeItem.x + 1}, top ${poeItem.y + 1}` : ''})`;
}

const formatItemName = (poeItem) => {
    return `${poeItem.name ?  poeItem.name + ' ': ''}${poeItem.typeLine}`
}

const formatItemPrice = (poeItem) => {
    let noteSplit = poeItem.note.split(' ');
    if (noteSplit[0] === '~price' || noteSplit[0] === '~b/o') {
        return `listed for ${noteSplit[1]} ${noteSplit[2]}`
    } else {
        return ''
    }
}

exports.formatItemName = formatItemName;
exports.formatItemPrice = formatItemPrice;