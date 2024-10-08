import { MapSet } from "@main/utils/MapSet";

const channels: MapSet<number> = new MapSet
export const getWebContentIds = (channel: string): Set<number> => {
    return channels[channel];
}

export const getAllChannel = (): MapSet<number> => {
    return channels;
}

export const bindListenerChannel = (channel: string, webContentId: number) => {
    if (!channels[channel]) {
        channels[channel] = [];
    }
    const index = channels[channel].findIndex(item => item === webContentId);
    if (index === -1) {
        channels[channel].push(webContentId)
    }
}
export const removeListenerChannel = (channel: string, webContentId: number) => {
    if (channels[channel]) {
        const index = channels[channel].findIndex(item => item === webContentId);
        if (index !== -1) {
            channels[channel].splice(index, 1);
        }
        if (channels[channel].length === 0) {
            delete channels[channel];
        }
    }
}